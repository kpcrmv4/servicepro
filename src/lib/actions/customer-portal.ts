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
