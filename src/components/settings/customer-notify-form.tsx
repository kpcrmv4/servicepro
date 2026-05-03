'use client';

import { useState, useTransition } from 'react';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import {
  type CustomerLineNotifyConfig,
  type CustomerNotifyEvent,
  type CustomerNotifyEventConfig,
  EVENT_LABELS,
  DEFAULT_CUSTOMER_NOTIFY_CONFIG,
} from '@/lib/notifications/customer-line';
import { saveCustomerNotifyConfig } from '@/lib/actions/booking-config';

interface Props {
  initialConfig: CustomerLineNotifyConfig | null;
}

export function CustomerNotifyConfigForm({ initialConfig }: Props) {
  const [config, setConfig] = useState<CustomerLineNotifyConfig>(
    initialConfig || DEFAULT_CUSTOMER_NOTIFY_CONFIG,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const updateEvent = (
    event: CustomerNotifyEvent,
    partial: Partial<CustomerNotifyEventConfig>,
  ) => {
    setConfig((c) => ({
      ...c,
      events: {
        ...c.events,
        [event]: { ...(c.events[event] || { enabled: true, auto: false, template: '' }), ...partial },
      },
    }));
  };

  const resetEvent = (event: CustomerNotifyEvent) => {
    setConfig((c) => ({
      ...c,
      events: {
        ...c.events,
        [event]: DEFAULT_CUSTOMER_NOTIFY_CONFIG.events[event] || c.events[event],
      },
    }));
  };

  const submit = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveCustomerNotifyConfig(config);
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">โหมดแจ้งเตือน</h2>
        <div className="space-y-2">
          {(['off', 'ask', 'auto'] as const).map((m) => (
            <label key={m} className="flex cursor-pointer items-start gap-3">
              <input
                type="radio"
                name="default_mode"
                checked={config.default_mode === m}
                onChange={() => setConfig({ ...config, default_mode: m })}
                className="mt-1 h-4 w-4"
              />
              <div>
                <div className="text-sm font-medium">
                  {m === 'off' && 'ไม่ส่งทั้งหมด'}
                  {m === 'ask' && 'ถามก่อนส่งทุกครั้ง (แนะนำ)'}
                  {m === 'auto' && 'ส่งอัตโนมัติทันทีตาม template'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {m === 'off' && 'ปิดทั้งหมด — ไม่มีข้อความเด้งให้ลูกค้า'}
                  {m === 'ask' &&
                    'หลังเปลี่ยนสถานะ จะมี popup เด้งให้ติ๊กว่าจะส่งหรือไม่ พร้อมแก้ข้อความได้'}
                  {m === 'auto' &&
                    'ใช้ template ทันทีโดยไม่ถาม เหมาะสำหรับร้านที่ต้องการความเร็ว'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">ตั้งค่าต่อเหตุการณ์</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          แต่ละเหตุการณ์ปิดได้ ตั้ง template ของตัวเองได้ และเลือก &quot;ส่งอัตโนมัติ&quot; เฉพาะรายการที่มั่นใจได้
        </p>
        <ul className="space-y-3">
          {(Object.keys(EVENT_LABELS) as CustomerNotifyEvent[]).map((event) => {
            const cfg = config.events[event] || { enabled: false, auto: false, template: '' };
            return (
              <li key={event} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={cfg.enabled}
                      onChange={(e) => updateEvent(event, { enabled: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">{EVENT_LABELS[event]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={cfg.auto}
                        disabled={!cfg.enabled}
                        onChange={(e) => updateEvent(event, { auto: e.target.checked })}
                      />
                      ส่งอัตโนมัติ
                    </label>
                    <button
                      type="button"
                      onClick={() => resetEvent(event)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="h-3 w-3" /> รีเซ็ต
                    </button>
                  </div>
                </div>
                {cfg.enabled && (
                  <textarea
                    value={cfg.template}
                    onChange={(e) => updateEvent(event, { template: e.target.value })}
                    rows={5}
                    placeholder="ข้อความที่จะส่ง — รองรับ {{variables}}"
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {pending ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        {saved && <span className="text-sm text-green-600">บันทึกแล้ว ✓</span>}
      </div>
    </div>
  );
}
