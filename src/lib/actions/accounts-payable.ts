'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserInfo } from '@/lib/actions/auth-helpers';

interface SupplierInvoiceInput {
  supplierId: string;
  invoiceNumber: string;
  reference?: string;
  purchaseOrderId?: string;
  invoiceDate: string;          // 'YYYY-MM-DD'
  dueDate: string;              // 'YYYY-MM-DD'
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  documentUrl?: string;
}

function validate(input: SupplierInvoiceInput): string | null {
  if (!input.supplierId) return 'กรุณาเลือก supplier';
  if (!input.invoiceNumber?.trim()) return 'กรุณากรอกเลขที่ใบกำกับภาษี';
  if (!input.invoiceDate) return 'กรุณาเลือกวันที่ใบกำกับ';
  if (!input.dueDate) return 'กรุณาเลือกวันครบกำหนด';
  if (input.total <= 0) return 'ยอดรวมต้องมากกว่า 0';
  return null;
}

export async function listSupplierInvoices(filter?: { status?: string; supplierId?: string }) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return [];

  let q = supabase
    .from('supplier_invoices')
    .select('*, supplier:suppliers(id, name, contact_person, phone), purchase_order:purchase_orders(id, po_number)')
    .eq('tenant_id', userInfo.tenant_id)
    .order('due_date', { ascending: true });

  if (filter?.status) q = q.eq('status', filter.status);
  if (filter?.supplierId) q = q.eq('supplier_id', filter.supplierId);
  const { data } = await q;
  return data || [];
}

export async function getSupplierInvoice(id: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;
  const { data } = await supabase
    .from('supplier_invoices')
    .select('*, supplier:suppliers(*), payments:supplier_payments(*)')
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id)
    .single();
  return data;
}

export async function createSupplierInvoice(input: SupplierInvoiceInput) {
  const v = validate(input);
  if (v) return { error: v };

  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };

  const { data, error } = await supabase
    .from('supplier_invoices')
    .insert({
      tenant_id: userInfo.tenant_id,
      supplier_id: input.supplierId,
      invoice_number: input.invoiceNumber,
      reference: input.reference || null,
      purchase_order_id: input.purchaseOrderId || null,
      invoice_date: input.invoiceDate,
      due_date: input.dueDate,
      subtotal: input.subtotal,
      vat: input.vat,
      total: input.total,
      amount_paid: 0,
      status: 'pending',
      notes: input.notes || null,
      document_url: input.documentUrl || null,
      created_by: userInfo.id,
    })
    .select()
    .single();
  if (error) return { error: error.message };
  revalidatePath('/dashboard/finance');
  return { success: true, invoice: data };
}

export async function recordSupplierPayment(input: {
  supplierInvoiceId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer' | 'credit_card' | 'promptpay';
  paidAt?: string;
  reference?: string;
  paymentSlipUrl?: string;
  notes?: string;
}) {
  if (input.amount <= 0) return { error: 'จำนวนเงินต้องมากกว่า 0' };
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };

  const { data: inv } = await supabase
    .from('supplier_invoices')
    .select('id, tenant_id, total, amount_paid, status')
    .eq('id', input.supplierInvoiceId)
    .eq('tenant_id', userInfo.tenant_id)
    .single();
  if (!inv) return { error: 'ไม่พบใบแจ้งหนี้' };
  if (inv.status === 'paid' || inv.status === 'cancelled') {
    return { error: 'ใบแจ้งหนี้นี้ปิดแล้ว' };
  }

  const newPaid = Number(inv.amount_paid) + input.amount;
  const total = Number(inv.total);
  const remaining = total - newPaid;
  const newStatus = remaining <= 0.01 ? 'paid' : 'partial';

  // 1. Insert payment row
  const { error: pErr } = await supabase.from('supplier_payments').insert({
    tenant_id: userInfo.tenant_id,
    supplier_invoice_id: input.supplierInvoiceId,
    paid_at: input.paidAt || new Date().toISOString().slice(0, 10),
    amount: input.amount,
    payment_method: input.paymentMethod,
    reference: input.reference || null,
    payment_slip_url: input.paymentSlipUrl || null,
    notes: input.notes || null,
    created_by: userInfo.id,
  });
  if (pErr) return { error: pErr.message };

  // 2. Update invoice
  await supabase
    .from('supplier_invoices')
    .update({ amount_paid: newPaid, status: newStatus })
    .eq('id', input.supplierInvoiceId);

  revalidatePath('/dashboard/finance');
  return { success: true };
}

export async function cancelSupplierInvoice(id: string, reason?: string) {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return { error: 'ไม่มีสิทธิ์' };
  const { error } = await supabase
    .from('supplier_invoices')
    .update({ status: 'cancelled', notes: reason || null })
    .eq('id', id)
    .eq('tenant_id', userInfo.tenant_id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/finance');
  return { success: true };
}

// AP aging report — counts of pending invoices by bucket
export async function getApAgingReport() {
  const supabase = await createClient();
  const userInfo = await getUserInfo();
  if (!userInfo?.tenant_id) return null;

  const { data } = await supabase
    .from('supplier_invoices')
    .select('id, total, amount_paid, due_date, status')
    .eq('tenant_id', userInfo.tenant_id)
    .in('status', ['pending', 'partial', 'overdue']);

  if (!data) return null;

  const today = new Date();
  const buckets = { current: 0, d30: 0, d60: 0, d90: 0, over: 0 };
  let totalOutstanding = 0;
  for (const inv of data) {
    const remaining = Number(inv.total) - Number(inv.amount_paid);
    totalOutstanding += remaining;
    const due = new Date(inv.due_date as string);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
    if (daysOverdue <= 0) buckets.current += remaining;
    else if (daysOverdue <= 30) buckets.d30 += remaining;
    else if (daysOverdue <= 60) buckets.d60 += remaining;
    else if (daysOverdue <= 90) buckets.d90 += remaining;
    else buckets.over += remaining;
  }
  return { totalOutstanding, ...buckets, count: data.length };
}
