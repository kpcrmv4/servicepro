import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50) + "-" + Date.now().toString(36)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      shopName,
      shopPhone,
      shopAddress,
      shopSubDistrict,
      shopDistrict,
      shopProvince,
      shopPostalCode,
      shopSize,
      ownerFirstName,
      ownerLastName,
      ownerEmail,
      ownerPhone,
      ownerPassword,
      selectedPlan,
    } = body

    // Validation
    if (!shopName || !shopPhone || !shopProvince) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลอู่ให้ครบถ้วน" }, { status: 400 })
    }
    if (!ownerFirstName || !ownerLastName || !ownerEmail || !ownerPhone || !ownerPassword) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วน" }, { status: 400 })
    }
    if (ownerPassword.length < 8) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1. Create auth user via Supabase Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: false,
      user_metadata: {
        first_name: ownerFirstName,
        last_name: ownerLastName,
        phone: ownerPhone,
      },
    })

    if (authError) {
      if (authError.message?.includes("already")) {
        return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น" }, { status: 400 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authUser.user.id
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const slug = generateSlug(shopName)

    // 2. Create tenant with trial status
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        name: shopName,
        slug,
        phone: shopPhone,
        address: [shopAddress, shopSubDistrict, shopDistrict, shopProvince, shopPostalCode]
          .filter(Boolean)
          .join(", "),
        subscription_status: "trial",
        subscription_plan: selectedPlan || "professional",
        trial_ends_at: trialEnd,
        settings: {
          shop_size: shopSize || "small",
          province: shopProvince,
        },
      })
      .select("id")
      .single()

    if (tenantError) {
      // Rollback: delete the auth user
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: "ไม่สามารถสร้างข้อมูลอู่ได้ กรุณาลองใหม่" }, { status: 500 })
    }

    // 3. Create user profile linked to tenant
    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      tenant_id: tenant.id,
      email: ownerEmail,
      first_name: ownerFirstName,
      last_name: ownerLastName,
      phone: ownerPhone,
      role: "owner",
      is_active: true,
    })

    if (profileError) {
      // Rollback
      await supabase.from("tenants").delete().eq("id", tenant.id)
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: "ไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้ กรุณาลองใหม่" }, { status: 500 })
    }

    // 4. Record trial registration
    const { error: trialError } = await supabase.from("trial_registrations").insert({
      tenant_id: tenant.id,
      user_id: userId,
      email: ownerEmail,
      shop_name: shopName,
      shop_phone: shopPhone,
      shop_province: shopProvince,
      shop_size: shopSize || "small",
      selected_plan: selectedPlan || "professional",
      status: "active",
      trial_starts_at: new Date().toISOString(),
      trial_ends_at: trialEnd,
    })

    if (trialError) {
      console.error("Trial registration record failed:", trialError)
      // Non-critical, continue
    }

    // 5. Record subscription history
    await supabase.from("subscription_history").insert({
      tenant_id: tenant.id,
      action: "trial_started",
      plan: selectedPlan || "professional",
      details: {
        trial_days: 7,
        registered_by: ownerEmail,
        shop_name: shopName,
      },
    })

    // 6. Send confirmation email via Supabase (resend verification)
    await supabase.auth.resend({
      type: "signup",
      email: ownerEmail,
    })

    return NextResponse.json({
      success: true,
      message: "สมัครทดลองสำเร็จ",
      data: {
        tenantId: tenant.id,
        trialEndsAt: trialEnd,
        plan: selectedPlan,
      },
    })
  } catch (error) {
    console.error("Trial registration error:", error)
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง" }, { status: 500 })
  }
}
