"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { StorageRoom, StorageNode, NodePosition } from "@/lib/actions/storage"
import { updateNode } from "@/lib/actions/storage"

// =============================================================================
// FloorPlanEditor — top-down SVG view, drag-to-reposition shelves.
// =============================================================================

const SCALE = 0.5 // 1cm = 0.5px

interface Props {
  room: StorageRoom
  shelves: StorageNode[]
  onShelfClick?: (node: StorageNode) => void
  highlightNodeIds?: Set<string>
  /** Read-only — disable drag */
  readOnly?: boolean
  className?: string
}

export function FloorPlanEditor({
  room,
  shelves,
  onShelfClick,
  highlightNodeIds,
  readOnly,
  className,
}: Props) {
  const w = room.width_cm * SCALE
  const d = room.depth_cm * SCALE

  // Local optimistic positions during drag
  const [dragPos, setDragPos] = React.useState<Record<string, { x: number; z: number }>>({})

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card p-4",
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          ผังพื้น (มองจากด้านบน) · {room.width_cm} × {room.depth_cm} cm
        </span>
        {!readOnly && (
          <span className="text-[11px] text-muted-foreground">
            🖱️ ลากเชลฟ์เพื่อย้ายตำแหน่ง
          </span>
        )}
      </div>

      <div className="overflow-auto">
        <svg
          width={w + 20}
          height={d + 20}
          viewBox={`-10 -10 ${w + 20} ${d + 20}`}
          className="block"
        >
          {/* Room outline + grid */}
          <defs>
            <pattern
              id="grid"
              width={50 * SCALE}
              height={50 * SCALE}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${50 * SCALE} 0 L 0 0 0 ${50 * SCALE}`}
                fill="none"
                stroke="rgba(124,91,251,0.18)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect
            width={w}
            height={d}
            fill="url(#grid)"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-border"
          />

          {/* Front-wall door indicator (camera position) */}
          <line
            x1={w / 2 - 30}
            y1={d}
            x2={w / 2 + 30}
            y2={d}
            stroke="#7C5BFB"
            strokeWidth="3"
          />
          <text
            x={w / 2}
            y={d + 14}
            textAnchor="middle"
            className="fill-primary text-[10px] font-semibold"
          >
            ประตู / กล้อง
          </text>

          {/* Shelves */}
          {shelves.map((shelf) => (
            <DraggableShelf
              key={shelf.id}
              shelf={shelf}
              roomWidth={w}
              roomDepth={d}
              dragPos={dragPos[shelf.id]}
              onDragEnd={async (x, z) => {
                setDragPos((prev) => ({ ...prev, [shelf.id]: { x, z } }))
                const pos = (shelf.position ?? {}) as NodePosition
                await updateNode(shelf.id, {
                  position: {
                    ...pos,
                    x: Math.round(x / SCALE),
                    z: Math.round(z / SCALE),
                  },
                })
              }}
              onClick={() => onShelfClick?.(shelf)}
              highlighted={highlightNodeIds?.has(shelf.id) ?? false}
              readOnly={readOnly}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

// =============================================================================
// DraggableShelf — one rectangle, dragable in SVG
// =============================================================================

interface DragShelfProps {
  shelf: StorageNode
  roomWidth: number
  roomDepth: number
  dragPos?: { x: number; z: number }
  onDragEnd: (x: number, z: number) => void
  onClick: () => void
  highlighted: boolean
  readOnly?: boolean
}

function DraggableShelf({
  shelf,
  roomWidth,
  roomDepth,
  dragPos,
  onDragEnd,
  onClick,
  highlighted,
  readOnly,
}: DragShelfProps) {
  const pos = (shelf.position ?? {}) as NodePosition
  const sw = (pos.width_cm ?? 100) * SCALE
  const sd = (pos.depth_cm ?? 50) * SCALE

  // top-left corner of rect = center - half size
  const cx = dragPos?.x ?? (pos.x ?? 0) * SCALE
  const cz = dragPos?.z ?? (pos.z ?? 0) * SCALE
  const x = cx - sw / 2
  const y = cz - sd / 2

  const tone = shelf.color || "#7C5BFB"
  const dragRef = React.useRef<{
    start: { x: number; y: number }
    origin: { x: number; y: number }
  } | null>(null)

  function handlePointerDown(e: React.PointerEvent<SVGGElement>) {
    if (readOnly) return
    e.stopPropagation()
    const svg = (e.target as SVGElement).ownerSVGElement
    if (!svg) return
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    dragRef.current = {
      start: { x: e.clientX, y: e.clientY },
      origin: { x: cx, y: cz },
    }
    ;(e.target as SVGGElement).setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!dragRef.current) return
    e.stopPropagation()
    const dx = e.clientX - dragRef.current.start.x
    const dy = e.clientY - dragRef.current.start.y
    const newX = Math.max(sw / 2, Math.min(roomWidth - sw / 2, dragRef.current.origin.x + dx))
    const newZ = Math.max(sd / 2, Math.min(roomDepth - sd / 2, dragRef.current.origin.y + dy))
    onDragEnd(newX, newZ)
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  const justClick =
    dragRef.current === null ||
    (Math.abs((dragPos?.x ?? cx) - cx) < 2 && Math.abs((dragPos?.z ?? cz) - cz) < 2)

  return (
    <g
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={(e) => {
        if (justClick) {
          e.stopPropagation()
          onClick()
        }
      }}
      style={{ cursor: readOnly ? "pointer" : "grab" }}
    >
      <motion.rect
        animate={{ x, y }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        width={sw}
        height={sd}
        rx={4}
        fill={`${tone}55`}
        stroke={highlighted ? "#7C5BFB" : tone}
        strokeWidth={highlighted ? 3 : 1.5}
        className={highlighted ? "drop-shadow-[0_0_8px_rgba(124,91,251,0.6)]" : ""}
      />
      <motion.text
        animate={{ x: cx, y: cz - 4 }}
        textAnchor="middle"
        className="pointer-events-none fill-foreground text-[10px] font-bold"
      >
        {shelf.code}
      </motion.text>
      <motion.text
        animate={{ x: cx, y: cz + 8 }}
        textAnchor="middle"
        className="pointer-events-none fill-muted-foreground text-[9px]"
      >
        {shelf.label}
      </motion.text>
    </g>
  )
}
