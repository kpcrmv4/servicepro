import { NextRequest } from 'next/server';
import type { DocumentProps } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { createElement, type ReactElement } from 'react';
import { createClient } from '@/lib/supabase/server';
import { QuotationPdf } from '@/lib/pdf/quotation';

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

  const { data: quotation } = await supabase
    .from('quotations')
    .select(
      `
      *,
      job:jobs(id, customer:customers(name, phone), vehicle:vehicles(license_plate, brand, model))
    `,
    )
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();
  if (!quotation) return new Response('Not found', { status: 404 });

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, address, phone, tax_id')
    .eq('id', profile.tenant_id)
    .single();

  const jobRaw = quotation.job as unknown;
  const job = (Array.isArray(jobRaw) ? jobRaw[0] : jobRaw) as
    | { customer: unknown; vehicle: unknown }
    | null;
  const customerRaw = job?.customer as unknown;
  const customer = (Array.isArray(customerRaw) ? customerRaw[0] : customerRaw) as
    | { name: string; phone: string | null }
    | null;
  const vehicleRaw = job?.vehicle as unknown;
  const vehicle = (Array.isArray(vehicleRaw) ? vehicleRaw[0] : vehicleRaw) as
    | { license_plate: string | null; brand: string | null; model: string | null }
    | null;

  const items = (quotation.items as Array<{
    type: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount?: number;
  }>) || [];

  const buffer = await renderToBuffer(
    createElement(QuotationPdf, {
      shop: {
        name: tenant?.name || 'Shop',
        address: tenant?.address ?? null,
        phone: tenant?.phone ?? null,
        tax_id: tenant?.tax_id ?? null,
      },
      quotation: {
        quotation_number: quotation.quotation_number as string,
        issue_date: quotation.created_at as string,
        valid_until: (quotation.valid_until as string) || null,
        items,
        subtotal: Number(quotation.subtotal) || 0,
        vat: Number(quotation.vat) || 0,
        total: Number(quotation.total) || 0,
        notes: (quotation.notes as string) || null,
      },
      customer: {
        name: customer?.name || '-',
        phone: customer?.phone ?? null,
      },
      vehicle: vehicle ?? undefined,
    }) as unknown as ReactElement<DocumentProps>,
  );

  return new Response(buffer as unknown as BlobPart, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${quotation.quotation_number}.pdf"`,
    },
  });
}
