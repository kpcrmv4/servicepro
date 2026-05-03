"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function getCustomerByPhone(phone: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("customers")
    .select("*, vehicles(*)")
    .eq("phone", phone)
    .single()
  return data
}

export async function getCustomerVehicles(customerId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("vehicles")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
  return data || []
}

export async function getCustomerJobs(customerId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("jobs")
    .select("*, vehicles(license_plate, brand, model), users!jobs_assigned_to_fkey(full_name)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
  return data || []
}

export async function getJobByTrackingToken(token: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from("jobs")
    .select("*, customers(name, phone), vehicles(license_plate, brand, model, color), users!jobs_assigned_to_fkey(full_name), job_items(*)")
    .eq("job_number", token)
    .single()
  return data
}

// Full timeline events for the public tracking page. Returns rows in
// chronological order (oldest first).
export async function getJobTimelineByToken(token: string) {
  const supabase = await createServerClient()
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("job_number", token)
    .single()
  if (!job) return []
  const { data } = await supabase
    .from("job_timeline")
    .select(
      "id, status, notes, photo_url, created_at, created_by_user:users!job_timeline_created_by_fkey(full_name)",
    )
    .eq("job_id", job.id)
    .order("created_at", { ascending: true })
  return data || []
}

export async function getVehicleWithHistory(vehicleId: string) {
  const supabase = await createServerClient()
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers(name, phone)")
    .eq("id", vehicleId)
    .single()

  if (!vehicle) return null

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, users!jobs_assigned_to_fkey(full_name)")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })

  return { ...vehicle, jobs: jobs || [] }
}

export async function getVehicleServiceBook(vehicleId: string) {
  const supabase = await createServerClient()

  // 1. Vehicle details with customer info
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers(id, name, phone, email)")
    .eq("id", vehicleId)
    .single()

  if (!vehicle) return null

  // 2. All jobs with items, timeline, and technician
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*, job_items(*), job_timeline(*), users!jobs_assigned_to_fkey(full_name)")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })

  // 3. All inspections with items
  const { data: inspections } = await supabase
    .from("vehicle_inspections")
    .select("*, inspection_items:inspection_items(*)")
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false })

  // 4. Active warranty records via jobs linked to this vehicle
  const jobIds = (jobs || []).map((j: Record<string, unknown>) => j.id as string)
  let warranties: Record<string, unknown>[] = []
  if (jobIds.length > 0) {
    const { data: warrantyData } = await supabase
      .from("warranty_records")
      .select("*, warranty_policies(name, description, duration_months, coverage_type)")
      .in("job_id", jobIds)
      .eq("status", "active")
    warranties = warrantyData || []
  }

  // 5. Pending service reminders for this vehicle
  const { data: reminders } = await supabase
    .from("service_reminders")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .eq("status", "pending")
    .order("trigger_date", { ascending: true })

  // 6. Invoices linked to this vehicle's jobs
  let invoices: Record<string, unknown>[] = []
  if (jobIds.length > 0) {
    const { data: invoiceData } = await supabase
      .from("invoices")
      .select("*")
      .in("job_id", jobIds)
      .order("created_at", { ascending: false })
    invoices = invoiceData || []
  }

  // 7. Receipts linked to this vehicle's invoices
  const invoiceIds = invoices.map((inv) => inv.id as string)
  let receipts: Record<string, unknown>[] = []
  if (invoiceIds.length > 0) {
    const { data: receiptData } = await supabase
      .from("receipts")
      .select("*")
      .in("invoice_id", invoiceIds)
      .order("created_at", { ascending: false })
    receipts = receiptData || []
  }

  // Calculate overdue reminders count
  const today = new Date().toISOString().split("T")[0]
  const overdueReminders = (reminders || []).filter(
    (r: Record<string, unknown>) => (r.trigger_date as string) < today
  ).length

  // Determine latest inspection and its age
  const latestInspection =
    inspections && inspections.length > 0
      ? (inspections[0] as Record<string, unknown>)
      : null
  let inspectionAgeDays = Infinity
  if (latestInspection) {
    const inspDate = new Date(latestInspection.created_at as string)
    inspectionAgeDays = Math.floor(
      (Date.now() - inspDate.getTime()) / (1000 * 60 * 60 * 24)
    )
  }

  return {
    vehicle,
    jobs: jobs || [],
    inspections: inspections || [],
    warranties,
    reminders: reminders || [],
    invoices,
    receipts,
    overdueReminders,
    inspectionAgeDays,
    latestInspection,
  }
}
