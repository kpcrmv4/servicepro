import {
  Building2,
  Users,
  Save,
  Bell,
  MessageSquare,
  CreditCard,
  CalendarClock,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getShopSettings, getTeamMembers, updateShopSettings } from "@/lib/actions/settings"
import Link from "next/link"

const roleLabels: Record<string, string> = {
  owner: "เจ้าของ",
  admin: "ผู้ดูแล",
  manager: "ผู้จัดการ",
  technician: "ช่าง",
  receptionist: "พนักงานต้อนรับ",
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>
}) {
  const params = await searchParams
  const activeSection = params.section || "shop"

  const [shop, members] = await Promise.all([
    getShopSettings(),
    getTeamMembers(),
  ])

  const sections = [
    { key: "shop", label: "ข้อมูลร้าน", icon: Building2 },
    { key: "team", label: "สมาชิกทีม", icon: Users },
    { key: "booking", label: "จองคิวออนไลน์", icon: CalendarClock, href: "/dashboard/settings/booking" },
    { key: "customer-notifications", label: "แจ้งเตือนลูกค้า (LINE)", icon: Send, href: "/dashboard/settings/customer-notifications" },
    { key: "notifications", label: "แจ้งเตือนทีมงาน", icon: Bell, href: "/dashboard/settings/notifications" },
    { key: "line", label: "LINE OA (ลูกค้า)", icon: MessageSquare, href: "/dashboard/settings/line" },
    { key: "subscription", label: "สมาชิก & ต่ออายุ", icon: CreditCard, href: "/dashboard/settings/subscription" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="ตั้งค่า" />

      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:gap-6 sm:px-6">
        {/* Sidebar */}
        <div className="flex gap-2 overflow-x-auto sm:w-56 sm:shrink-0 sm:flex-col sm:space-y-1 sm:gap-0">
          {sections.map((section) => {
            const Icon = section.icon
            const sectionHref = (section as { href?: string }).href
            return (
              <Link
                key={section.key}
                href={sectionHref || `/dashboard/settings?section=${section.key}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeSection === section.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </Link>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeSection === "shop" && (() => {
            const shopSettings = (shop?.settings as Record<string, unknown>) || {}
            const bankAccount = (shopSettings.bank_account as Record<string, unknown>) || {}
            return (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">ข้อมูลร้าน</h2>
                <form
                  action={async (formData) => {
                    'use server'
                    await updateShopSettings(formData)
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">ชื่อร้าน</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={shop?.name || ""}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">ที่อยู่</label>
                    <textarea
                      name="address"
                      defaultValue={shop?.address || ""}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">เบอร์โทร</label>
                      <input
                        type="text"
                        name="phone"
                        defaultValue={shop?.phone || ""}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">เลขประจำตัวผู้เสียภาษี</label>
                      <input
                        type="text"
                        name="tax_id"
                        defaultValue={shop?.tax_id || ""}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold mb-1">รับชำระเงินจากลูกค้า</h3>
                      <p className="text-xs text-muted-foreground">
                        ใช้สำหรับสร้าง QR PromptPay บนใบเสร็จ และแจ้งเลขบัญชีให้ลูกค้าโอน
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">PromptPay (เบอร์โทร 10 หลัก หรือ ID 13 หลัก)</label>
                      <input
                        type="text"
                        name="promptpay_id"
                        defaultValue={(shopSettings.promptpay_id as string) || ""}
                        placeholder="0812345678"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">ชื่อธนาคาร</label>
                        <input
                          type="text"
                          name="bank_name"
                          defaultValue={(bankAccount.bank_name as string) || ""}
                          placeholder="SCB / KTB / BBL"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">เลขบัญชี</label>
                        <input
                          type="text"
                          name="bank_account"
                          defaultValue={(bankAccount.account_number as string) || ""}
                          placeholder="123-4-56789-0"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">ชื่อบัญชี</label>
                        <input
                          type="text"
                          name="bank_account_name"
                          defaultValue={(bankAccount.account_name as string) || ""}
                          placeholder="บจก. ..."
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">แผน</label>
                      <input
                        type="text"
                        value={shop?.plan || "free"}
                        disabled
                        className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">สถานะ</label>
                      <input
                        type="text"
                        value={shop?.subscription_status || "-"}
                        disabled
                        className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4" /> บันทึก
                  </button>
                </form>
              </div>
            )
          })()}

          {activeSection === "team" && (
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-4 sm:px-6">
                <h2 className="text-lg font-semibold">สมาชิกทีม</h2>
                <p className="text-sm text-muted-foreground">จัดการสมาชิกในร้านของคุณ</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ชื่อ</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">อีเมล</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">บทบาท</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member: Record<string, unknown>) => (
                      <tr key={member.id as string} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {(member.full_name as string)?.charAt(0) || "?"}
                            </div>
                            <span className="text-sm font-medium">{member.full_name as string}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{member.email as string}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {roleLabels[member.role as string] || member.role as string}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            member.is_active ? "bg-success/10 text-success" : "bg-error/10 text-error"
                          )}>
                            {member.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {members.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                          ยังไม่มีสมาชิก
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
