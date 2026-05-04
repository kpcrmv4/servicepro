/**
 * Webhook endpoint for the *platform* LINE OA — the channel KPServicePro
 * itself owns. This is separate from /api/line/webhook which routes
 * tenant-owned LINE OA channels.
 *
 * Responsibilities:
 *   1. Verify signature with PLATFORM_LINE_CHANNEL_SECRET.
 *   2. On message events containing a link token (`LINK <token>`),
 *      bind the LINE userId to the tenant_owner_line_links row whose
 *      link_token matches.
 *   3. On postback `action=mark_renewal_paid&invoice_id=<id>`, flag
 *      the invoice as "owner-claimed" so super_admin can verify.
 *   4. On follow events, store the userId so we can prompt them to
 *      run the link flow.
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPlatformSignature,
  replyPlatformLineMessage,
  getPlatformLineProfile,
  buildOwnerLinkConfirmationFlex,
} from '@/lib/line/platform-line';
import { rateLimit, getClientIp } from '@/lib/security/rate-limit';

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit('platform_webhook:ip', getClientIp(req.headers), 120, '1m');
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } },
    );
  }

  const raw = await req.text();
  const signature = req.headers.get('x-line-signature') || '';
  if (!verifyPlatformSignature(raw, signature)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let body: { events?: Record<string, unknown>[] } = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const events = body.events ?? [];

  for (const evt of events) {
    try {
      await handleEvent(evt);
    } catch (e) {
      console.error('[platform-webhook] event failed', e);
    }
  }
  return NextResponse.json({ ok: true });
}

async function handleEvent(event: Record<string, unknown>) {
  const type = String(event.type || '');
  const source = (event.source as Record<string, unknown>) || {};
  const lineUserId = String(source.userId || '');
  if (!lineUserId) return;

  switch (type) {
    case 'follow':
      return handleFollow(lineUserId, event);
    case 'message':
      return handleMessage(lineUserId, event);
    case 'postback':
      return handlePostback(lineUserId, event);
  }
}

async function handleFollow(lineUserId: string, event: Record<string, unknown>) {
  const replyToken = String(event.replyToken || '');
  if (replyToken) {
    await replyPlatformLineMessage(replyToken, [
      {
        type: 'text',
        text:
          'ยินดีต้อนรับสู่ KPServicePro! 👋\n\n' +
          'หากต้องการรับการแจ้งเตือนต่ออายุสมาชิกผ่าน LINE\n' +
          'กรุณาเปิดหน้า Dashboard > ตั้งค่า > สมาชิก แล้วกด "เชื่อมต่อ LINE"\n' +
          'จากนั้นกลับมาส่งข้อความที่ขึ้นต้นด้วย "LINK " ตามด้วยรหัสที่ระบบให้\n\n' +
          'เช่น: LINK 5d8a9f3e2b...',
      },
    ]);
  }
}

async function handleMessage(lineUserId: string, event: Record<string, unknown>) {
  const message = (event.message as Record<string, unknown>) || {};
  if (message.type !== 'text') return;
  const text = String(message.text || '').trim();
  const replyToken = String(event.replyToken || '');

  // Linking command: "LINK <token>"
  const m = /^LINK\s+([a-f0-9]{20,})$/i.exec(text);
  if (m) {
    const token = m[1];
    const supabase = service();
    const { data: pending } = await supabase
      .from('tenant_owner_line_links')
      .select('id, tenant_id, user_id, link_token_expires_at, tenant:tenants(name, slug)')
      .eq('link_token', token)
      .eq('is_active', false)
      .maybeSingle();
    if (!pending) {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: '❌ ไม่พบรหัสนี้ หรือรหัสหมดอายุแล้ว กรุณาสร้างใหม่จาก Dashboard' },
      ]);
      return;
    }
    if (
      pending.link_token_expires_at &&
      new Date(pending.link_token_expires_at as string).getTime() < Date.now()
    ) {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: '❌ รหัสนี้หมดอายุแล้ว กรุณาสร้างใหม่จาก Dashboard' },
      ]);
      return;
    }

    const profile = await getPlatformLineProfile(lineUserId);
    const { error } = await supabase
      .from('tenant_owner_line_links')
      .update({
        line_user_id: lineUserId,
        display_name: profile?.displayName || null,
        picture_url: profile?.pictureUrl || null,
        is_active: true,
        link_token: null,
        link_token_expires_at: null,
        linked_at: new Date().toISOString(),
        unlinked_at: null,
      })
      .eq('id', pending.id);
    if (error) {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' },
      ]);
      return;
    }
    const tenant = pending.tenant as { name?: string; slug?: string } | null;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kpservicepro.com';
    await replyPlatformLineMessage(replyToken, [
      buildOwnerLinkConfirmationFlex({
        shopName: tenant?.name || 'ร้านของท่าน',
        dashboardUrl: `${baseUrl}/dashboard/settings/subscription`,
      }),
    ]);
    return;
  }

  // Help / fallback
  if (text.toLowerCase() === 'help' || text === 'ช่วยเหลือ') {
    await replyPlatformLineMessage(replyToken, [
      {
        type: 'text',
        text:
          'คำสั่งที่ใช้ได้:\n' +
          '• LINK <รหัส> — ผูกบัญชี LINE กับร้าน\n' +
          '• สถานะ — ตรวจสอบสถานะสมาชิก\n' +
          '• ช่วยเหลือ — แสดงคำสั่งทั้งหมด',
      },
    ]);
    return;
  }

  if (text === 'สถานะ' || text.toLowerCase() === 'status') {
    const supabase = service();
    const { data: link } = await supabase
      .from('tenant_owner_line_links')
      .select('tenant_id, tenant:tenants(name, plan, subscription_status, current_period_end, trial_ends_at)')
      .eq('line_user_id', lineUserId)
      .eq('is_active', true)
      .maybeSingle();
    if (!link) {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: 'ยังไม่ได้เชื่อมต่อกับร้านใดๆ พิมพ์ LINK <รหัส> เพื่อเชื่อมต่อ' },
      ]);
      return;
    }
    const t = link.tenant as {
      name?: string;
      plan?: string;
      subscription_status?: string;
      current_period_end?: string;
      trial_ends_at?: string;
    } | null;
    const expiry = t?.current_period_end || t?.trial_ends_at;
    await replyPlatformLineMessage(replyToken, [
      {
        type: 'text',
        text:
          `📋 สถานะสมาชิก\n\n` +
          `ร้าน: ${t?.name || '-'}\n` +
          `แพลน: ${t?.plan || '-'}\n` +
          `สถานะ: ${t?.subscription_status || '-'}\n` +
          (expiry ? `หมดอายุ: ${new Date(expiry).toLocaleDateString('th-TH')}\n` : ''),
      },
    ]);
    return;
  }

  // Default
  await replyPlatformLineMessage(replyToken, [
    {
      type: 'text',
      text:
        'ขอบคุณสำหรับข้อความครับ\n' +
        'พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งที่ใช้ได้',
    },
  ]);
}

async function handlePostback(lineUserId: string, event: Record<string, unknown>) {
  const postback = (event.postback as Record<string, unknown>) || {};
  const params = new URLSearchParams(String(postback.data || ''));
  const action = params.get('action');
  const replyToken = String(event.replyToken || '');

  if (action === 'mark_renewal_paid') {
    const invoiceId = params.get('invoice_id');
    if (!invoiceId) return;
    const supabase = service();

    // Verify the LINE user is allowed to flag this invoice
    const { data: link } = await supabase
      .from('tenant_owner_line_links')
      .select('tenant_id')
      .eq('line_user_id', lineUserId)
      .eq('is_active', true)
      .maybeSingle();
    if (!link) {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: 'ยังไม่ได้เชื่อมต่อบัญชี LINE กับร้าน — ไม่สามารถแจ้งโอนได้' },
      ]);
      return;
    }
    const { data: inv } = await supabase
      .from('subscription_invoices')
      .select('id, tenant_id, status, invoice_number')
      .eq('id', invoiceId)
      .single();
    if (!inv || inv.tenant_id !== link.tenant_id) {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: 'ไม่พบใบแจ้งหนี้นี้' },
      ]);
      return;
    }
    if (inv.status === 'paid') {
      await replyPlatformLineMessage(replyToken, [
        { type: 'text', text: `${inv.invoice_number} ชำระเรียบร้อยแล้ว ขอบคุณครับ` },
      ]);
      return;
    }
    await supabase
      .from('subscription_invoices')
      .update({
        payment_method: 'transfer',
        payment_reference: `line-claim:${lineUserId}`,
        notes: 'ลูกค้าแจ้งโอนผ่าน LINE — รอ super_admin ตรวจสอบ',
      })
      .eq('id', invoiceId);
    await replyPlatformLineMessage(replyToken, [
      {
        type: 'text',
        text:
          `✅ รับเรื่องแล้ว — ${inv.invoice_number}\n\n` +
          'ทีมงานจะตรวจสอบและยืนยันการชำระภายใน 24 ชั่วโมง ขอบคุณครับ',
      },
    ]);
  }
}
