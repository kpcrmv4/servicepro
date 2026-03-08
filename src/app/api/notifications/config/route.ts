import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// =============================================================================
// Notification Config API - GET/PUT tenant notification config
// =============================================================================

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('tenant_notification_config')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('event_type')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('[Notification Config GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only owner/admin can update notification config
    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'เฉพาะเจ้าของร้านหรือผู้ดูแลเท่านั้นที่แก้ไขได้' }, { status: 403 })
    }

    const body = await request.json()
    const { configs } = body as { configs: Array<Record<string, unknown>> }

    if (!configs || !Array.isArray(configs)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const errors: string[] = []

    for (const config of configs) {
      const { event_type, id, tenant_id, created_at, ...updates } = config
      
      const { error } = await supabase
        .from('tenant_notification_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', profile.tenant_id)
        .eq('event_type', event_type as string)

      if (error) {
        errors.push(`${event_type}: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Notification Config PUT] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
