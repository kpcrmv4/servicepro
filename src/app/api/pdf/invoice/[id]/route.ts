import { NextRequest } from 'next/server';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { InvoicePdf } from '@/lib/pdf/invoice';

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

  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      `
      *,
      customer:customers(name, phone, address),
      job:jobs(id, job_number, vehicle:vehicles(license_plate, brand, model))
    `,
    )
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();
  if (!invoice) return new Response('Not found', { status: 404 });

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, address, phone, tax_id')
    .eq('id', profile.tenant_id)
    .single();

  const customerRaw = invoice.customer as unknown;
  const customer = (Array.isArray(customerRaw) ? customerRaw[0] : customerRaw) as
    | { name: string; phone: string | null; address: string | null }
    | null;
  const jobRaw = invoice.job as unknown;
  const job = (Array.isArray(jobRaw) ? jobRaw[0] : jobRaw) as
    | { id: string; job_number: string; vehicle: unknown }
    | null;
  const vehicleRaw = job?.vehicle as unknown;
  const vehicle = (Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw) as
    | { license_plate: string | null; brand: string | null; model: string | null }
    | null;

  const items = (invoice.items as Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>) || [];

  const buffer = await renderToBuffer(
    createElement(InvoicePdf, {
      shop: {
        name: tenant?.name || 'Shop',
        address: tenant?.address ?? null,
        phone: tenant?.phone ?? null,
        tax_id: tenant?.tax_id ?? null,
      },
      invoice: {
        invoice_number: invoice.invoice_number as string,
        issue_date: invoice.created_at as string,
        due_date: (invoice.due_date as string) || null,
        items,
        subtotal: Number(invoice.subtotal) || 0,
        discount: Number(invoice.discount) || 0,
        vat: Number(invoice.vat) || 0,
        total: Number(invoice.total) || 0,
        notes: (invoice.notes as string) || null,
      },
      customer: {
        name: customer?.name || '-',
        phone: customer?.phone ?? null,
        address: customer?.address ?? null,
      },
      vehicle: vehicle ?? undefined,
      jobNumber: job?.job_number ?? null,
    }) as unknown as ReactElement<DocumentProps>,
  );

  return new Response(buffer as unknown as BlobPart, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
