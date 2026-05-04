import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle2, Clock } from 'lucide-react';
import { getPublicOrder } from '@/lib/actions/shop';
import { getPromptPayQrUrl, isValidPromptPayId } from '@/lib/payment/promptpay';

const STATUS_LABEL: Record<string, string> = {
  pending: 'รอชำระ',
  confirmed: 'ยืนยันแล้ว',
  processing: 'กำลังจัดเตรียม',
  shipped: 'ส่งสินค้าแล้ว',
  delivered: 'ส่งถึงปลายทาง',
  cancelled: 'ยกเลิก',
  refunded: 'คืนเงิน',
};

export default async function OrderTrackPage({
  params,
}: {
  params: Promise<{ slug: string; orderNumber: string }>;
}) {
  const { slug, orderNumber } = await params;
  const order = await getPublicOrder(orderNumber);
  if (!order) notFound();

  const tenantRaw = order.tenant as unknown;
  const tenant = (Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw) as
    | { name: string; slug: string; settings: Record<string, unknown> }
    | null;
  const customerRaw = order.customer as unknown;
  const customer = (Array.isArray(customerRaw) ? customerRaw[0] : customerRaw) as
    | { name: string; phone: string; email: string | null }
    | null;
  const items = (order.items as Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>) || [];
  const promptpayId = (tenant?.settings?.promptpay_id as string) || null;
  const showQr =
    order.payment_method === 'promptpay' &&
    order.payment_status === 'pending' &&
    promptpayId &&
    isValidPromptPayId(promptpayId);
  const bankAcc = tenant?.settings?.bank_account as
    | { bank_name: string; account_number: string; account_name: string }
    | null;

  return (
    <main className="min-h-screen bg-background">
      <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <Link href={`/shop/${slug}/products`} className="flex items-center gap-1 text-sm">
          <ArrowLeft className="h-4 w-4" />
          ร้าน {tenant?.name}
        </Link>
        <h1 className="font-semibold">ติดตามคำสั่งซื้อ</h1>
      </nav>

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">เลขที่คำสั่งซื้อ</div>
              <div className="font-mono text-lg font-bold">{orderNumber}</div>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {STATUS_LABEL[order.status as string] || order.status}
            </span>
          </div>
          {customer && (
            <div className="mt-2 text-sm text-muted-foreground">
              {customer.name} · {customer.phone}
            </div>
          )}
        </section>

        {showQr && (
          <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <Clock className="mx-auto h-6 w-6 text-emerald-700" />
            <h2 className="mt-2 font-semibold text-emerald-800">รอการชำระเงิน</h2>
            <p className="text-xs text-emerald-700">สแกน QR เพื่อชำระผ่าน PromptPay</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getPromptPayQrUrl(promptpayId, Number(order.total))}
              alt="PromptPay QR"
              className="mx-auto mt-3 h-56 w-56 rounded bg-white p-2"
            />
            <div className="mt-2 text-sm">
              ยอด <span className="text-lg font-bold text-emerald-800">฿{Number(order.total).toLocaleString()}</span>
            </div>
          </section>
        )}

        {bankAcc && order.payment_method === 'transfer' && order.payment_status === 'pending' && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-2 font-semibold">โอนเข้าบัญชี</h2>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">ธนาคาร:</span>{' '}
                <span className="font-medium">{bankAcc.bank_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">เลขบัญชี:</span>{' '}
                <span className="font-mono font-bold">{bankAcc.account_number}</span>
              </div>
              <div>
                <span className="text-muted-foreground">ชื่อบัญชี:</span> {bankAcc.account_name}
              </div>
              <div className="mt-2 text-base font-bold">
                ยอดที่ต้องโอน:{' '}
                <span className="text-primary">฿{Number(order.total).toLocaleString()}</span>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Package className="h-4 w-4 text-primary" />
            รายการสินค้า
          </h2>
          <ul className="space-y-1 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex justify-between">
                <span>
                  {it.name} × {it.quantity}
                </span>
                <span className="font-medium">฿{Number(it.total).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>รวม</span>
            <span className="text-primary">฿{Number(order.total).toLocaleString()}</span>
          </div>
        </section>

        {order.payment_status === 'paid' && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            ชำระเงินเรียบร้อยแล้ว
          </div>
        )}
      </div>
    </main>
  );
}
