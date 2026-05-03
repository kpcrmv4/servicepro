import { PageHeader } from '@/components/layout/page-header';
import { listAllSubscriptionInvoices } from '@/lib/actions/subscription';
import { InvoicesTable } from '@/components/super-admin/subscription-invoices-table';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SubscriptionInvoicesPage() {
  const invoices = await listAllSubscriptionInvoices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="ใบแจ้งหนี้ค่าสมาชิก"
        description="จัดการใบแจ้งหนี้ต่ออายุของทุก tenant — ยืนยันการชำระเงิน ส่งแจ้งเตือนซ้ำ หรือสร้างใบแจ้งหนี้ใหม่"
        action={
          <Link
            href="/super-admin/subscriptions"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Link>
        }
      />
      <div className="px-4 sm:px-6">
        <InvoicesTable initialInvoices={invoices} />
      </div>
    </div>
  );
}
