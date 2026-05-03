/**
 * Platform LINE OA — used by KPServicePro itself to talk to shop owners
 * (subscription renewal, payment reminders, account linking).
 *
 * This is *separate* from per-tenant LINE OA configs in the
 * `line_oa_configs` table, which a tenant uses to talk to *their* customers.
 *
 * Configured via env:
 *   PLATFORM_LINE_CHANNEL_SECRET
 *   PLATFORM_LINE_CHANNEL_ACCESS_TOKEN
 *   PLATFORM_LINE_BASIC_ID         (optional, used to build deep links)
 *   PLATFORM_LINE_LIFF_ID          (optional)
 */

import crypto from 'crypto';

export interface PlatformLineConfig {
  channelSecret: string;
  channelAccessToken: string;
  basicId: string | null;
  liffId: string | null;
}

export function getPlatformLineConfig(): PlatformLineConfig | null {
  const channelSecret = process.env.PLATFORM_LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.PLATFORM_LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelSecret || !channelAccessToken) return null;
  return {
    channelSecret,
    channelAccessToken,
    basicId: process.env.PLATFORM_LINE_BASIC_ID ?? null,
    liffId: process.env.PLATFORM_LINE_LIFF_ID ?? null,
  };
}

export function verifyPlatformSignature(rawBody: string, signature: string): boolean {
  const cfg = getPlatformLineConfig();
  if (!cfg) return false;
  const expected = crypto
    .createHmac('SHA256', cfg.channelSecret)
    .update(rawBody)
    .digest('base64');
  return expected === signature;
}

type LineMessage = Record<string, unknown>;

export async function pushPlatformLineMessage(
  lineUserId: string,
  messages: LineMessage[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = getPlatformLineConfig();
  if (!cfg) return { ok: false, error: 'PLATFORM_LINE_CHANNEL_ACCESS_TOKEN is not configured' };
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.channelAccessToken}`,
      },
      body: JSON.stringify({ to: lineUserId, messages }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: body || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function replyPlatformLineMessage(
  replyToken: string,
  messages: LineMessage[],
): Promise<void> {
  const cfg = getPlatformLineConfig();
  if (!cfg) return;
  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.channelAccessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (err) {
    console.error('platform LINE reply failed:', err);
  }
}

export async function getPlatformLineProfile(lineUserId: string): Promise<{
  displayName?: string;
  pictureUrl?: string;
} | null> {
  const cfg = getPlatformLineConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
      headers: { Authorization: `Bearer ${cfg.channelAccessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { displayName?: string; pictureUrl?: string };
    return { displayName: json.displayName, pictureUrl: json.pictureUrl };
  } catch {
    return null;
  }
}

// ============================================================
// Flex message builders for renewal flow
// ============================================================

export function buildRenewalInvoiceFlex(content: {
  shopName: string;
  invoiceNumber: string;
  plan: string;
  amount: number;
  dueDate: string;        // 'DD MMM YYYY' already formatted
  periodLabel: string;    // e.g. '1 มิ.ย. 2026 - 31 พ.ค. 2027'
  payUrl: string;
  invoiceId: string;
}): LineMessage {
  return {
    type: 'flex',
    altText: `ใบแจ้งต่ออายุสมาชิก ${content.invoiceNumber} - ฿${content.amount.toLocaleString()}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E40AF',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ใบแจ้งต่ออายุสมาชิก', color: '#FFFFFF', size: 'sm' },
          { type: 'text', text: 'KPServicePro', color: '#FFFFFF', size: 'xl', weight: 'bold' },
          { type: 'text', text: content.shopName, color: '#DBEAFE', size: 'sm', margin: 'sm' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          row('เลขที่ใบแจ้ง', content.invoiceNumber),
          row('แพลน', content.plan),
          row('รอบบริการ', content.periodLabel),
          row('ครบกำหนด', content.dueDate),
          { type: 'separator', margin: 'md' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: 'ยอดที่ต้องชำระ', size: 'sm', color: '#6B7280' },
              {
                type: 'text',
                text: `฿${content.amount.toLocaleString()}`,
                size: 'xl',
                weight: 'bold',
                align: 'end',
                color: '#1E40AF',
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1E40AF',
            action: {
              type: 'uri',
              label: 'ชำระเงิน / ดูรายละเอียด',
              uri: content.payUrl,
            },
          },
          {
            type: 'button',
            style: 'secondary',
            action: {
              type: 'postback',
              label: 'แจ้งโอนแล้ว',
              data: `action=mark_renewal_paid&invoice_id=${content.invoiceId}`,
              displayText: 'แจ้งโอนแล้ว',
            },
          },
        ],
      },
    },
  };
}

export function buildRenewalReminderText(content: {
  shopName: string;
  daysLeft: number;
  amount: number;
  payUrl: string;
}): LineMessage {
  const heading =
    content.daysLeft <= 0
      ? '⚠️ สมาชิกหมดอายุแล้ว'
      : `⏰ เหลืออีก ${content.daysLeft} วันก่อนสมาชิกหมดอายุ`;
  return {
    type: 'text',
    text:
      `${heading}\n\n` +
      `ร้าน: ${content.shopName}\n` +
      `ยอดต่ออายุ: ฿${content.amount.toLocaleString()}\n\n` +
      `ชำระและดูรายละเอียดได้ที่:\n${content.payUrl}`,
  };
}

export function buildOwnerLinkConfirmationFlex(content: {
  shopName: string;
  dashboardUrl: string;
}): LineMessage {
  return {
    type: 'flex',
    altText: `เชื่อมต่อบัญชี LINE สำเร็จ — ${content.shopName}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#10B981',
        paddingAll: '16px',
        contents: [
          { type: 'text', text: '✅ เชื่อมต่อสำเร็จ', color: '#FFFFFF', weight: 'bold', size: 'lg' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'text',
            wrap: true,
            text:
              `บัญชี LINE นี้ถูกผูกกับร้าน "${content.shopName}" เรียบร้อยแล้ว\n\n` +
              'จากนี้คุณจะได้รับ:\n' +
              '• ใบแจ้งต่ออายุสมาชิก\n' +
              '• แจ้งเตือนก่อนหมดอายุ (30/7/1 วัน)\n' +
              '• ยืนยันการชำระเงิน',
            size: 'sm',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#1E40AF',
            action: { type: 'uri', label: 'เปิด Dashboard', uri: content.dashboardUrl },
          },
        ],
      },
    },
  };
}

function row(label: string, value: string): LineMessage {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#6B7280', flex: 0 },
      { type: 'text', text: value, size: 'sm', align: 'end', wrap: true },
    ],
  };
}
