"use client"

import * as React from "react"
import { Search, Loader2, MapPin, Star, Package } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  searchPartsWithLocations,
  type PartSearchResult,
} from "@/lib/actions/storage"

// =============================================================================
// StorageSearch — input + dropdown of matching parts with all locations.
// On select, fires onLocationSelected with the chosen placement target.
// =============================================================================

interface Props {
  /** Fired when user clicks a specific placement to navigate the camera there */
  onLocationSelected: (target: {
    partId: string
    partName: string
    nodeId: string
    roomId: string
    roomName: string
    path: string[]
    quantity: number
  }) => void
  className?: string
}

export function StorageSearch({ onLocationSelected, className }: Props) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<PartSearchResult[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      const data = await searchPartsWithLocations(query)
      setResults(data)
      setLoading(false)
      setOpen(true)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // Click outside to close
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-xl", className)}>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-resting)]">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="ค้นหารหัส/ชื่ออะไหล่..."
          className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-30 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-popover shadow-[var(--shadow-raised)]"
          >
            {results.map((part) => (
              <PartResultItem
                key={part.id}
                part={part}
                onLocationClick={(placement) => {
                  onLocationSelected({
                    partId: part.id,
                    partName: part.name,
                    nodeId: placement.node_id,
                    roomId: placement.room_id,
                    roomName: placement.room_name,
                    path: placement.path,
                    quantity: placement.quantity,
                  })
                  setOpen(false)
                  // Don't clear query — user can compare/reselect
                }}
              />
            ))}
          </motion.div>
        )}

        {open && !loading && query.trim() && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 z-30 mt-2 rounded-2xl border border-border bg-popover px-4 py-6 text-center text-sm text-muted-foreground shadow-[var(--shadow-raised)]"
          >
            ไม่พบอะไหล่ที่ตรงกับ &quot;{query}&quot;
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// =============================================================================
// PartResultItem — show one part + collapsible list of placements
// =============================================================================

interface PartItemProps {
  part: PartSearchResult
  onLocationClick: (placement: PartSearchResult["placements"][0]) => void
}

function PartResultItem({ part, onLocationClick }: PartItemProps) {
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pastel-purple text-violet-600">
          <Package className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{part.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {part.part_number}
            {part.brand && ` • ${part.brand}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold">{part.total_quantity}</p>
          <p className="text-[10px] text-muted-foreground">
            {part.placements.length} ตำแหน่ง
          </p>
        </div>
      </div>

      {part.placements.length === 0 ? (
        <div className="bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          ⚠️ ยังไม่ได้กำหนดตำแหน่งเก็บ
        </div>
      ) : (
        <ul className="bg-muted/20 px-2 pb-2">
          {part.placements.map((placement) => (
            <li key={placement.node_id}>
              <button
                type="button"
                onClick={() => onLocationClick(placement)}
                className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-primary/10"
              >
                <MapPin className="h-3 w-3 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-foreground">
                    {placement.room_name}
                  </span>
                  <span className="text-muted-foreground">
                    {" › "}
                    {placement.path.join(" › ")}
                  </span>
                </span>
                <span className="shrink-0 font-bold">{placement.quantity}</span>
                {placement.is_primary && (
                  <Badge tone="info" className="text-[9px]">
                    <Star className="h-2.5 w-2.5" />
                    หลัก
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
