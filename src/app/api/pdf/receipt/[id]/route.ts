import { NextRequest } from 'next/server';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ReceiptPdf } from '@/lib/pdf/receipt';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  if (!profile?.tenant_id) return new Response('Forbidden', { status: 403 });

  const { data: receipt } = await supabase
    .from('receipts')
    .select(
      `
      *,
      invoice:invoices(invoice_number, customer:customers(name, phone))
    `,
    )
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();
  if (!receipt) return new Response('Not found', { status: 404 });

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, address, phone, tax_id, settings')
    .eq('id', profile.tenant_id)
    .single();
  const brand = (tenant?.settings as Record<string, unknown> | null)?.brand as
    | { primary_color?: string; logo_url?: string | null }
    | undefined;

  const invoiceRaw = receipt.invoice as unknown;
  const invoice = (Array.isArray(invoiceRaw) ? invoiceRaw[0] : invoiceRaw) as
    | { invoice_number: string; customer: unknown }
    | null;
  const customerRaw = invoice?.customer as unknown;
  const customer = (Array.isArray(customerRaw) ? customerRaw[0] : customerRaw) as
    | { name: string; phone: string | null }
    | null;

  const buffer = await renderToBuffer(
    createElement(ReceiptPdf, {
      shop: {
        name: tenant?.name || 'Shop',
        address: tenant?.address ?? null,
        phone: tenant?.phone ?? null,
        tax_id: tenant?.tax_id ?? null,
        logo_url: brand?.logo_url ?? null,
        primary_color: brand?.primary_color ?? null,
      },
      receipt: {
        receipt_number: receipt.receipt_number as string,
        issue_date: receipt.created_at as string,
        invoice_number: invoice?.invoice_number || null,
        amount: Number(receipt.amount) || 0,
        payment_method: receipt.payment_method as string,
        reference: (receipt.reference as string) || null,
        notes: (receipt.notes as string) || null,
      },
      customer: {
        name: customer?.name || '-',
        phone: customer?.phone ?? null,
      },
    }) as unknown as ReactElement<DocumentProps>,
  );

  return new Response(buffer as unknown as BlobPart, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${receipt.receipt_number}.pdf"`,
    },
  });
}
