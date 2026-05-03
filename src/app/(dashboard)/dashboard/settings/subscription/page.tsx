import { CreditCard, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { createClient } from '@/lib/supabase/server';
import {
  listOwnSubscriptionInvoices,
  getOwnerLineLink,
} from '@/lib/actions/subscription';
import { getPlatformPaymentInfo } from '@/lib/payment/promptpay';
import { OwnerLineLinkCard } from '@/components/subscription/owner-line-link-card';
import { TransferClaimButton } from '@/components/subscription/transfer-claim-button';

const statusLabel: Record<string, { text: string; color: string }> = {
  pending: { text: 'รอชำระ', color: 'bg-amber-100 text-amber-700' },
  sent: { text: 'แจ้งแล้ว — รอชำระ', color: 'bg-blue-100 text-blue-700' },
  paid: { text: 'ชำระแล้ว', color: 'bg-green-100 text-green-700' },
  cancelled: { text: 'ยกเลิก', color: 'bg-gray-100 text-gray-600' },
  overdue: { text: 'เกินกำหนด', color: 'bg-red-100 text-red-700' },
};

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

export default async function SubscriptionSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-6">กรุณาเข้าสู่ระบบ</div>;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.tenant_id) {
    return <div className="p-6">ไม่พบข้อมูลร้าน</div>;
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, plan, subscription_status, current_period_start, current_period_end, trial_ends_at, billing_cycle, auto_renew')
    .eq('id', profile.tenant_id)
    .single();

  const [invoices, lineLink] = await Promise.all([
    listOwnSubscriptionInvoices(),
    getOwnerLineLink(),
  ]);

  const platformPayment = getPlatformPaymentInfo();
  const paymentForButton = {
    promptpayId: platformPayment?.id ?? null,
    promptpayName: platformPayment?.accountName ?? null,
    bankName: platformPayment?.bankName ?? null,
    bankAccount: platformPayment?.bankAccount ?? null,
    acceptCreditCard: platformPayment?.acceptCreditCard ?? false,
  };

  const expiry = tenant?.current_period_end || tenant?.trial_ends_at;
  const daysLeft = expiry
    ? Math.ceil((new Date(expiry).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="สมาชิก & ต่ออายุ"
        description="จัดการแพลน รับการแจ้งเตือนต่ออายุผ่าน LINE และดูประวัติใบแจ้งหนี้"
      />

      <div className="space-y-6 px-4 sm:px-6">
        {/* Plan summary */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">แพลนปัจจุบัน</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">ร้าน</div>
              <div className="font-semibold">{tenant?.name || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">แพลน</div>
              <div className="font-semibold capitalize">{tenant?.plan || 'free'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">สถานะ</div>
              <div className="font-semibold">{tenant?.subscription_status || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">รอบบริการ</div>
              <div className="text-sm">
                {tenant?.current_period_start ? formatDate(tenant.current_period_start) : '-'}
                {' → '}
                {formatDate(expiry)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">ต่ออายุอัตโนมัติ</div>
              <div className="text-sm">{tenant?.auto_renew ? 'เปิด' : 'ปิด'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">เหลืออีก</div>
              <div className={`text-sm font-semibold ${daysLeft !== null && daysLeft <= 7 ? 'text-red-600' : 'text-foreground'}`}>
                {daysLeft === null ? '-' : daysLeft <= 0 ? 'หมดอายุแล้ว' : `${daysLeft} วัน`}
              </div>
            </div>
          </div>
        </section>

        {/* LINE link card */}
        <OwnerLineLinkCard initialLink={lineLink} />

        {/* Invoices */}
        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">ใบแจ้งหนี้ค่าสมาชิก</h2>
            <p className="text-sm text-muted-foreground">
              ระบบจะสร้างใบแจ้งหนี้อัตโนมัติเมื่อใกล้หมดอายุ และแจ้งเตือนผ่าน LINE
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-left">เลขที่</th>
                  <th className="px-4 py-3 text-left">แพลน</th>
                  <th className="px-4 py-3 text-left">รอบบริการ</th>
                  <th className="px-4 py-3 text-right">ยอด</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-center">ครบกำหนด</th>
                  <th className="px-4 py-3 text-center">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      ยังไม่มีใบแจ้งหนี้
                    </td>
                  </tr>
                )}
                {invoices.map((inv) => {
                  const s = statusLabel[inv.status as string] || { text: inv.status, color: 'bg-gray-100 text-gray-700' };
                  const canClaim = inv.status === 'pending' || inv.status === 'sent' || inv.status === 'overdue';
                  return (
                    <tr key={inv.id as string} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm font-medium">{inv.invoice_number as string}</td>
                      <td className="px-4 py-3 text-sm capitalize">{inv.plan as string}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDate(inv.period_start as string)} → {formatDate(inv.period_end as string)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        ฿{Number(inv.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                          {inv.status === 'paid' ? <CheckCircle2 className="h-3 w-3" /> : inv.status === 'overdue' ? <AlertCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {s.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {formatDate(inv.due_date as string)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {canClaim && (
                          <TransferClaimButton
                            invoiceId={inv.id as string}
                            invoiceNumber={inv.invoice_number as string}
                            amount={Number(inv.amount)}
                            payment={paymentForButton}
                          />
                        )}
                        {inv.status === 'paid' && (
                          <span className="text-xs text-muted-foreground">
                            ชำระเมื่อ {formatDate(inv.paid_at as string)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment instructions */}
        <section className="rounded-xl border border-border bg-muted/30 p-6">
          <h3 className="mb-3 font-semibold">ช่องทางชำระเงิน</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            {platformPayment?.id ? (
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground">PromptPay:</span>
                <div>
                  <div>{platformPayment.id} ({platformPayment.accountName})</div>
                  <div className="text-xs">QR สร้างอัตโนมัติพร้อมยอดเงินเมื่อกดปุ่ม &quot;ชำระเงิน&quot;</div>
                </div>
              </div>
            ) : null}
            {platformPayment?.bankAccount ? (
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground">ธนาคาร:</span>
                <div>{platformPayment.bankName} {platformPayment.bankAccount}</div>
              </div>
            ) : null}
            {platformPayment?.acceptCreditCard ? (
              <div className="flex items-start gap-2">
                <span className="font-medium text-foreground">บัตรเครดิต:</span>
                <div>ติดต่อทีมงานเพื่อรูดบัตรและส่งสลิป</div>
              </div>
            ) : null}
            <div className="pt-1">• โอนเสร็จแล้ว กดปุ่ม &quot;ชำระเงิน&quot; → แนบรูปสลิป → ทีมงานตรวจสอบและยืนยันภายใน 24 ชั่วโมง</div>
          </div>
        </section>
      </div>
    </div>
  );
}
