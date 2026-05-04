"use client"

import * as React from "react"
import { ChevronRight, Package, Boxes } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { StorageNode } from "@/lib/actions/storage"
import { listPlacementsForNode } from "@/lib/actions/storage"

// =============================================================================
// ShelfInspector — front-on grid view of one node + drill-down to descendants.
// =============================================================================

interface Props {
  /** The node currently being inspected (may be a shelf, level, or sub-node) */
  node: StorageNode
  /** All nodes in the room (used to find direct children) */
  allRoomNodes: StorageNode[]
  highlightNodeIds?: Set<string>
  /** Fired when user wants to drill into a sub-node */
  onDrillDown?: (child: StorageNode) => void
  /** Click "back" — usually goes to parent inspector or door view */
  onBack?: () => void
  className?: string
}

export function ShelfInspector({
  node,
  allRoomNodes,
  highlightNodeIds,
  onDrillDown,
  onBack,
  className,
}: Props) {
  const directChildren = React.useMemo(
    () => allRoomNodes.filter((n) => n.parent_id === node.id),
    [allRoomNodes, node.id],
  )

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-3 sm:p-5", className)}>
      {/* Breadcrumb header */}
      <div className="mb-3 flex items-start justify-between gap-2 sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <Breadcrumb path={node.path_labels} />
          <h3 className="mt-1 truncate text-sm font-bold sm:text-lg">
            {node.label}
          </h3>
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            {nodeTypeLabel(node.type)}
            {node.code && ` • ${node.code}`}
          </p>
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted sm:px-3 sm:py-1.5 sm:text-xs"
          >
            ← กลับ
          </button>
        )}
      </div>

      {/* Body — either grid of children or product list (leaf) */}
      {directChildren.length === 0 ? (
        <LeafProductList nodeId={node.id} highlighted={highlightNodeIds?.has(node.id)} />
      ) : (
        <ChildrenGrid
          parent={node}
          nodes={directChildren}
          highlightNodeIds={highlightNodeIds}
          onDrillDown={onDrillDown}
        />
      )}
    </div>
  )
}

function Breadcrumb({ path }: { path: string[] }) {
  if (!path?.length) return null
  return (
    <nav className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
      {path.map((label, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3 w-3" />}
          <span className={i === path.length - 1 ? "font-semibold text-foreground" : ""}>
            {label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  )
}

// =============================================================================
// ChildrenGrid — render direct children laid out per parent's child_layout
// =============================================================================

interface ChildrenGridProps {
  parent: StorageNode
  nodes: StorageNode[]
  highlightNodeIds?: Set<string>
  onDrillDown?: (n: StorageNode) => void
}

function ChildrenGrid({ parent, nodes, highlightNodeIds, onDrillDown }: ChildrenGridProps) {
  const layout = parent.child_layout

  if (layout?.mode === "grid") {
    return (
      <GridView
        layout={layout}
        nodes={nodes}
        highlightNodeIds={highlightNodeIds}
        onDrillDown={onDrillDown}
      />
    )
  }

  // Free-form / no layout: render as card grid
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {nodes.map((child) => (
        <button
          key={child.id}
          type="button"
          onClick={() => onDrillDown?.(child)}
          className={cn(
            "flex flex-col items-start gap-1 rounded-xl border border-border bg-muted/40 p-3 text-left transition-colors hover:bg-muted",
            highlightNodeIds?.has(child.id) &&
              "border-primary bg-primary/10 shadow-[0_0_20px_4px_rgba(124,91,251,0.4)]",
          )}
        >
          <span className="text-xs font-bold">{child.code}</span>
          <span className="text-[10px] text-muted-foreground">{child.label}</span>
        </button>
      ))}
    </div>
  )
}

interface GridViewProps {
  layout: NonNullable<StorageNode["child_layout"]>
  nodes: StorageNode[]
  highlightNodeIds?: Set<string>
  onDrillDown?: (n: StorageNode) => void
}

function GridView({ layout, nodes, highlightNodeIds, onDrillDown }: GridViewProps) {
  const rows = layout.rows ?? 1
  const cols = layout.cols ?? 1
  const layers = layout.layers ?? 1
  const [activeLayer, setActiveLayer] = React.useState(1)

  const cellMap = React.useMemo(() => {
    const m = new Map<string, StorageNode>()
    for (const c of nodes) {
      const p = c.position as { row?: number; col?: number; layer?: number }
      const key = `${p.layer ?? 1}:${p.row ?? 1}:${p.col ?? 1}`
      m.set(key, c)
    }
    return m
  }, [nodes])

  return (
    <div className="space-y-3">
      {layers > 1 && (
        <div className="flex gap-1.5">
          {Array.from({ length: layers }, (_, i) => i + 1).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setActiveLayer(l)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                activeLayer === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              ชั้นลึก {l}
            </button>
          ))}
        </div>
      )}

      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(48px, 1fr))`,
        }}
      >
        {Array.from({ length: rows }, (_, rIdx) => {
          const r = rows - rIdx // visually top row = highest row number
          return Array.from({ length: cols }, (_, cIdx) => {
            const c = cIdx + 1
            const key = `${activeLayer}:${r}:${c}`
            const cell = cellMap.get(key)
            const highlighted = cell ? highlightNodeIds?.has(cell.id) ?? false : false
            return (
              <Cell
                key={key}
                cell={cell}
                row={r}
                col={c}
                highlighted={highlighted}
                onClick={() => cell && onDrillDown?.(cell)}
              />
            )
          })
        })}
      </div>

      <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground">
        <Legend color="bg-pastel-mint" label="มีของ" />
        <Legend color="bg-pastel-amber" label="ใกล้เต็ม" />
        <Legend color="bg-muted" label="ว่าง" />
        <Legend color="bg-primary/20" label="ค้นหาเจอ" pulse />
      </div>
    </div>
  )
}

interface CellProps {
  cell?: StorageNode
  row: number
  col: number
  highlighted?: boolean
  onClick: () => void
}

function Cell({ cell, row, col, highlighted, onClick }: CellProps) {
  if (!cell) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-2 text-center text-[10px] text-muted-foreground/50">
        {String.fromCharCode(64 + row)}
        {col}
      </div>
    )
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 p-2 text-center transition-all",
        highlighted
          ? "border-primary bg-primary/15"
          : "border-border bg-pastel-mint/40 hover:border-primary/60",
      )}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="text-[10px] font-bold leading-tight">{cell.code.split("-").pop()}</span>
      <span className="line-clamp-1 text-[9px] leading-tight text-muted-foreground">
        {cell.label}
      </span>
      {highlighted && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-primary"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(124,91,251,0.7)",
              "0 0 0 12px rgba(124,91,251,0)",
              "0 0 0 0 rgba(124,91,251,0)",
            ],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  )
}

function Legend({
  color,
  label,
  pulse,
}: {
  color: string
  label: string
  pulse?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-2.5 w-2.5 rounded", color, pulse && "animate-pulse")} />
      {label}
    </span>
  )
}

// =============================================================================
// LeafProductList — show products stored in this node
// =============================================================================

function LeafProductList({ nodeId, highlighted }: { nodeId: string; highlighted?: boolean }) {
  const [items, setItems] = React.useState<Awaited<ReturnType<typeof listPlacementsForNode>> | null>(null)

  React.useEffect(() => {
    let cancelled = false
    listPlacementsForNode(nodeId).then((data) => {
      if (!cancelled) setItems(data)
    })
    return () => {
      cancelled = true
    }
  }, [nodeId])

  if (!items) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center",
          highlighted && "border-primary bg-primary/10",
        )}
      >
        <Boxes className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">ยังไม่มีสินค้าในช่องนี้</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pastel-purple text-violet-600">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{p.part?.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {p.part?.part_number}
              {p.notes && ` • ${p.notes}`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{p.quantity}</p>
            {p.is_primary && (
              <Badge tone="info" className="mt-0.5 text-[9px]">
                หลัก
              </Badge>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

function nodeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    shelf: "เชลฟ์",
    cabinet: "ตู้",
    rack: "แท่น/แร็ค",
    level: "ชั้น",
    bin: "ช่อง",
    drawer: "ลิ้นชัก",
    hook: "ตะขอแขวน",
    pallet: "พาเลท",
    compartment: "ช่องย่อย",
    custom: "อื่นๆ",
  }
  return map[type] ?? type
}
