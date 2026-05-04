import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryLoading() {
  return (
    <div className="space-y-4 px-3 pb-6 sm:space-y-6 sm:px-6">
      <div className="space-y-2 pt-3 sm:pt-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-32" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-2xl rounded-xl" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full max-w-md rounded-xl" />

      {/* Table */}
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  )
}
