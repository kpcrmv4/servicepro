import { Store, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { listProducts, listOrders } from '@/lib/actions/shop';
import { createClient } from '@/lib/supabase/server';
import { ProductsTable } from '@/components/shop/products-table';

export default async function ShopManagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">กรุณาเข้าสู่ระบบ</div>;

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  const { data: tenant } = await supabase
    .from('tenants')
    .select('slug, plan')
    .eq('id', profile?.tenant_id ?? '')
    .single();

  if (tenant?.plan !== 'premium') {
    return (
      <div className="space-y-6">
        <PageHeader title="ร้านค้าออนไลน์" />
        <div className="mx-4 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center">
          <Store className="mx-auto h-10 w-10 text-amber-600" />
          <h2 className="mt-4 text-base font-bold text-amber-800">
            ฟีเจอร์นี้รองรับเฉพาะแพลน Premium
          </h2>
        </div>
      </div>
    );
  }

  const [products, orders] = await Promise.all([listProducts(), listOrders()]);
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="จัดการร้านค้าออนไลน์"
        description="เพิ่มสินค้า ดูคำสั่งซื้อ และเปิดให้ลูกค้าซื้อผ่านเว็บ"
        action={
          <div className="flex gap-2">
            <Link
              href="/dashboard/shop-manage/orders"
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              <ShoppingBag className="h-4 w-4" />
              คำสั่งซื้อ
              {pendingOrders > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
                  {pendingOrders}
                </span>
              )}
            </Link>
            {tenant?.slug && (
              <Link
                href={`/shop/${tenant.slug}/products`}
                target="_blank"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
              >
                <Store className="h-4 w-4" /> ดูหน้าร้าน
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <Stat label="สินค้าทั้งหมด" value={products.length} icon={Package} />
        <Stat label="สินค้าวางขาย" value={products.filter((p) => p.is_active).length} icon={Store} />
        <Stat label="คำสั่งซื้อรอชำระ" value={pendingOrders} icon={ShoppingBag} />
      </div>

      <div className="px-4 sm:px-6">
        <ProductsTable initialProducts={products as never[]} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Store;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-2 text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
