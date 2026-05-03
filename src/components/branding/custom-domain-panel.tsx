'use client';

import { useState, useTransition } from 'react';
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  subscribeCustomDomainAddon,
  cancelCustomDomainAddon,
  requestCustomDomain,
  verifyMyDomain,
  removeCustomDomain,
  type DomainStatus,
} from '@/lib/actions/custom-domain';

interface Props {
  initialAddon: { id: string; status: string; price: number; created_at: string } | null;
  initialStatus: DomainStatus | null;
  tenantSlug: string;
  priceYearly: number;
}

export function CustomDomainPanel({
  initialAddon,
  initialStatus,
  tenantSlug,
  priceYearly,
}: Props) {
  const [addon, setAddon] = useState(initialAddon);
  const [status, setStatus] = useState(initialStatus);
  const [domainInput, setDomainInput] = useState('');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // ---- Step 1: Subscribe addon ----
  if (!addon) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Globe className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">เปิดบริการ Custom Domain</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ใช้โดเมนของร้านเอง — ลูกค้าเข้า{' '}
              <code className="rounded bg-muted px-1">www.mygarage.com</code> แทน{' '}
              <code className="rounded bg-muted px-1">kpservicepro.com/shop/{tenantSlug}</code>
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li>• ใช้กับหน้า Landing, Storefront, Cart, Checkout, Order tracking</li>
              <li>• SSL อัตโนมัติ (Let&apos;s Encrypt) ผ่าน Vercel</li>
              <li>• คุณต้องซื้อโดเมนแยก (ไม่รวมในค่าบริการ)</li>
            </ul>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                ฿{priceYearly.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/ ปี (ไม่รวมค่าโดเมน)</span>
            </div>
            {error && (
              <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <button
              type="button"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await subscribeCustomDomainAddon();
                  if ('error' in res && res.error) {
                    setError(res.error);
                    return;
                  }
                  setAddon(
                    (res.addon as { id: string; status: string; price: number; created_at: string }) ?? null,
                  );
                });
              }}
              disabled={pending}
              className="mt-4 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              สมัครใช้บริการ
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              ค่าบริการจะรวมอยู่ในใบแจ้งหนี้ต่ออายุครั้งถัดไป
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ---- Step 2: Awaiting payment confirmation ----
  if (addon.status === 'pending') {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-700" />
            <h2 className="font-semibold text-amber-800 dark:text-amber-300">
              รอการยืนยันชำระเงิน
            </h2>
          </div>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300/90">
            เราได้บันทึกคำขอใช้บริการแล้ว — ค่าบริการ{' '}
            <span className="font-semibold">฿{priceYearly.toLocaleString()}/ปี</span>{' '}
            จะถูกเพิ่มในใบแจ้งหนี้ต่ออายุครั้งถัดไป หลังชำระและทีมงานยืนยันแล้ว
            คุณจะตั้งโดเมนได้ทันที
          </p>
          <button
            type="button"
            onClick={() => {
              if (!confirm('ยกเลิกคำขอ Custom Domain?')) return;
              startTransition(async () => {
                const res = await cancelCustomDomainAddon();
                if (!('error' in res && res.error)) {
                  setAddon(null);
                  setStatus(null);
                }
              });
            }}
            disabled={pending}
            className="mt-3 text-xs text-red-700 underline hover:no-underline"
          >
            ยกเลิกคำขอ
          </button>
        </section>
      </div>
    );
  }

  // ---- Step 3: Active addon — manage domain ----
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Custom Domain — สมาชิกใช้งาน
          </span>
        </div>
      </section>

      {!status?.domain ? (
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-2 text-base font-semibold">เพิ่มโดเมน</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            กรอกโดเมนที่ต้องการใช้ (เช่น{' '}
            <code className="rounded bg-muted px-1">www.mygarage.com</code>)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="www.mygarage.com"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const res = await requestCustomDomain(domainInput);
                  if ('error' in res && res.error) {
                    setError(res.error);
                    return;
                  }
                  // Re-fetch status to get DNS instructions
                  const newStatus = {
                    domain: domainInput.toLowerCase().trim(),
                    status: res.verified ? 'active' : 'verifying',
                    verified: !!res.verified,
                    verification: res.verification,
                    dns_instructions: res.dns,
                    added_at: new Date().toISOString(),
                    verified_at: res.verified ? new Date().toISOString() : null,
                  };
                  setStatus(newStatus as DomainStatus);
                });
              }}
              disabled={pending || !domainInput.trim()}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? 'กำลังเพิ่ม...' : 'เพิ่มโดเมน'}
            </button>
          </div>
          {error && (
            <div className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground">โดเมนของร้าน</div>
                <a
                  href={`https://${status.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-bold text-primary hover:underline"
                >
                  {status.domain}
                </a>
                <div className="mt-1">
                  {status.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      ใช้งานได้แล้ว · SSL ออกแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <AlertCircle className="h-3 w-3" />
                      รอตั้ง DNS + ตรวจสอบ
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!confirm('ลบโดเมนนี้ออกจากระบบ?')) return;
                  startTransition(async () => {
                    const res = await removeCustomDomain();
                    if (!('error' in res && res.error)) setStatus(null);
                  });
                }}
                disabled={pending}
                className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                <Trash2 className="inline h-3 w-3" /> ลบ
              </button>
            </div>
          </section>

          {!status.verified && status.dns_instructions && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-2 text-base font-semibold">ตั้งค่า DNS</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                เข้าหน้าผู้ให้บริการโดเมน (เช่น GoDaddy, Cloudflare,{' '}
                <a
                  href="https://www.netregistry.com.au"
                  className="text-primary hover:underline"
                >
                  Net4U
                </a>
                ) แล้วเพิ่ม record ตามนี้:
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Host/Name</th>
                      <th className="px-3 py-2 text-left">Value</th>
                      <th className="px-3 py-2 text-left">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {status.dns_instructions.records.map((r, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-xs">{r.type}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.host}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          <button
                            type="button"
                            onClick={() => copy(r.value, `dns-${i}`)}
                            className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 hover:bg-muted/70"
                          >
                            {r.value}
                            {copied === `dns-${i}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs">{r.ttl || 'auto'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const res = await verifyMyDomain();
                      if ('error' in res && res.error) {
                        setError(res.error);
                        return;
                      }
                      const ok = res as { verified: boolean };
                      setStatus((s) =>
                        s
                          ? {
                              ...s,
                              verified: ok.verified,
                              status: ok.verified ? 'active' : 'verifying',
                              verified_at: ok.verified ? new Date().toISOString() : s.verified_at,
                            }
                          : s,
                      );
                    });
                  }}
                  disabled={pending}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {pending ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ DNS'}
                </button>
                <a
                  href="https://vercel.com/docs/projects/domains/working-with-domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  วิธีตั้ง DNS แบบละเอียด
                </a>
              </div>
              {error && (
                <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                * DNS ใช้เวลา 5 นาที — 24 ชั่วโมง propagate (แล้วแต่ผู้ให้บริการ)
              </p>
            </section>
          )}
        </>
      )}

      <section className="rounded-2xl border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold">ยกเลิกบริการ</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          ยกเลิกได้ตลอด — โดเมนจะถูกลบออกจากระบบ และร้านจะกลับไปใช้ subdomain
          ของ KPServicePro
        </p>
        <button
          type="button"
          onClick={() => {
            if (!confirm('ยกเลิก Custom Domain add-on? โดเมนจะถูกลบออกทันที')) return;
            startTransition(async () => {
              const res = await cancelCustomDomainAddon();
              if (!('error' in res && res.error)) {
                setAddon(null);
                setStatus(null);
              }
            });
          }}
          disabled={pending}
          className="mt-3 text-xs text-red-700 underline hover:no-underline"
        >
          ยกเลิกบริการ
        </button>
      </section>
    </div>
  );
}
