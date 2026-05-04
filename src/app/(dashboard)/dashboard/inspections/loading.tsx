import { Skeleton } from "@/components/ui/skeleton"

export default function InspectionsLoading() {
  return (
    <div className="space-y-4 px-3 pb-6 sm:space-y-6 sm:px-6">
      <div className="space-y-2 pt-3 sm:pt-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-40" />
      </div>

      <Skeleton className="h-11 w-full max-w-md rounded-xl" />

      {/* Inspection cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
