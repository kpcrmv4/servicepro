'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
