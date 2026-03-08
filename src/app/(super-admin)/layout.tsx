import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  LogOut,
  Shield,
} from "lucide-react"

const navItems = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/tenants", label: "ร้านค้า (Tenants)", icon: Building2 },
  { href: "/super-admin/users", label: "ผู้ใช้ทั้งหมด", icon: Users },
  { href: "/super-admin/subscriptions", label: "Subscriptions", icon: CreditCard },
]

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is super_admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "super_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - hidden on mobile, shown on lg */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Super Admin</h1>
            <p className="text-xs text-muted-foreground">ServicePro</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-xs text-red-500 font-medium">Super Admin</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Nav */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold">Super Admin</span>
        </div>
        <div className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
