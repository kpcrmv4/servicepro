'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getUserInfo, generateSequenceNumber } from '@/lib/actions/auth-helpers'

export async function searchCustomers(query: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from('customers')
    .select('id, name, phone, email, line_id, type, vehicles(id, license_plate, brand, model, year, color, current_mileage)')
    .eq('tenant_id', userInfo.tenant_id)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  return data || []
}

export async function searchVehicleByPlate(licensePlate: string) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from('vehicles')
    .select('id, license_plate, brand, model, year, color, current_mileage, customer_id, customers(id, name, phone, email, line_id, type)')
    .eq('tenant_id', userInfo.tenant_id)
    .ilike('license_plate', `%${licensePlate}%`)
    .limit(5)

  return data || []
}

interface CheckinData {
  // Customer
  customerId?: string
  customerName: string
  customerPhone: string
  customerLineId?: string
  customerType: string

  // Vehicle
  vehicleId?: string
  licensePlate: string
  vehicleBrand: string
  vehicleModel: string
  vehicleYear?: string
  vehicleColor?: string
  mileage?: string

  // Job
  jobType: string
  description?: string
  priority: string
  notes?: string

  // Photos uploaded by the wizard (already saved to Storage; we receive URLs)
  photoUrls?: string[]
}

export async function createCheckinJob(data: CheckinData) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: 'ไม่พบข้อมูลร้าน' }

  let customerId = data.customerId
  let vehicleId = data.vehicleId

  // Step 1: Create or use existing customer
  if (!customerId) {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        tenant_id: userInfo.tenant_id,
        type: (data.customerType as 'individual' | 'company') || 'individual',
        name: data.customerName,
        phone: data.customerPhone || null,
        line_id: data.customerLineId || null,
      })
      .select('id')
      .single()

    if (customerError) return { error: `สร้างลูกค้าไม่สำเร็จ: ${customerError.message}` }
    customerId = customer.id
  }

  // Step 2: Create or use existing vehicle
  if (!vehicleId) {
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert({
        tenant_id: userInfo.tenant_id,
        customer_id: customerId,
        license_plate: data.licensePlate,
        brand: data.vehicleBrand,
        model: data.vehicleModel,
        year: data.vehicleYear ? Number(data.vehicleYear) : null,
        color: data.vehicleColor || null,
        current_mileage: data.mileage ? Number(data.mileage) : null,
      })
      .select('id')
      .single()

    if (vehicleError) return { error: `สร้างข้อมูลรถไม่สำเร็จ: ${vehicleError.message}` }
    vehicleId = vehicle.id
  } else if (data.mileage) {
    // Update mileage if provided for existing vehicle
    await supabase
      .from('vehicles')
      .update({ current_mileage: Number(data.mileage) })
      .eq('id', vehicleId)
  }

  // Step 3: Generate job number
  const jobNumber = await generateSequenceNumber(supabase, 'jobs', 'JOB', userInfo.tenant_id)

  // Step 4: Create job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      tenant_id: userInfo.tenant_id,
      job_number: jobNumber,
      vehicle_id: vehicleId,
      customer_id: customerId,
      type: (data.jobType as 'repair' | 'maintenance' | 'inspection' | 'insurance' | 'warranty' | 'other') || 'repair',
      status: 'pending',
      priority: (data.priority as 'urgent' | 'normal' | 'low') || 'normal',
      description: data.description || null,
      notes: data.notes || null,
      created_by: userInfo.id,
    })
    .select('id')
    .single()

  if (jobError) return { error: `สร้าง Job ไม่สำเร็จ: ${jobError.message}` }

  // Step 5: Create timeline entry (mention photo count)
  const photoCount = data.photoUrls?.length || 0
  await supabase.from('job_timeline').insert({
    job_id: job.id,
    status: 'pending',
    notes: photoCount > 0 ? `รับรถเข้าอู่ (แนบรูป ${photoCount} รูป)` : 'รับรถเข้าอู่',
    created_by: userInfo.id,
  })

  // Step 6: Persist check-in photos as job_timeline entries with
  // photo_url so the timeline view can render images inline. (No
  // separate job_photos table is needed.)
  if (data.photoUrls && data.photoUrls.length > 0) {
    const rows = data.photoUrls.map((url) => ({
      job_id: job.id as string,
      status: 'pending',
      notes: 'รูปสภาพรถตอนรับเข้า',
      photo_url: url,
      created_by: userInfo.id,
    }))
    await supabase.from('job_timeline').insert(rows)
  }

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/jobs')
  revalidatePath('/dashboard')

  return { success: true, id: job.id }
}

export async function getReceptionJobs(filters?: { search?: string; status?: string }) {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let query = supabase
    .from('jobs')
    .select(`
      *,
      customers(id, name, phone),
      vehicles(id, license_plate, brand, model, color),
      assigned_user:users!jobs_assigned_to_fkey(id, full_name),
      created_by_user:users!jobs_created_by_fkey(id, full_name)
    `)
    .eq('tenant_id', userInfo.tenant_id)
    .in('status', ['pending', 'diagnosing', 'quoted'])
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.search) {
    query = query.or(`job_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }

  const { data } = await query
  return data || []
}
