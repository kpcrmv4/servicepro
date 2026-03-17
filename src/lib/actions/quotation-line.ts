'use server'

import { createClient } from '@/lib/supabase/server'

async function getUserInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('id', user.id)
    .single()

  return profile
}

export async function sendQuotationViaLine(quotationId: string, jobId: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  // Get quotation with customer info
  const { data: quotation } = await supabase
    .from('quotations')
    .select('*, customers(id, name), vehicles(license_plate, brand, model)')
    .eq('id', quotationId)
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!quotation) return { error: 'ไม่พบใบเสนอราคา' }

  const customerId = quotation.customer_id as string

  // Find LINE follower linked to this customer
  const { data: follower } = await supabase
    .from('line_followers')
    .select('line_user_id')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('customer_id', customerId)
    .eq('is_following', true)
    .maybeSingle()

  if (!follower) {
    return { error: 'ลูกค้ายังไม่ได้เชื่อมต่อ LINE กรุณาให้ลูกค้าเพิ่มเพื่อนก่อน' }
  }

  // Get LINE config
  const { data: config } = await supabase
    .from('line_oa_configs')
    .select('channel_access_token, is_active')
    .eq('tenant_id', userInfo.tenant_id)
    .single()

  if (!config?.channel_access_token || !config.is_active) {
    return { error: 'LINE OA ยังไม่ได้ตั้งค่า' }
  }

  const vehicle = quotation.vehicles as Record<string, unknown> | null
  const customer = quotation.customers as Record<string, unknown> | null
  const vehicleText = vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})`
    : '-'

  // Build the customer-facing quotation URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  const quotationUrl = `${appUrl}/c/quotation/${quotationId}`

  // Build Flex Message with approve/reject buttons
  const flexMessage = {
    type: 'flex',
    altText: `ใบเสนอราคา ${quotation.quotation_number}`,
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
          { type: 'text', text: String(quotation.quotation_number), color: '#FFFFFF', size: 'xl', weight: 'bold' },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '20px',
        contents: [
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'ลูกค้า', color: '#8C8C8C', size: 'sm', flex: 2 },
              { type: 'text', text: String(customer?.name || '-'), size: 'sm', align: 'end', flex: 3 },
            ],
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'รถ', color: '#8C8C8C', size: 'sm', flex: 2 },
              { type: 'text', text: vehicleText, size: 'sm', align: 'end', flex: 3, wrap: true },
            ],
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box', layout: 'horizontal', margin: 'md', contents: [
              { type: 'text', text: 'ก่อน VAT', color: '#8C8C8C', size: 'sm', flex: 2 },
              { type: 'text', text: `฿${Number(quotation.subtotal || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, size: 'sm', align: 'end', flex: 3 },
            ],
          },
          {
            type: 'box', layout: 'horizontal', contents: [
              { type: 'text', text: 'VAT 7%', color: '#8C8C8C', size: 'sm', flex: 2 },
              { type: 'text', text: `฿${Number(quotation.vat || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, size: 'sm', align: 'end', flex: 3 },
            ],
          },
          { type: 'separator', margin: 'md' },
          {
            type: 'box', layout: 'horizontal', margin: 'md', contents: [
              { type: 'text', text: 'ยอดรวม', size: 'md', weight: 'bold', flex: 2 },
              { type: 'text', text: `฿${Number(quotation.total || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, size: 'lg', weight: 'bold', align: 'end', flex: 3, color: '#7C3AED' },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        paddingAll: '20px',
        contents: [
          {
            type: 'button',
            action: { type: 'uri', label: 'ดูรายละเอียดและอนุมัติ', uri: quotationUrl },
            style: 'primary',
            color: '#7C3AED',
          },
          {
            type: 'button',
            action: { type: 'postback', label: 'อนุมัติทันที', data: `action=approve_quotation&quotation_id=${quotationId}&job_id=${jobId}` },
            style: 'primary',
            color: '#10B981',
          },
        ],
      },
    },
  }

  // Send via LINE Push API
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.channel_access_token}`,
      },
      body: JSON.stringify({
        to: follower.line_user_id,
        messages: [flexMessage],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      return { error: `ส่ง LINE ไม่สำเร็จ: ${errorBody}` }
    }

    // Log the message
    await supabase.from('line_messages').insert({
      tenant_id: userInfo.tenant_id,
      line_user_id: follower.line_user_id,
      direction: 'outgoing',
      message_type: 'quotation',
      content: {
        quotation_number: quotation.quotation_number,
        total: quotation.total,
        quotation_url: quotationUrl,
      },
      reference_type: 'quotation',
      reference_id: quotationId,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return { success: true }
  } catch (err) {
    return { error: `ส่ง LINE ไม่สำเร็จ: ${String(err)}` }
  }
}
