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

export async function checkCustomerLineLinked(customerId: string): Promise<boolean> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return false

  const { data } = await supabase
    .from('line_followers')
    .select('id')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('customer_id', customerId)
    .eq('is_following', true)
    .limit(1)
    .maybeSingle()

  return !!data
}

export async function getCustomerLineUserId(customerId: string): Promise<string | null> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from('line_followers')
    .select('line_user_id')
    .eq('tenant_id', userInfo.tenant_id)
    .eq('customer_id', customerId)
    .eq('is_following', true)
    .limit(1)
    .maybeSingle()

  return data?.line_user_id || null
}
