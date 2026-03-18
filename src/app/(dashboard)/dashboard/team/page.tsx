import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { getTeamMembers } from "@/lib/actions/team"
import Link from "next/link"
import { TimeClockTab } from "./time-clock-tab"
import { TeamMembersClient } from "@/components/team/team-members-client"

// =============================================================================
// Tab Definitions
// =============================================================================

const TABS = [
  { key: "members", label: "สมาชิก" },
  { key: "timeclock", label: "บันทึกเวลา" },
  { key: "summary", label: "สรุปเวลางาน" },
] as const

// =============================================================================
// Page Component
// =============================================================================

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "members"

  const members = await getTeamMembers()

  return (
    <div className="space-y-6">
      <PageHeader title="ทีมงาน" />

      {/* Tab Bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 sm:px-6 pb-px">
        {TABS.map(tab => (
          <Link
            key={tab.key}
            href={`/dashboard/team?tab=${tab.key}`}
            className={cn(
              "shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-b-2 border-primary bg-primary/5 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* ============================================================ */}
      {/* Tab: สมาชิก */}
      {/* ============================================================ */}
      {activeTab === "members" && (
        <TeamMembersClient members={members} />
      )}

      {/* ============================================================ */}
      {/* Tab: บันทึกเวลา + สรุปเวลางาน (Client Component) */}
      {/* ============================================================ */}
      {(activeTab === "timeclock" || activeTab === "summary") && (
        <TimeClockTab defaultView={activeTab === "summary" ? "team" : "my"} />
      )}
    </div>
  )
}
