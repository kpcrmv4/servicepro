'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyExpenseDue } from '@/lib/notifications/triggers'

async function getUserInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('users').select('id, tenant_id, role').eq('id', user.id).single()
  return profile
}

export async function getInvoices(filters?: { status?: string; search?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('invoices')
    .select(`
      *,
      customers(name, phone),
      jobs(job_number, description),
      created_by_user:users!invoices_created_by_fkey(full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('payment_status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`invoice_number.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data || []
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', userInfo.tenant_id)

  const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const subtotal = Number(formData.get('subtotal')) || 0
  const discount = Number(formData.get('discount')) || 0
  const vat = Number(formData.get('vat')) || 0
  const total = subtotal - discount + vat

  const { error } = await supabase.from('invoices').insert({
    tenant_id: userInfo.tenant_id,
    invoice_number: invoiceNumber,
    job_id: formData.get('job_id') as string || null,
    customer_id: formData.get('customer_id') as string,
    items: JSON.parse(formData.get('items') as string || '[]'),
    subtotal,
    discount,
    vat,
    total,
    payment_status: 'pending',
    due_date: formData.get('due_date') as string || null,
    notes: formData.get('notes') as string || null,
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function getReceipts() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('receipts')
    .select(`
      *,
      invoices(invoice_number, total, customers(name)),
      created_by_user:users!receipts_created_by_fkey(full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createReceipt(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { count } = await supabase
    .from('receipts')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', userInfo.tenant_id)

  const receiptNumber = `REC-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

  const { error } = await supabase.from('receipts').insert({
    tenant_id: userInfo.tenant_id,
    receipt_number: receiptNumber,
    invoice_id: formData.get('invoice_id') as string,
    amount: Number(formData.get('amount')) || 0,
    payment_method: (formData.get('payment_method') as string) || 'cash',
    reference: formData.get('reference') as string || null,
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }

  // Update invoice payment status
  const invoiceId = formData.get('invoice_id') as string
  if (invoiceId) {
    await supabase
      .from('invoices')
      .update({ payment_status: 'paid' })
      .eq('id', invoiceId)
  }

  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function getExpenses(filters?: { category?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('expenses')
    .select('*, created_by_user:users!expenses_created_by_fkey(full_name)')
    .eq('tenant_id', userInfo.tenant_id)
    .order('date', { ascending: false })

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  const { data } = await query
  return data || []
}

export async function createExpense(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase.from('expenses').insert({
    tenant_id: userInfo.tenant_id,
    category: formData.get('category') as string,
    description: formData.get('description') as string,
    amount: Number(formData.get('amount')) || 0,
    date: formData.get('date') as string || new Date().toISOString().split('T')[0],
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function getFinanceOverview() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const monthStr = thisMonth.toISOString()

  // Revenue (paid invoices this month)
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('total')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('payment_status', 'paid')
    .gte('created_at', monthStr)

  const revenue = paidInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0

  // Expenses this month
  const { data: monthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .eq('tenant_id', userInfo.tenant_id)
    .gte('date', thisMonth.toISOString().split('T')[0])

  const expenses = monthExpenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0

  // Pending invoices
  const { data: pending } = await supabase
    .from('invoices')
    .select('total')
    .eq('tenant_id', userInfo.tenant_id)
    .in('payment_status', ['pending', 'partial'])

  const pendingAmount = pending?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    pendingAmount,
    pendingCount: pending?.length || 0,
  }
}

// =============================================================================
// Recurring Expenses
// =============================================================================

export async function getRecurringExpenses() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('recurring_expenses')
    .select('*, created_by_user:users!recurring_expenses_created_by_fkey(full_name)')
    .eq('tenant_id', userInfo.tenant_id)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createRecurringExpense(formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const type = formData.get('type') as string || 'fixed'
  const amount = type === 'fixed' ? (Number(formData.get('amount')) || 0) : null

  const { error } = await supabase.from('recurring_expenses').insert({
    tenant_id: userInfo.tenant_id,
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    type,
    amount,
    day_of_month: Number(formData.get('day_of_month')) || 1,
    is_active: true,
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function updateRecurringExpense(id: string, formData: FormData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const type = formData.get('type') as string || 'fixed'
  const amount = type === 'fixed' ? (Number(formData.get('amount')) || 0) : null

  const { error } = await supabase
    .from('recurring_expenses')
    .update({
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      type,
      amount,
      day_of_month: Number(formData.get('day_of_month')) || 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function toggleRecurringExpense(id: string, isActive: boolean) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function generateFixedExpenseNow(recurringExpenseId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Fetch the recurring expense
  const { data: recurring } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', recurringExpenseId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!recurring) return { error: 'ไม่พบค่าใช้จ่ายประจำ' }
  if (recurring.type !== 'fixed') return { error: 'ใช้ได้เฉพาะค่าใช้จ่ายคงที่เท่านั้น' }

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  if (recurring.last_generated_month === currentMonth) {
    return { error: 'ค่าใช้จ่ายเดือนนี้ถูกสร้างแล้ว' }
  }

  // Create expense entry
  const { error: expenseError } = await supabase.from('expenses').insert({
    tenant_id: userInfo.tenant_id,
    category: recurring.category,
    description: `${recurring.name} (ประจำเดือน ${currentMonth})`,
    amount: recurring.amount,
    date: now.toISOString().split('T')[0],
    created_by: userInfo.id,
  })

  if (expenseError) return { error: expenseError.message }

  // Update last_generated_month
  await supabase
    .from('recurring_expenses')
    .update({ last_generated_month: currentMonth, updated_at: new Date().toISOString() })
    .eq('id', recurringExpenseId)

  revalidatePath('/dashboard/finance')
  return { success: true }
}

export async function processRecurringExpenses() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Fetch active recurring expenses due today
  const { data: recurringExpenses } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('is_active', true)
    .eq('day_of_month', currentDay)
    .or(`last_generated_month.is.null,last_generated_month.neq.${currentMonth}`)

  if (!recurringExpenses || recurringExpenses.length === 0) {
    return { success: true, message: 'ไม่มีค่าใช้จ่ายประจำที่ครบกำหนดวันนี้' }
  }

  let generated = 0
  let notified = 0

  for (const recurring of recurringExpenses) {
    if (recurring.type === 'fixed' && recurring.amount) {
      // Auto-create expense for fixed type
      await supabase.from('expenses').insert({
        tenant_id: userInfo.tenant_id,
        category: recurring.category,
        description: `${recurring.name} (ประจำเดือน ${currentMonth})`,
        amount: recurring.amount,
        date: now.toISOString().split('T')[0],
        created_by: recurring.created_by,
      })

      await supabase
        .from('recurring_expenses')
        .update({ last_generated_month: currentMonth, updated_at: new Date().toISOString() })
        .eq('id', recurring.id)

      generated++
    } else if (recurring.type === 'variable') {
      // Send notification for variable type
      await notifyExpenseDue({
        tenantId: userInfo.tenant_id,
        expenseName: recurring.name,
        category: recurring.category,
        recurringExpenseId: recurring.id,
      })
      notified++
    }
  }

  revalidatePath('/dashboard/finance')
  return { success: true, generated, notified }
}

export async function recordVariableExpense(recurringExpenseId: string, amount: number) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  const { data: recurring } = await supabase
    .from('recurring_expenses')
    .select('*')
    .eq('id', recurringExpenseId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!recurring) return { error: 'ไม่พบค่าใช้จ่ายประจำ' }

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { error } = await supabase.from('expenses').insert({
    tenant_id: userInfo.tenant_id,
    category: recurring.category,
    description: `${recurring.name} (ประจำเดือน ${currentMonth})`,
    amount,
    date: now.toISOString().split('T')[0],
    created_by: userInfo.id,
  })

  if (error) return { error: error.message }

  await supabase
    .from('recurring_expenses')
    .update({ last_generated_month: currentMonth, updated_at: new Date().toISOString() })
    .eq('id', recurringExpenseId)

  revalidatePath('/dashboard/finance')
  return { success: true }
}

// =============================================================================
// Get pending invoices for receipt creation (unpaid/partial)
// =============================================================================

export async function getPendingInvoices() {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total,
      payment_status,
      customers(name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .in('payment_status', ['pending', 'partial'])
    .order('created_at', { ascending: false })

  return data || []
}
