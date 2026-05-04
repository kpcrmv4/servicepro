"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Building2, DoorOpen, Map, Box } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { DoorView } from "./door-view"
import { FloorPlanEditor } from "./floor-plan-editor"
import { ShelfInspector } from "./shelf-inspector"
import { StorageSearch } from "./storage-search"
import { MovementTimeline } from "./movement-timeline"
import {
  CreateBuildingDialog,
  CreateRoomDialog,
  CreateShelfDialog,
} from "./storage-dialogs"
import type {
  StorageBuilding,
  StorageRoom,
  StorageNode,
} from "@/lib/actions/storage"
import { listNodesForRoom } from "@/lib/actions/storage"

interface Props {
  buildings: StorageBuilding[]
  rooms: StorageRoom[]
}

type ViewMode = "door" | "floor" | "audit"

export function StoragePageClient({ buildings, rooms }: Props) {
  // Selection state
  const [selectedBuildingId, setSelectedBuildingId] = React.useState<string | null>(
    rooms[0]?.building_id ?? buildings[0]?.id ?? null,
  )
  const [selectedRoomId, setSelectedRoomId] = React.useState<string | null>(rooms[0]?.id ?? null)
  const [inspectingNodeId, setInspectingNodeId] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<ViewMode>("door")

  // Search highlight state
  const [highlightChain, setHighlightChain] = React.useState<Set<string>>(new Set())
  const [focusNodeId, setFocusNodeId] = React.useState<string | null>(null)

  // Dialog open states
  const [buildingDialogOpen, setBuildingDialogOpen] = React.useState(false)
  const [roomDialogOpen, setRoomDialogOpen] = React.useState(false)
  const [shelfDialogOpen, setShelfDialogOpen] = React.useState(false)

  // Load nodes for selected room
  const [allNodes, setAllNodes] = React.useState<StorageNode[]>([])
  const [loadingNodes, setLoadingNodes] = React.useState(false)

  React.useEffect(() => {
    if (!selectedRoomId) {
      setAllNodes([])
      return
    }
    let cancelled = false
    setLoadingNodes(true)
    listNodesForRoom(selectedRoomId).then((data) => {
      if (!cancelled) {
        setAllNodes(data)
        setLoadingNodes(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedRoomId])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const topShelves = React.useMemo(
    () => allNodes.filter((n) => n.parent_id === null),
    [allNodes],
  )
  const inspectingNode = inspectingNodeId
    ? allNodes.find((n) => n.id === inspectingNodeId)
    : null

  // Buildings filtered by selection (or all if "all")
  const visibleRooms = selectedBuildingId
    ? rooms.filter((r) => r.building_id === selectedBuildingId)
    : rooms

  // Auto-select first room of building when building changes
  React.useEffect(() => {
    if (visibleRooms.length === 0) {
      setSelectedRoomId(null)
      return
    }
    if (!visibleRooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(visibleRooms[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuildingId])

  // Search → fly-to
  async function handleLocationSelected(target: {
    partId: string
    partName: string
    nodeId: string
    roomId: string
    path: string[]
    quantity: number
  }) {
    // Switch room if different
    if (target.roomId !== selectedRoomId) {
      const targetRoom = rooms.find((r) => r.id === target.roomId)
      if (targetRoom) {
        setSelectedBuildingId(targetRoom.building_id)
        setSelectedRoomId(target.roomId)
        // Wait for nodes to load
        await new Promise((r) => setTimeout(r, 350))
        const fresh = await listNodesForRoom(target.roomId)
        setAllNodes(fresh)
      }
    }

    // Resolve full ancestor chain (room nodes loaded above)
    setTimeout(() => {
      const allRoomNodes =
        target.roomId === selectedRoomId ? allNodes : []
      // Re-fetch if needed
      ;(async () => {
        const nodes = allRoomNodes.length > 0
          ? allRoomNodes
          : await listNodesForRoom(target.roomId)

        const targetNode = nodes.find((n) => n.id === target.nodeId)
        if (!targetNode) return

        // Build ancestor chain by walking parent_id back to root
        const chain: string[] = [targetNode.id]
        let curr: StorageNode | undefined = targetNode
        while (curr?.parent_id) {
          const parent = nodes.find((n) => n.id === curr!.parent_id)
          if (!parent) break
          chain.push(parent.id)
          curr = parent
        }
        setHighlightChain(new Set(chain))

        // Top-level ancestor = the shelf to focus on
        const topLevel = chain[chain.length - 1]
        setFocusNodeId(topLevel)

        // Drill into the inspector at the leaf
        setInspectingNodeId(targetNode.id)
        setViewMode("door")

        // Clear after 5s
        setTimeout(() => {
          setHighlightChain(new Set())
          setFocusNodeId(null)
        }, 5000)
      })()
    }, target.roomId !== selectedRoomId ? 100 : 0)
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <StorageSearch onLocationSelected={handleLocationSelected} />

      {/* Building/Room selectors */}
      <div className="flex flex-wrap items-center gap-2">
        {buildings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-xs text-muted-foreground">อาคาร:</span>
            <PillButton
              active={selectedBuildingId === null}
              onClick={() => setSelectedBuildingId(null)}
            >
              ทั้งหมด
            </PillButton>
            {buildings.map((b) => (
              <PillButton
                key={b.id}
                active={selectedBuildingId === b.id}
                onClick={() => setSelectedBuildingId(b.id)}
              >
                <Building2 className="h-3 w-3" />
                {b.name}
              </PillButton>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setBuildingDialogOpen(true)}
              className="h-7 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">ห้อง:</span>
          {visibleRooms.map((r) => (
            <PillButton
              key={r.id}
              active={selectedRoomId === r.id}
              onClick={() => {
                setSelectedRoomId(r.id)
                setInspectingNodeId(null)
              }}
            >
              <DoorOpen className="h-3 w-3" />
              {r.name}
            </PillButton>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRoomDialogOpen(true)}
            className="h-7 px-2"
          >
            <Plus className="h-3 w-3" /> เพิ่มห้อง
          </Button>
        </div>
      </div>

      {!selectedRoom ? (
        <EmptyRoomState onCreate={() => setRoomDialogOpen(true)} />
      ) : (
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="door">
              <Box className="mr-1.5 h-3.5 w-3.5" /> มุมมอง 3D
            </TabsTrigger>
            <TabsTrigger value="floor">
              <Map className="mr-1.5 h-3.5 w-3.5" /> ผังพื้น
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Box className="mr-1.5 h-3.5 w-3.5" /> ประวัติเคลื่อนย้าย
            </TabsTrigger>
          </TabsList>

          <TabsContent value="door" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selectedRoom.name}</h3>
              <Button size="sm" onClick={() => setShelfDialogOpen(true)}>
                <Plus className="h-4 w-4" /> เพิ่มเชลฟ์
              </Button>
            </div>

            <DoorView
              room={selectedRoom}
              shelves={topShelves}
              highlightNodeIds={highlightChain}
              focusNodeId={focusNodeId}
              onShelfClick={(s) => setInspectingNodeId(s.id)}
            />

            <AnimatePresence>
              {inspectingNode && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2 }}
                >
                  <ShelfInspector
                    node={inspectingNode}
                    allRoomNodes={allNodes}
                    highlightNodeIds={highlightChain}
                    onDrillDown={(child) => setInspectingNodeId(child.id)}
                    onBack={() => {
                      // Walk up by parent_id
                      if (inspectingNode.parent_id) {
                        setInspectingNodeId(inspectingNode.parent_id)
                      } else {
                        setInspectingNodeId(null)
                      }
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="floor" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{selectedRoom.name} — ผังพื้น</h3>
              <Button size="sm" onClick={() => setShelfDialogOpen(true)}>
                <Plus className="h-4 w-4" /> เพิ่มเชลฟ์
              </Button>
            </div>
            <FloorPlanEditor
              room={selectedRoom}
              shelves={topShelves}
              highlightNodeIds={highlightChain}
              onShelfClick={(s) => {
                setInspectingNodeId(s.id)
                setViewMode("door")
              }}
            />
          </TabsContent>

          <TabsContent value="audit">
            <MovementTimeline limit={50} />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      <CreateBuildingDialog
        open={buildingDialogOpen}
        onOpenChange={setBuildingDialogOpen}
        onCreated={(id) => setSelectedBuildingId(id)}
      />
      <CreateRoomDialog
        open={roomDialogOpen}
        onOpenChange={setRoomDialogOpen}
        buildings={buildings}
        defaultBuildingId={selectedBuildingId ?? undefined}
        onCreated={(id) => setSelectedRoomId(id)}
      />
      {selectedRoom && (
        <CreateShelfDialog
          open={shelfDialogOpen}
          onOpenChange={setShelfDialogOpen}
          roomId={selectedRoom.id}
          existingShelves={topShelves}
          onCreated={async (id) => {
            // Reload nodes
            const fresh = await listNodesForRoom(selectedRoom.id)
            setAllNodes(fresh)
            setInspectingNodeId(id)
          }}
        />
      )}
    </div>
  )
}

function PillButton({
  active,
  children,
  onClick,
}: {
  active?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-resting)]"
          : "bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function EmptyRoomState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/20 px-4 py-16 text-center">
      <DoorOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
      <h3 className="text-base font-semibold">ยังไม่มีห้องเก็บ</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        เริ่มสร้างห้องแรก แล้วเพิ่มเชลฟ์ ตู้ ลิ้นชัก ภายในเพื่อจัดการตำแหน่งสินค้าแบบ 3D
      </p>
      <Button className="mt-4" onClick={onCreate}>
        <Plus className="h-4 w-4" /> สร้างห้องแรก
      </Button>
    </div>
  )
}
