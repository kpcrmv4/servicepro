import { Skeleton } from "@/components/ui/skeleton"

export default function WarrantyLoading() {
  return (
    <div className="space-y-4 px-3 pb-6 sm:space-y-6 sm:px-6">
      <div className="space-y-2 pt-3 sm:pt-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-32" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-11 w-full max-w-md rounded-xl" />

      {/* Table */}
      <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  )
}
