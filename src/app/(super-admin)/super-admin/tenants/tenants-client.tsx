"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Building2, MapPin, Phone, Pencil, Trash2, Loader2, Users } from "lucide-react"
import { cn, formatDateShort } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createTenant, updateTenant, deleteTenant } from "@/lib/actions/super-admin"

type Tenant = {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  tax_id: string | null
  plan: string
  subscription_status: string
  created_at: string
  users?: { id: string; full_name: string; email: string; role: string }[]
}

const planOptions = [
  { value: "free", label: "Free" },
  { value: "basic", label: "Basic" },
  { value: "professional", label: "Professional" },
  { value: "premium", label: "Premium" },
]

const statusOptions = [
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
const selectClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"

export default function TenantsClient({
  tenants,
  initialSearch,
}: {
  tenants: Tenant[]
  initialSearch: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTenant, setEditTenant] = useState<Tenant | null>(null)
  const [deleteTenantTarget, setDeleteTenantTarget] = useState<Tenant | null>(null)
  const [error, setError] = useState("")

  async function handleCreate(formData: FormData) {
    setError("")
    const result = await createTenant(formData)
    if (result.error) {
      setError(result.error)
      return
    }
    setCreateOpen(false)
    startTransition(() => router.refresh())
  }

  async function handleUpdate(formData: FormData) {
    if (!editTenant) return
    setError("")
    const result = await updateTenant(editTenant.id, formData)
    if (result.error) {
      setError(result.error)
      return
    }
    setEditTenant(null)
    startTransition(() => router.refresh())
  }

  async function handleDelete() {
    if (!deleteTenantTarget) return
    setError("")
    const result = await deleteTenant(deleteTenantTarget.id)
    if (result.error) {
      setError(result.error)
      return
    }
    setDeleteTenantTarget(null)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ร้านค้า (Tenants)</h1>
          <p className="text-sm text-muted-foreground">จัดการร้านค้าทั้งหมดในระบบ ({tenants.length} ร้าน)</p>
        </div>
        <button
          onClick={() => { setError(""); setCreateOpen(true) }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> เพิ่มร้านค้า
        </button>
      </div>

      {/* Search */}
      <form className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          name="search"
          placeholder="ค้นหาชื่อร้าน..."
          defaultValue={initialSearch}
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </form>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">ร้านค้า</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">เบอร์โทร</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">แผน</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">ผู้ใช้</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">สร้างเมื่อ</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        {t.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{t.address.slice(0, 40)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{t.slug}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {t.phone ? (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{t.phone}</span>
                    ) : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      t.plan === "professional" ? "bg-primary/10 text-primary" :
                      t.plan === "premium" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                      t.plan === "basic" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {t.plan || "free"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      t.subscription_status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      t.subscription_status === "trial" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>
                      {t.subscription_status || "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {t.users?.length || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateShort(t.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setError(""); setEditTenant(t) }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="แก้ไข"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setError(""); setDeleteTenantTarget(t) }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    ไม่พบร้านค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มร้านค้าใหม่</DialogTitle>
            <DialogDescription>กรอกข้อมูลร้านค้าเพื่อเพิ่มเข้าสู่ระบบ</DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{error}</div>}
          <form action={handleCreate} className="space-y-4">
            <FormField label="ชื่อร้าน *">
              <input name="name" required className={inputClass} placeholder="เช่น อู่ช่างมิตร" />
            </FormField>
            <FormField label="Slug *">
              <input name="slug" required className={inputClass} placeholder="เช่น changmit-auto (ภาษาอังกฤษ)" pattern="[a-z0-9\-]+" title="ใช้ตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข และ - เท่านั้น" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="เบอร์โทร">
                <input name="phone" className={inputClass} placeholder="02-xxx-xxxx" />
              </FormField>
              <FormField label="เลขผู้เสียภาษี">
                <input name="tax_id" className={inputClass} placeholder="เลข 13 หลัก" />
              </FormField>
            </div>
            <FormField label="ที่อยู่">
              <input name="address" className={inputClass} placeholder="ที่อยู่ร้าน" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="แผน">
                <select name="plan" defaultValue="free" className={selectClass}>
                  {planOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
              <FormField label="สถานะ">
                <select name="subscription_status" defaultValue="trial" className={selectClass}>
                  {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FormField>
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                ยกเลิก
              </button>
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                เพิ่มร้านค้า
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTenant} onOpenChange={(open) => !open && setEditTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขร้านค้า</DialogTitle>
            <DialogDescription>{editTenant?.name}</DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{error}</div>}
          {editTenant && (
            <form action={handleUpdate} className="space-y-4">
              <FormField label="ชื่อร้าน *">
                <input name="name" required defaultValue={editTenant.name} className={inputClass} />
              </FormField>
              <FormField label="Slug *">
                <input name="slug" required defaultValue={editTenant.slug} className={inputClass} pattern="[a-z0-9\-]+" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="เบอร์โทร">
                  <input name="phone" defaultValue={editTenant.phone || ""} className={inputClass} />
                </FormField>
                <FormField label="เลขผู้เสียภาษี">
                  <input name="tax_id" defaultValue={editTenant.tax_id || ""} className={inputClass} />
                </FormField>
              </div>
              <FormField label="ที่อยู่">
                <input name="address" defaultValue={editTenant.address || ""} className={inputClass} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="แผน">
                  <select name="plan" defaultValue={editTenant.plan} className={selectClass}>
                    {planOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
                <FormField label="สถานะ">
                  <select name="subscription_status" defaultValue={editTenant.subscription_status} className={selectClass}>
                    {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Show users in this tenant */}
              {editTenant.users && editTenant.users.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">ผู้ใช้ในร้าน ({editTenant.users.length})</p>
                  <div className="space-y-1 rounded-lg border border-border p-2">
                    {editTenant.users.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-2 py-1 text-xs">
                        <span className="font-medium">{u.full_name}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{u.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter>
                <button type="button" onClick={() => setEditTenant(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                  ยกเลิก
                </button>
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  บันทึก
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTenantTarget} onOpenChange={(open) => !open && setDeleteTenantTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบร้านค้า</DialogTitle>
            <DialogDescription>
              คุณต้องการลบร้าน &quot;{deleteTenantTarget?.name}&quot; ใช่หรือไม่? การลบจะไม่สามารถกู้คืนได้ ข้อมูลงานซ่อม ลูกค้า และผู้ใช้ทั้งหมดในร้านนี้จะถูกลบไปด้วย
            </DialogDescription>
          </DialogHeader>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">{error}</div>}
          <DialogFooter>
            <button type="button" onClick={() => setDeleteTenantTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              ลบร้านค้า
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
