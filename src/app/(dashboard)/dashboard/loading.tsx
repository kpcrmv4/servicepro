export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-32 rounded bg-muted" />
        <div className="mt-1 h-4 w-48 rounded bg-muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="mt-2 h-7 w-20 rounded bg-muted" />
              </div>
              <div className="h-12 w-12 rounded-xl bg-muted" />
            </div>
            <div className="mt-3 h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="h-5 w-40 rounded bg-muted" />
          <div className="mt-4 h-64 rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="mt-4 h-64 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
