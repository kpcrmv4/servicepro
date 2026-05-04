'use client';

import { useState, useTransition } from 'react';
import { Link2, Unlink, MessageCircle, Copy, Check } from 'lucide-react';
import {
  createOwnerLineLinkToken,
  unlinkOwnerLine,
} from '@/lib/actions/subscription';

interface LinkRow {
  id: string;
  display_name: string | null;
  picture_url: string | null;
  is_active: boolean;
  linked_at: string;
}

interface Props {
  initialLink: LinkRow | null;
}

export function OwnerLineLinkCard({ initialLink }: Props) {
  const [link, setLink] = useState<LinkRow | null>(initialLink);
  const [pending, startTransition] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [oaUrl, setOaUrl] = useState<string | null>(null);
  const [tokenExpires, setTokenExpires] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLinked = !!link;

  const requestToken = () => {
    setError(null);
    startTransition(async () => {
      const res = await createOwnerLineLinkToken();
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      const ok = res as { token: string; expiresAt: string; oaUrl: string | null };
      setToken(ok.token);
      setOaUrl(ok.oaUrl);
      setTokenExpires(ok.expiresAt);
    });
  };

  const unlink = () => {
    if (!confirm('ต้องการยกเลิกการเชื่อมต่อ LINE สำหรับการแจ้งเตือนต่ออายุหรือไม่?')) return;
    startTransition(async () => {
      const res = await unlinkOwnerLine();
      if ('error' in res && res.error) {
        setError(res.error);
        return;
      }
      setLink(null);
      setToken(null);
    });
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(`LINK ${token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold">รับการแจ้งเตือนต่ออายุผ่าน LINE</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        เชื่อมต่อบัญชี LINE ของคุณกับร้าน เพื่อรับใบแจ้งหนี้ต่ออายุและแจ้งเตือนก่อนหมดอายุผ่าน LINE OA ของ KPServicePro
      </p>

      {isLinked ? (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <div className="flex items-center gap-3">
            {link?.picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={link.picture_url}
                alt={link.display_name || 'LINE'}
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
                <Link2 className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="font-medium">{link?.display_name || 'เชื่อมต่อแล้ว'}</div>
              <div className="text-xs text-muted-foreground">
                ตั้งแต่ {new Date(link!.linked_at).toLocaleDateString('th-TH')}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={unlink}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
          >
            <Unlink className="h-4 w-4" />
            ยกเลิกการเชื่อมต่อ
          </button>
        </div>
      ) : !token ? (
        <button
          type="button"
          onClick={requestToken}
          disabled={pending}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Link2 className="h-4 w-4" />
          {pending ? 'กำลังสร้างรหัส...' : 'เชื่อมต่อ LINE'}
        </button>
      ) : (
        <div className="space-y-4 rounded-lg border border-border bg-muted/50 p-4">
          <div>
            <div className="mb-1 text-sm font-medium">ขั้นตอนการเชื่อมต่อ</div>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>
                เพิ่ม LINE OA ของ KPServicePro เป็นเพื่อน
                {oaUrl && (
                  <a
                    href={oaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center text-primary underline"
                  >
                    เปิด LINE OA
                  </a>
                )}
              </li>
              <li>คัดลอกข้อความด้านล่างนี้</li>
              <li>วางใน LINE chat กับ KPServicePro แล้วส่ง</li>
            </ol>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <code className="flex-1 select-all font-mono text-sm">LINK {token}</code>
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-muted"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
            </button>
          </div>
          {tokenExpires && (
            <div className="text-xs text-muted-foreground">
              รหัสนี้ใช้ได้ถึง {new Date(tokenExpires).toLocaleString('th-TH')} (30 นาที)
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
    </section>
  );
}
