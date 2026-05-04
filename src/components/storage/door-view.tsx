"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useIsTabletUp } from "@/hooks/use-media-query"
import type { StorageRoom, StorageNode, NodePosition } from "@/lib/actions/storage"

// =============================================================================
// DoorView — CSS 3D perspective from center of front wall, looking in.
//
// Layout convention (cm in DB → px on screen via SCALE):
//   - Room is a 3-walled box (back, left, right) + floor + ceiling.
//   - Camera sits at front center (z = depth_cm/2 + camOffset), eye height 160cm.
//   - Top-level shelves are placed by their (x, y, z) on the floor with rotation.
//
// User can drag to rotate the view ±20° around the vertical axis (peek left/right).
// =============================================================================

const SCALE = 0.5 // 1cm = 0.5px on screen — keeps a 600cm room readable
const EYE_HEIGHT = 160 // cm

interface DoorViewProps {
  room: StorageRoom
  /** Top-level shelves only (parent_id NULL) */
  shelves: StorageNode[]
  /** node ids that should glow as the search highlight chain */
  highlightNodeIds?: Set<string>
  /** node id that the camera should focus on (zoom + pan) */
  focusNodeId?: string | null
  onShelfClick?: (node: StorageNode) => void
  /** Show floor grid for orientation */
  showGrid?: boolean
  className?: string
}

export function DoorView({
  room,
  shelves,
  highlightNodeIds,
  focusNodeId,
  onShelfClick,
  showGrid = true,
  className,
}: DoorViewProps) {
  const [yaw, setYaw] = React.useState(0) // ±20° rotation around Y
  const [zoom, setZoom] = React.useState(1)
  const dragRef = React.useRef<{ x: number; yaw: number } | null>(null)
  const isTabletUp = useIsTabletUp()

  // Compute responsive scale: rooms in cm need to fit phone screens (~340px content)
  // For a 600cm room: desktop 0.5 → 300px; mobile 0.32 → 192px (fits 340px content)
  const responsiveScale = isTabletUp ? 1 : 0.65

  const w = room.width_cm * SCALE
  const d = room.depth_cm * SCALE
  const h = room.height_cm * SCALE

  // Auto-zoom to focused shelf
  React.useEffect(() => {
    if (!focusNodeId) {
      setZoom(1)
      return
    }
    const target = shelves.find((s) => s.id === focusNodeId)
    if (!target) return
    setZoom(1.25)
    // Reset zoom after animation done
    const t = setTimeout(() => setZoom(1), 4000)
    return () => clearTimeout(t)
  }, [focusNodeId, shelves])

  function handlePointerDown(e: React.PointerEvent) {
    dragRef.current = { x: e.clientX, yaw }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.x
    const next = Math.max(-20, Math.min(20, dragRef.current.yaw + dx * 0.1))
    setYaw(next)
  }
  function handlePointerUp(e: React.PointerEvent) {
    dragRef.current = null
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={cn(
        "relative h-[50vh] min-h-[320px] w-full touch-none select-none overflow-hidden rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 sm:h-[60vh] sm:min-h-[400px]",
        className,
      )}
      style={{ perspective: "1500px" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Help overlay */}
      <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
        ลากซ้าย-ขวาเพื่อหมุน
      </div>

      {/* Yaw indicator */}
      <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-lg bg-black/40 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
        {yaw.toFixed(0)}°
      </div>

      <motion.div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={{
          // Camera sits at front-center, looking in. Move scene back (translateZ negative)
          // so it appears we're standing inside. responsiveScale shrinks for small viewports.
          transform: `translate(-50%, -50%) translateZ(${-d / 2}px) rotateY(${yaw}deg) scale(${zoom * responsiveScale})`,
        }}
        transition={{ type: "spring", damping: 22, stiffness: 180 }}
      >
        {/* Floor — rotated 90° on X so it lies flat */}
        <div
          className="absolute bg-gradient-to-b from-slate-300 to-slate-200 dark:from-slate-800 dark:to-slate-900"
          style={{
            width: w,
            height: d,
            left: -w / 2,
            top: -d / 2,
            transform: `rotateX(90deg) translateZ(${-EYE_HEIGHT * SCALE}px)`,
            backgroundImage: showGrid
              ? `linear-gradient(rgba(124,91,251,0.15) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(124,91,251,0.15) 1px, transparent 1px)`
              : undefined,
            backgroundSize: showGrid ? `${50 * SCALE}px ${50 * SCALE}px` : undefined,
          }}
        />

        {/* Back wall */}
        <div
          className="absolute bg-slate-200/80 dark:bg-slate-800/80"
          style={{
            width: w,
            height: h,
            left: -w / 2,
            top: -h + EYE_HEIGHT * SCALE,
            transform: `translateZ(${-d / 2}px)`,
            backgroundImage:
              "linear-gradient(rgba(124,91,251,0.06) 1px, transparent 1px)",
            backgroundSize: `${50 * SCALE}px ${50 * SCALE}px`,
          }}
        />

        {/* Left wall */}
        <div
          className="absolute bg-slate-200/60 dark:bg-slate-800/60"
          style={{
            width: d,
            height: h,
            left: -w / 2 - d / 2,
            top: -h + EYE_HEIGHT * SCALE,
            transform: `translateX(${d / 2}px) rotateY(90deg)`,
            transformOrigin: "right center",
          }}
        />

        {/* Right wall */}
        <div
          className="absolute bg-slate-200/60 dark:bg-slate-800/60"
          style={{
            width: d,
            height: h,
            left: w / 2,
            top: -h + EYE_HEIGHT * SCALE,
            transform: `translateX(${-d / 2}px) rotateY(-90deg)`,
            transformOrigin: "left center",
          }}
        />

        {/* Shelves */}
        {shelves.map((shelf) => (
          <ShelfBox
            key={shelf.id}
            shelf={shelf}
            roomWidth={w}
            roomDepth={d}
            highlighted={highlightNodeIds?.has(shelf.id) ?? false}
            focused={focusNodeId === shelf.id}
            onClick={() => onShelfClick?.(shelf)}
          />
        ))}
      </motion.div>

      {/* Empty state */}
      {shelves.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          ยังไม่มีเชลฟ์ในห้องนี้
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ShelfBox — a 3D cuboid representing one top-level node
// =============================================================================

interface ShelfBoxProps {
  shelf: StorageNode
  roomWidth: number
  roomDepth: number
  highlighted: boolean
  focused: boolean
  onClick: () => void
}

function ShelfBox({
  shelf,
  roomWidth,
  roomDepth,
  highlighted,
  focused,
  onClick,
}: ShelfBoxProps) {
  const pos = (shelf.position ?? {}) as NodePosition
  const w = (pos.width_cm ?? 100) * SCALE
  const d = (pos.depth_cm ?? 50) * SCALE
  const h = (pos.height_cm ?? 200) * SCALE
  const x = (pos.x ?? 0) * SCALE - roomWidth / 2 + w / 2
  const z = (pos.z ?? 0) * SCALE - roomDepth / 2 + d / 2
  const rotY = pos.rotation_deg ?? 0

  const tone = shelf.color || "#7C5BFB"

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        width: w,
        height: h,
        left: x - w / 2,
        top: -h + EYE_HEIGHT * 0.5,
        transformStyle: "preserve-3d",
      }}
      animate={{
        transform: `translateZ(${z}px) rotateY(${rotY}deg) scale(${focused ? 1.05 : 1})`,
      }}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", damping: 18, stiffness: 240 }}
      onClick={onClick}
    >
      {/* Front face */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center rounded-md border-2 backdrop-blur-sm transition-shadow",
          highlighted
            ? "shadow-[0_0_30px_8px_rgba(124,91,251,0.5)]"
            : "shadow-md",
        )}
        style={{
          backgroundColor: `${tone}33`,
          borderColor: highlighted ? "#7C5BFB" : tone,
          transform: `translateZ(${d / 2}px)`,
        }}
      >
        <span className="text-xs font-bold" style={{ color: tone }}>
          {shelf.code}
        </span>
        <span className="px-1.5 text-center text-[10px] font-medium text-foreground/80">
          {shelf.label}
        </span>
        {highlighted && (
          <motion.div
            className="absolute -inset-1 rounded-md border-2 border-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      {/* Back face */}
      <div
        className="absolute inset-0 rounded-md"
        style={{
          backgroundColor: `${tone}22`,
          transform: `translateZ(${-d / 2}px) rotateY(180deg)`,
        }}
      />

      {/* Left face */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: d,
          left: 0,
          backgroundColor: `${tone}1F`,
          transform: `translateX(${-d / 2}px) rotateY(-90deg)`,
          transformOrigin: "right center",
        }}
      />

      {/* Right face */}
      <div
        className="absolute top-0 bottom-0"
        style={{
          width: d,
          right: 0,
          backgroundColor: `${tone}2A`,
          transform: `translateX(${d / 2}px) rotateY(90deg)`,
          transformOrigin: "left center",
        }}
      />

      {/* Top */}
      <div
        className="absolute left-0 right-0"
        style={{
          height: d,
          top: 0,
          backgroundColor: `${tone}40`,
          transform: `translateY(${-d / 2}px) rotateX(90deg)`,
          transformOrigin: "center bottom",
        }}
      />
    </motion.div>
  )
}
