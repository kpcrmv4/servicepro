import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Use service role key for webhook (no user context)
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const events = JSON.parse(body).events;
    if (!events || events.length === 0) {
      return NextResponse.json({ status: 'ok' });
    }

    // Process each event
    for (const event of events) {
      await processEvent(event, body, signature);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Verify webhook for LINE
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}

async function processEvent(event: Record<string, unknown>, rawBody: string, signature: string) {
  const source = event.source as Record<string, unknown>;
  const lineUserId = String(source?.userId || '');

  if (!lineUserId) return;

  // Find which tenant this LINE user belongs to by checking all configs
  // The webhook URL is shared, so we need to verify signature against each tenant's channel secret
  const { data: configs } = await getSupabase()
    .from('line_oa_configs')
    .select('*')
    .eq('is_active', true);

  if (!configs || configs.length === 0) return;

  let matchedConfig: Record<string, unknown> | null = null;

  for (const config of configs) {
    const channelSecret = String(config.channel_secret);
    const hash = crypto
      .createHmac('SHA256', channelSecret)
      .update(rawBody)
      .digest('base64');

    if (hash === signature) {
      matchedConfig = config;
      break;
    }
  }

  if (!matchedConfig) {
    console.error('No matching LINE config found for signature');
    return;
  }

  const tenantId = String(matchedConfig.tenant_id);

  switch (event.type) {
    case 'follow':
      await handleFollow(tenantId, lineUserId, event);
      break;
    case 'unfollow':
      await handleUnfollow(tenantId, lineUserId);
      break;
    case 'message':
      await handleMessage(tenantId, lineUserId, event, matchedConfig);
      break;
    case 'postback':
      await handlePostback(tenantId, lineUserId, event);
      break;
  }
}

async function handleFollow(tenantId: string, lineUserId: string, event: Record<string, unknown>) {
  // Get user profile from LINE
  const { data: config } = await getSupabase()
    .from('line_oa_configs')
    .select('channel_access_token, welcome_message')
    .eq('tenant_id', tenantId)
    .single();

  let displayName = '';
  let pictureUrl = '';

  if (config) {
    try {
      const profileRes = await fetch(`https://api.line.me/v2/bot/profile/${lineUserId}`, {
        headers: { Authorization: `Bearer ${config.channel_access_token}` },
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        displayName = profile.displayName || '';
        pictureUrl = profile.pictureUrl || '';
      }
    } catch (err) {
      console.error('Failed to get LINE profile:', err);
    }
  }

  // Upsert follower
  const { error } = await getSupabase()
    .from('line_followers')
    .upsert({
      tenant_id: tenantId,
      line_user_id: lineUserId,
      display_name: displayName,
      picture_url: pictureUrl,
      is_following: true,
      followed_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id,line_user_id' });

  if (error) console.error('Failed to upsert follower:', error);

  // Send welcome message
  if (config?.welcome_message) {
    await sendReply(config.channel_access_token, event, [
      { type: 'text', text: config.welcome_message },
    ]);
  }
}

async function handleUnfollow(tenantId: string, lineUserId: string) {
  await getSupabase()
    .from('line_followers')
    .update({ is_following: false })
    .eq('tenant_id', tenantId)
    .eq('line_user_id', lineUserId);
}

async function handleMessage(tenantId: string, lineUserId: string, event: Record<string, unknown>, config: Record<string, unknown>) {
  const message = event.message as Record<string, unknown>;

  // Log incoming message
  await getSupabase().from('line_messages').insert({
    tenant_id: tenantId,
    line_user_id: lineUserId,
    direction: 'incoming',
    message_type: String(message?.type || 'text'),
    content: message || {},
    status: 'received',
  });

  // Auto-reply if enabled
  if (config.auto_reply_enabled && message?.type === 'text') {
    const text = String(message.text || '').toLowerCase();

    // Check for job status inquiry
    if (text.includes('สถานะ') || text.includes('งาน') || text.includes('รถ')) {
      // Find customer linked to this LINE user
      const { data: follower } = await getSupabase()
        .from('line_followers')
        .select('customer_id')
        .eq('tenant_id', tenantId)
        .eq('line_user_id', lineUserId)
        .single();

      if (follower?.customer_id) {
        // Get active jobs
        const { data: jobs } = await getSupabase()
          .from('jobs')
          .select('job_number, status, vehicle:vehicles(license_plate, brand, model)')
          .eq('tenant_id', tenantId)
          .eq('customer_id', follower.customer_id)
          .not('status', 'in', '("completed","cancelled")')
          .order('created_at', { ascending: false })
          .limit(3);

        if (jobs && jobs.length > 0) {
          const statusLabels: Record<string, string> = {
            pending: 'รอดำเนินการ',
            in_progress: 'กำลังซ่อม',
            quality_check: 'ตรวจสอบคุณภาพ',
            waiting_pickup: 'รอรับรถ',
          };

          const jobList = jobs.map((j: Record<string, unknown>) => {
            const v = j.vehicle as Record<string, unknown>;
            return `- ${j.job_number}: ${v?.brand} ${v?.model} (${v?.license_plate}) - ${statusLabels[String(j.status)] || j.status}`;
          }).join('\n');

          await sendReply(String(config.channel_access_token), event, [
            { type: 'text', text: `สถานะงานซ่อมของท่าน:\n\n${jobList}` },
          ]);
          return;
        }
      }

      await sendReply(String(config.channel_access_token), event, [
        { type: 'text', text: 'ขออภัยครับ ไม่พบงานซ่อมที่กำลังดำเนินการ หากต้องการสอบถามเพิ่มเติม กรุณาติดต่อทางร้านโดยตรงครับ' },
      ]);
      return;
    }

    // Default auto-reply
    await sendReply(String(config.channel_access_token), event, [
      { type: 'text', text: 'ขอบคุณสำหรับข้อความครับ ทางร้านจะติดต่อกลับโดยเร็วที่สุดครับ\n\nพิมพ์ "สถานะ" เพื่อเช็คสถานะงานซ่อม' },
    ]);
  }
}

async function handlePostback(tenantId: string, lineUserId: string, event: Record<string, unknown>) {
  const postback = event.postback as Record<string, unknown>;
  const data = String(postback?.data || '');

  // Log postback
  await getSupabase().from('line_messages').insert({
    tenant_id: tenantId,
    line_user_id: lineUserId,
    direction: 'incoming',
    message_type: 'postback',
    content: { data },
    status: 'received',
  });

  // Parse postback data (format: action=xxx&param=yyy)
  const params = new URLSearchParams(data);
  const action = params.get('action');

  if (action === 'approve_quotation') {
    const quotationId = params.get('quotation_id');
    const jobId = params.get('job_id');
    if (quotationId) {
      // Get quotation totals
      const { data: qt } = await getSupabase()
        .from('quotations')
        .select('id, status, total, subtotal, vat, items')
        .eq('id', quotationId)
        .single();

      if (qt && qt.status === 'sent') {
        // Approve quotation
        await getSupabase()
          .from('quotations')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', quotationId);

        // Update job
        if (jobId) {
          const items = (qt.items as { type: string; quantity: number; unitPrice: number; discount: number }[]) || [];
          const totalPartsCost = items
            .filter((i) => i.type === 'part')
            .reduce((sum, i) => sum + ((i.quantity * i.unitPrice) - (i.discount || 0)), 0);
          const totalLaborCost = items
            .filter((i) => i.type === 'labor')
            .reduce((sum, i) => sum + ((i.quantity * i.unitPrice) - (i.discount || 0)), 0);

          await getSupabase()
            .from('jobs')
            .update({
              status: 'ready_to_repair',
              total_parts_cost: totalPartsCost,
              total_labor_cost: totalLaborCost,
              total_amount: qt.subtotal,
              vat: qt.vat,
              grand_total: qt.total,
            })
            .eq('id', jobId);

          await getSupabase().from('job_timeline').insert({
            job_id: jobId,
            status: 'ready_to_repair',
            notes: 'ลูกค้าอนุมัติใบเสนอราคาผ่าน LINE — เข้าคิวพร้อมซ่อม',
          });
        }

        // Reply confirmation
        const { data: lineConfig } = await getSupabase()
          .from('line_oa_configs')
          .select('channel_access_token')
          .eq('tenant_id', tenantId)
          .single();

        if (lineConfig) {
          await sendReply(lineConfig.channel_access_token, event, [
            { type: 'text', text: 'อนุมัติใบเสนอราคาเรียบร้อยแล้ว ขอบคุณครับ! ทางอู่จะเริ่มดำเนินการซ่อมให้ทันทีครับ' },
          ]);
        }
      }
    }
  }
}

async function sendReply(accessToken: string, event: Record<string, unknown>, messages: Record<string, unknown>[]) {
  const replyToken = String(event.replyToken || '');
  if (!replyToken) return;

  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (err) {
    console.error('Failed to send LINE reply:', err);
  }
}
