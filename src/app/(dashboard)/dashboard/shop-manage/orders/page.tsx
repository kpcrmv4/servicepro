import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { listOrders } from '@/lib/actions/shop';
import { OrdersTable } from '@/components/shop/orders-table';

export default async function ShopOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const orders = await listOrders({ status: params.status });
  return (
    <div className="space-y-6">
      <PageHeader
        title="คำสั่งซื้อร้านค้าออนไลน์"
        action={
          <Link
            href="/dashboard/shop-manage"
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> กลับ
          </Link>
        }
      />
      <div className="px-4 sm:px-6">
        <OrdersTable initialOrders={orders as never[]} initialStatus={params.status || 'pending'} />
      </div>
    </div>
  );
}
