"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  MapPin,
  Wrench,
  Check,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const provinces = [
  "กรุงเทพมหานคร",
  "กระบี่",
  "กาญจนบุรี",
  "กาฬสินธุ์",
  "กำแพงเพชร",
  "ขอนแก่น",
  "จันทบุรี",
  "ฉะเชิงเทรา",
  "ชลบุรี",
  "ชัยนาท",
  "ชัยภูมิ",
  "ชุมพร",
  "เชียงราย",
  "เชียงใหม่",
  "ตรัง",
  "ตราด",
  "ตาก",
  "นครนายก",
  "นครปฐม",
  "นครพนม",
  "นครราชสีมา",
  "นครศรีธรรมราช",
  "นครสวรรค์",
  "นนทบุรี",
  "นราธิวาส",
  "น่าน",
  "บึงกาฬ",
  "บุรีรัมย์",
  "ปทุมธานี",
  "ประจวบคีรีขันธ์",
  "ปราจีนบุรี",
  "ปัตตานี",
  "พระนครศรีอยุธยา",
  "พะเยา",
  "พังงา",
  "พัทลุง",
  "พิจิตร",
  "พิษณุโลก",
  "เพชรบุรี",
  "เพชรบูรณ์",
  "แพร่",
  "ภูเก็ต",
  "มหาสารคาม",
  "มุกดาหาร",
  "แม่ฮ่องสอน",
  "ยโสธร",
  "ยะลา",
  "ร้อยเอ็ด",
  "ระนอง",
  "ระยอง",
  "ราชบุรี",
  "ลพบุรี",
  "ลำปาง",
  "ลำพูน",
  "เลย",
  "ศรีสะเกษ",
  "สกลนคร",
  "สงขลา",
  "สตูล",
  "สมุทรปราการ",
  "สมุทรสงคราม",
  "สมุทรสาคร",
  "สระแก้ว",
  "สระบุรี",
  "สิงห์บุรี",
  "สุโขทัย",
  "สุพรรณบุรี",
  "สุราษฎร์ธานี",
  "สุรินทร์",
  "หนองคาย",
  "หนองบัวลำภู",
  "อ่างทอง",
  "อำนาจเจริญ",
  "อุดรธานี",
  "อุตรดิตถ์",
  "อุทัยธานี",
  "อุบลราชธานี",
];

const jobTypes = [
  "ซ่อมเครื่องยนต์",
  "ซ่อมช่วงล่าง",
  "ระบบไฟฟ้า",
  "แอร์รถยนต์",
  "ซ่อมสีและตัวถัง",
  "เปลี่ยนถ่ายน้ำมัน",
  "ซ่อมเกียร์",
  "ระบบเบรก",
  "ยางและล้อ",
  "ตรวจเช็คระยะ",
];

const steps = [
  { num: 1, title: "ข้อมูลผู้ใช้" },
  { num: 2, title: "ข้อมูลอู่" },
  { num: 3, title: "เลือกแผน" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "premium">("pro");
  const [error, setError] = useState("");

  // Step 1: User info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Garage info
  const [garageName, setGarageName] = useState("");
  const [province, setProvince] = useState("");
  const [bayCount, setBayCount] = useState("");
  const [technicianCount, setTechnicianCount] = useState("");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  const toggleJob = (job: string) => {
    setSelectedJobs((prev) =>
      prev.includes(job) ? prev.filter((j) => j !== job) : [...prev, job]
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      setStep(1);
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      setIsLoading(false);
      setStep(1);
      return;
    }

    try {
      const supabase = createClient();

      // Create slug from garage name
      const slug = garageName
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, "-")
        .replace(/^-|-$/g, "")
        || `shop-${Date.now()}`;

      // Determine plan name
      const planName = selectedPlan === "premium" ? "premium" : "professional";

      // First create the tenant
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: garageName,
          slug,
          phone,
          address: province,
          plan: planName,
          subscription_status: "trial" as const,
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          settings: {
            bay_count: bayCount ? parseInt(bayCount) : null,
            technician_count: technicianCount ? parseInt(technicianCount) : null,
            job_types: selectedJobs,
          },
        })
        .select()
        .single();

      if (tenantError) {
        if (tenantError.message.includes("duplicate")) {
          setError("ชื่ออู่นี้ถูกใช้งานแล้ว กรุณาเปลี่ยนชื่อ");
        } else {
          setError("ไม่สามารถสร้างร้านได้: " + tenantError.message);
        }
        setIsLoading(false);
        return;
      }

      // Sign up the user
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            tenant_id: tenant.id,
            role: "owner",
          },
        },
      });

      if (authError) {
        // Rollback: delete tenant
        await supabase.from("tenants").delete().eq("id", tenant.id);
        if (authError.message.includes("already registered")) {
          setError("อีเมลนี้ถูกใช้งานแล้ว");
        } else {
          setError(authError.message);
        }
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-2xl font-bold text-foreground">สมัครใช้งาน</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        เริ่มต้นใช้งาน KPServicePro ฟรี 30 วัน
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                step >= s.num
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s.num ? <Check className="h-4 w-4" /> : s.num}
            </div>
            <span
              className={cn(
                "ml-2 hidden text-sm sm:inline",
                step >= s.num
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px w-8 sm:w-12",
                  step > s.num ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: User Info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">ข้อมูลผู้ใช้</h3>
            <p className="text-sm text-muted-foreground">
              สร้างบัญชีเพื่อเริ่มต้นใช้งาน
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="สมชาย ใจดี"
                  required
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="regEmail"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="regEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                เบอร์โทร
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  required
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="regPassword"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="regPassword"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  required
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                  required
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ถัดไป <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2: Garage Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">ข้อมูลอู่</h3>
            <p className="text-sm text-muted-foreground">
              กรอกข้อมูลอู่ของคุณ
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="garageName"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                ชื่ออู่
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="garageName"
                  type="text"
                  value={garageName}
                  onChange={(e) => setGarageName(e.target.value)}
                  placeholder="ชื่ออู่ซ่อมรถของคุณ"
                  required
                  className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="province"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                จังหวัด
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  required
                  className="w-full appearance-none rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">เลือกจังหวัด</option>
                  {provinces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="bayCount"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  จำนวน Bay/Lift
                </label>
                <input
                  id="bayCount"
                  type="number"
                  min="1"
                  value={bayCount}
                  onChange={(e) => setBayCount(e.target.value)}
                  placeholder="เช่น 4"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
              <div>
                <label
                  htmlFor="technicianCount"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  จำนวนช่าง
                </label>
                <input
                  id="technicianCount"
                  type="number"
                  min="1"
                  value={technicianCount}
                  onChange={(e) => setTechnicianCount(e.target.value)}
                  placeholder="เช่น 6"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                ประเภทงานหลัก
              </label>
              <div className="grid grid-cols-2 gap-2">
                {jobTypes.map((job) => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => toggleJob(job)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                      selectedJobs.includes(job)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input text-foreground hover:border-primary/50"
                    )}
                  >
                    {selectedJobs.includes(job) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Wrench className="h-3 w-3" />
                    )}
                    {job}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              ถัดไป <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Choose Plan */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">เลือกแผน</h3>
            <p className="text-sm text-muted-foreground">
              ทดลองใช้ฟรี 30 วัน ทุกแผน
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Pro Plan */}
            <button
              type="button"
              onClick={() => setSelectedPlan("pro")}
              className={cn(
                "rounded-xl border-2 p-5 text-left transition-all",
                selectedPlan === "pro"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <h4 className="text-lg font-bold text-foreground">Pro</h4>
                </div>
                {selectedPlan === "pro" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                ฿1,490
                <span className="text-sm font-normal text-muted-foreground">
                  /เดือน
                </span>
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> จัดการงานซ่อมไม่จำกัด
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> จัดการอะไหล่และสต็อก
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> รายงานพื้นฐาน
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> ผู้ใช้สูงสุด 5 คน
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> CRM + Loyalty
                </li>
              </ul>
            </button>

            {/* Premium Plan */}
            <button
              type="button"
              onClick={() => setSelectedPlan("premium")}
              className={cn(
                "relative rounded-xl border-2 p-5 text-left transition-all",
                selectedPlan === "premium"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <div className="absolute -top-3 right-4 rounded-full bg-warning px-3 py-0.5 text-[10px] font-bold text-white">
                แนะนำ
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-warning" />
                  <h4 className="text-lg font-bold text-foreground">Premium</h4>
                </div>
                {selectedPlan === "premium" && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">
                ฿2,990
                <span className="text-sm font-normal text-muted-foreground">
                  /เดือน
                </span>
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> ทุกฟีเจอร์ใน Pro
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> รายงานขั้นสูงและ
                  Analytics
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> แจ้งเตือน LINE / SMS
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> ผู้ใช้ไม่จำกัด
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-success" /> API
                  สำหรับเชื่อมต่อภายนอก
                </li>
              </ul>
            </button>
          </div>

          <div className="rounded-lg bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
            ไม่ต้องใส่บัตรเครดิต &bull; ยกเลิกได้ทุกเมื่อ
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {isLoading ? "กำลังสมัคร..." : "สมัครทดลองใช้ฟรี 30 วัน"}
            </button>
          </div>
        </div>
      )}

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </div>
  );
}
