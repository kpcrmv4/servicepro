'use server';

import { createClient } from '@/lib/supabase/server';

// ============================================================
// LINE OA Config Management
// ============================================================

export async function getLineOAConfig() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { data, error } = await supabase
    .from('line_oa_configs')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function saveLineOAConfig(config: {
  channel_id: string;
  channel_secret: string;
  channel_access_token: string;
  liff_id?: string;
  welcome_message?: string;
  auto_reply_enabled?: boolean;
  notification_settings?: Record<string, boolean>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  // Check if config exists
  const { data: existing } = await supabase
    .from('line_oa_configs')
    .select('id')
    .eq('tenant_id', userData.tenant_id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('line_oa_configs')
      .update({ ...config })
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('line_oa_configs')
      .insert({ ...config, tenant_id: userData.tenant_id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ============================================================
// LINE Connection Test
// ============================================================

export async function testLineConnection() {
  const config = await getLineOAConfig();
  if (!config) throw new Error('LINE OA ยังไม่ได้ตั้งค่า');

  try {
    const response = await fetch('https://api.line.me/v2/bot/info', {
      headers: {
        'Authorization': `Bearer ${config.channel_access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'ไม่สามารถเชื่อมต่อ LINE OA ได้');
    }

    const botInfo = await response.json();
    return {
      success: true,
      botName: botInfo.displayName || botInfo.basicId,
      pictureUrl: botInfo.pictureUrl,
      chatMode: botInfo.chatMode,
      markAsReadMode: botInfo.markAsReadMode,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`เชื่อมต่อ LINE OA ไม่สำเร็จ: ${error.message}`);
    }
    throw new Error('เชื่อมต่อ LINE OA ไม่สำเร็จ');
  }
}

// ============================================================
// LINE Followers Management
// ============================================================

export async function getLineFollowers(filters?: { linked?: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from('line_followers')
    .select(`
      *,
      customer:customers(id, name, phone, email)
    `)
    .eq('is_following', true)
    .order('followed_at', { ascending: false });

  if (filters?.linked === true) query = query.not('customer_id', 'is', null);
  if (filters?.linked === false) query = query.is('customer_id', null);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function linkFollowerToCustomer(followerId: string, customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('line_followers')
    .update({ customer_id: customerId })
    .eq('id', followerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// LINE Message Sending
// ============================================================

export async function sendLineMessage(data: {
  line_user_id: string;
  message_type: string;
  content: Record<string, unknown>;
  reference_type?: string;
  reference_id?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  // Get LINE config
  const { data: config } = await supabase
    .from('line_oa_configs')
    .select('channel_access_token, is_active')
    .eq('tenant_id', userData.tenant_id)
    .single();

  if (!config || !config.is_active) {
    throw new Error('LINE OA is not configured or inactive');
  }

  // Log the message
  const { data: message, error: logError } = await supabase
    .from('line_messages')
    .insert({
      tenant_id: userData.tenant_id,
      line_user_id: data.line_user_id,
      direction: 'outgoing',
      message_type: data.message_type,
      content: data.content,
      reference_type: data.reference_type || null,
      reference_id: data.reference_id || null,
      status: 'pending',
    })
    .select()
    .single();

  if (logError) throw logError;

  // Send via LINE Messaging API
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.channel_access_token}`,
      },
      body: JSON.stringify({
        to: data.line_user_id,
        messages: buildLineMessages(data.message_type, data.content),
      }),
    });

    if (response.ok) {
      await supabase
        .from('line_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', message.id);
    } else {
      const errorBody = await response.text();
      await supabase
        .from('line_messages')
        .update({ status: 'failed', error_message: errorBody })
        .eq('id', message.id);
      throw new Error(`LINE API error: ${errorBody}`);
    }
  } catch (err) {
    await supabase
      .from('line_messages')
      .update({ status: 'failed', error_message: String(err) })
      .eq('id', message.id);
    throw err;
  }

  return message;
}

// Send job status update to customer via LINE
export async function sendJobStatusNotification(jobId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  // Get job with customer info
  const { data: job } = await supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(id, name, phone),
      vehicle:vehicles(license_plate, brand, model)
    `)
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  // Find LINE follower linked to this customer
  const { data: follower } = await supabase
    .from('line_followers')
    .select('line_user_id')
    .eq('tenant_id', userData.tenant_id)
    .eq('customer_id', job.customer_id)
    .eq('is_following', true)
    .single();

  if (!follower) return null; // Customer not on LINE

  const statusText: Record<string, string> = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังซ่อม',
    quality_check: 'ตรวจสอบคุณภาพ',
    waiting_pickup: 'รอรับรถ',
    completed: 'เสร็จสิ้น',
    cancelled: 'ยกเลิก',
  };

  return sendLineMessage({
    line_user_id: follower.line_user_id,
    message_type: 'job_status',
    content: {
      job_number: job.job_number,
      status: job.status,
      status_text: statusText[job.status] || job.status,
      vehicle: `${job.vehicle?.brand} ${job.vehicle?.model} (${job.vehicle?.license_plate})`,
      customer_name: job.customer?.name,
    },
    reference_type: 'job',
    reference_id: jobId,
  });
}

// Send DVI report to customer via LINE
export async function sendDVIReportNotification(inspectionId: string, shareUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  const { data: inspection } = await supabase
    .from('vehicle_inspections')
    .select(`
      *,
      vehicle:vehicles(license_plate, brand, model, customer_id, customer:customers(id, name)),
      items:inspection_items(condition)
    `)
    .eq('id', inspectionId)
    .single();

  if (!inspection) throw new Error('Inspection not found');

  const { data: follower } = await supabase
    .from('line_followers')
    .select('line_user_id')
    .eq('tenant_id', userData.tenant_id)
    .eq('customer_id', inspection.vehicle?.customer_id)
    .eq('is_following', true)
    .single();

  if (!follower) return null;

  const items = inspection.items || [];
  const goodCount = items.filter((i: Record<string, unknown>) => i.condition === 'good').length;
  const fairCount = items.filter((i: Record<string, unknown>) => i.condition === 'fair').length;
  const poorCount = items.filter((i: Record<string, unknown>) => i.condition === 'poor').length;

  return sendLineMessage({
    line_user_id: follower.line_user_id,
    message_type: 'dvi_report',
    content: {
      vehicle: `${inspection.vehicle?.brand} ${inspection.vehicle?.model} (${inspection.vehicle?.license_plate})`,
      customer_name: inspection.vehicle?.customer?.name,
      overall_score: inspection.overall_score,
      good_count: goodCount,
      fair_count: fairCount,
      poor_count: poorCount,
      total_items: items.length,
      share_url: shareUrl,
    },
    reference_type: 'inspection',
    reference_id: inspectionId,
  });
}

// ============================================================
// LINE Message Log
// ============================================================

export async function getLineMessages(filters?: { lineUserId?: string; type?: string; limit?: number }) {
  const supabase = await createClient();
  let query = supabase
    .from('line_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 50);

  if (filters?.lineUserId) query = query.eq('line_user_id', filters.lineUserId);
  if (filters?.type) query = query.eq('message_type', filters.type);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================
// LINE Message Templates
// ============================================================

export async function getLineMessageTemplates() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('line_message_templates')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function saveLineMessageTemplate(template: {
  id?: string;
  name: string;
  type: string;
  template: Record<string, unknown>;
  is_active?: boolean;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData) throw new Error('User not found');

  if (template.id) {
    const { data, error } = await supabase
      .from('line_message_templates')
      .update({ name: template.name, type: template.type, template: template.template, is_active: template.is_active ?? true })
      .eq('id', template.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('line_message_templates')
      .insert({ ...template, tenant_id: userData.tenant_id })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ============================================================
// Helper: Build LINE message payloads
// ============================================================

function buildLineMessages(type: string, content: Record<string, unknown>) {
  switch (type) {
    case 'job_status':
      return [buildJobStatusFlexMessage(content)];
    case 'dvi_report':
      return [buildDVIReportFlexMessage(content)];
    case 'quotation':
      return [buildQuotationFlexMessage(content)];
    case 'reminder':
      return [buildReminderFlexMessage(content)];
    case 'welcome':
      return [{ type: 'text', text: String(content.message || 'ยินดีต้อนรับสู่ระบบ ServicePro!') }];
    default:
      return [{ type: 'text', text: String(content.message || '') }];
  }
}

function buildJobStatusFlexMessage(content: Record<string, unknown>) {
  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    in_progress: '#3B82F6',
    quality_check: '#8B5CF6',
    waiting_pickup: '#10B981',
    completed: '#059669',
    cancelled: '#EF4444',
  };

  return {
    type: 'flex',
    altText: `อัปเดตสถานะงาน ${content.job_number}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: statusColors[String(content.status)] || '#6B7280',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: 'อัปเดตสถานะงานซ่อม', color: '#FFFFFF', size: 'sm' },
          { type: 'text', text: String(content.job_number), color: '#FFFFFF', size: 'xl', weight: 'bold' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'สถานะ', color: '#8C8C8C', size: 'sm', flex: 0 },
            { type: 'text', text: String(content.status_text), size: 'sm', weight: 'bold', align: 'end', color: statusColors[String(content.status)] || '#6B7280' },
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'รถ', color: '#8C8C8C', size: 'sm', flex: 0 },
            { type: 'text', text: String(content.vehicle), size: 'sm', align: 'end' },
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'ลูกค้า', color: '#8C8C8C', size: 'sm', flex: 0 },
            { type: 'text', text: String(content.customer_name), size: 'sm', align: 'end' },
          ]},
        ],
      },
    },
  };
}

function buildDVIReportFlexMessage(content: Record<string, unknown>) {
  return {
    type: 'flex',
    altText: `รายงานตรวจสภาพรถ ${content.vehicle}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#1E40AF',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: 'รายงานตรวจสภาพรถ (DVI)', color: '#FFFFFF', size: 'sm' },
          { type: 'text', text: String(content.vehicle), color: '#FFFFFF', size: 'lg', weight: 'bold' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: `คะแนนรวม: ${content.overall_score}/10`, size: 'lg', weight: 'bold', align: 'center' },
          { type: 'separator' },
          { type: 'box', layout: 'horizontal', spacing: 'md', contents: [
            { type: 'box', layout: 'vertical', contents: [
              { type: 'text', text: String(content.good_count), size: 'xl', weight: 'bold', align: 'center', color: '#10B981' },
              { type: 'text', text: 'ดี', size: 'xs', align: 'center', color: '#8C8C8C' },
            ]},
            { type: 'box', layout: 'vertical', contents: [
              { type: 'text', text: String(content.fair_count), size: 'xl', weight: 'bold', align: 'center', color: '#F59E0B' },
              { type: 'text', text: 'พอใช้', size: 'xs', align: 'center', color: '#8C8C8C' },
            ]},
            { type: 'box', layout: 'vertical', contents: [
              { type: 'text', text: String(content.poor_count), size: 'xl', weight: 'bold', align: 'center', color: '#EF4444' },
              { type: 'text', text: 'ต้องซ่อม', size: 'xs', align: 'center', color: '#8C8C8C' },
            ]},
          ]},
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'button', action: { type: 'uri', label: 'ดูรายงานฉบับเต็ม', uri: String(content.share_url) }, style: 'primary', color: '#1E40AF' },
        ],
      },
    },
  };
}

function buildQuotationFlexMessage(content: Record<string, unknown>) {
  return {
    type: 'flex',
    altText: `ใบเสนอราคา ${content.quotation_number}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#7C3AED',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ใบเสนอราคา', color: '#FFFFFF', size: 'sm' },
          { type: 'text', text: String(content.quotation_number), color: '#FFFFFF', size: 'xl', weight: 'bold' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'รถ', color: '#8C8C8C', size: 'sm', flex: 0 },
            { type: 'text', text: String(content.vehicle || '-'), size: 'sm', align: 'end' },
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'ยอดรวม', color: '#8C8C8C', size: 'sm', flex: 0 },
            { type: 'text', text: `฿${Number(content.total || 0).toLocaleString()}`, size: 'lg', weight: 'bold', align: 'end', color: '#7C3AED' },
          ]},
        ],
      },
    },
  };
}

function buildReminderFlexMessage(content: Record<string, unknown>) {
  return {
    type: 'flex',
    altText: `แจ้งเตือนบริการ: ${content.reminder_type}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#059669',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: 'แจ้งเตือนบริการ', color: '#FFFFFF', size: 'sm' },
          { type: 'text', text: String(content.reminder_type), color: '#FFFFFF', size: 'lg', weight: 'bold' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: String(content.message || 'ถึงเวลาเข้ารับบริการแล้วครับ'), size: 'sm', wrap: true },
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: 'รถ', color: '#8C8C8C', size: 'sm', flex: 0 },
            { type: 'text', text: String(content.vehicle || '-'), size: 'sm', align: 'end' },
          ]},
        ],
      },
    },
  };
}
