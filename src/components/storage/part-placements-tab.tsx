"use client"

import * as React from "react"
import { useTransition } from "react"
import { MapPin, Plus, Star, X, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { FormField } from "@/components/ui/form-field"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  listPlacementsForPart,
  setPlacement,
  deletePlacement,
  listRooms,
  listNodesForRoom,
  type PlacementWithNode,
  type StorageRoom,
  type StorageNode,
} from "@/lib/actions/storage"

// =============================================================================
// PartPlacementsTab — used inside part-dialog "Location" tab.
// Shows current placements + "+ เพิ่มตำแหน่ง" inline form.
// =============================================================================

interface Props {
  partId: string
}

export function PartPlacementsTab({ partId }: Props) {
  const [placements, setPlacements] = React.useState<PlacementWithNode[] | null>(null)
  const [rooms, setRooms] = React.useState<StorageRoom[]>([])
  const [adding, setAdding] = React.useState(false)

  const reload = React.useCallback(async () => {
    const [p, r] = await Promise.all([listPlacementsForPart(partId), listRooms()])
    setPlacements(p)
    setRooms(r)
  }, [partId])

  React.useEffect(() => {
    void reload()
  }, [reload])

  if (!placements) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {placements.length === 0 && !adding ? (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center">
          <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            ยังไม่ได้กำหนดตำแหน่งจัดเก็บ
          </p>
          <Button
            type="button"
            size="sm"
            className="mt-3"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-4 w-4" /> เพิ่มตำแหน่ง
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {placements.map((p) => (
              <PlacementRow
                key={p.id}
                placement={p}
                onChange={reload}
                onDelete={reload}
              />
            ))}
          </ul>

          {!adding && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" /> เพิ่มตำแหน่ง
            </Button>
          )}
        </>
      )}

      {adding && (
        <AddPlacementForm
          partId={partId}
          rooms={rooms}
          existingNodeIds={new Set(placements.map((p) => p.node_id))}
          onCancel={() => setAdding(false)}
          onAdded={async () => {
            setAdding(false)
            await reload()
          }}
        />
      )}
    </div>
  )
}

// =============================================================================
// PlacementRow
// =============================================================================

interface RowProps {
  placement: PlacementWithNode
  onChange: () => void
  onDelete: () => void
}

function PlacementRow({ placement, onChange, onDelete }: RowProps) {
  const [pending, startTransition] = useTransition()
  const [editingQty, setEditingQty] = React.useState(false)
  const [qty, setQty] = React.useState(String(placement.quantity))

  function commitQty() {
    setEditingQty(false)
    const n = Number(qty)
    if (Number.isNaN(n) || n < 0 || n === placement.quantity) {
      setQty(String(placement.quantity))
      return
    }
    startTransition(async () => {
      const res = await setPlacement({
        part_id: placement.part_id,
        node_id: placement.node_id,
        quantity: n,
        is_primary: placement.is_primary,
      })
      if (res.error) {
        toast.error(res.error)
        setQty(String(placement.quantity))
      } else {
        onChange()
      }
    })
  }

  function setPrimary() {
    if (placement.is_primary) return
    startTransition(async () => {
      const res = await setPlacement({
        part_id: placement.part_id,
        node_id: placement.node_id,
        quantity: placement.quantity,
        is_primary: true,
      })
      if (res.error) toast.error(res.error)
      else onChange()
    })
  }

  function remove() {
    if (!confirm("ลบตำแหน่งนี้?")) return
    startTransition(async () => {
      const res = await deletePlacement(placement.part_id, placement.node_id)
      if (res.error) toast.error(res.error)
      else onDelete()
    })
  }

  const node = placement.node
  const overCapacity =
    node?.capacity_max != null && placement.quantity > node.capacity_max

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-3",
        placement.is_primary
          ? "border-primary/40 bg-primary/5"
          : "border-border",
      )}
    >
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-foreground">
            {placement.room?.name ?? "—"}
          </span>
          <span className="text-muted-foreground">
            ›{" "}
            {(node?.path_labels ?? []).join(" › ") || node?.label || "?"}
          </span>
          {placement.is_primary && (
            <Badge tone="info" className="text-[10px]">
              <Star className="h-2.5 w-2.5" />
              หลัก
            </Badge>
          )}
          {overCapacity && (
            <Badge tone="warn" className="text-[10px]">
              <AlertTriangle className="h-2.5 w-2.5" />
              เกิน capacity ({node?.capacity_max})
            </Badge>
          )}
        </div>
        {placement.notes && (
          <p className="mt-0.5 text-[11px] italic text-muted-foreground">
            {placement.notes}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          {editingQty ? (
            <Input
              autoFocus
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onBlur={commitQty}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitQty()
                if (e.key === "Escape") {
                  setQty(String(placement.quantity))
                  setEditingQty(false)
                }
              }}
              className="h-7 w-24"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditingQty(true)}
              className="rounded-md border border-border px-2 py-0.5 text-sm font-bold hover:bg-muted"
              disabled={pending}
            >
              จำนวน: {placement.quantity}
            </button>
          )}

          {!placement.is_primary && (
            <button
              type="button"
              onClick={setPrimary}
              className="text-[11px] text-primary hover:underline"
              disabled={pending}
            >
              ตั้งเป็นหลัก
            </button>
          )}

          <button
            type="button"
            onClick={remove}
            className="ml-auto rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            disabled={pending}
            aria-label="ลบ"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </li>
  )
}

// =============================================================================
// AddPlacementForm — pick room → node → qty
// =============================================================================

interface AddProps {
  partId: string
  rooms: StorageRoom[]
  existingNodeIds: Set<string>
  onCancel: () => void
  onAdded: () => void
}

function AddPlacementForm({ partId, rooms, existingNodeIds, onCancel, onAdded }: AddProps) {
  const [pending, startTransition] = useTransition()
  const [roomId, setRoomId] = React.useState(rooms[0]?.id ?? "")
  const [nodeId, setNodeId] = React.useState("")
  const [quantity, setQuantity] = React.useState("0")
  const [primary, setPrimary] = React.useState(false)
  const [nodes, setNodes] = React.useState<StorageNode[]>([])

  React.useEffect(() => {
    if (!roomId) {
      setNodes([])
      return
    }
    let cancelled = false
    listNodesForRoom(roomId).then((data) => {
      if (!cancelled) {
        setNodes(data)
        setNodeId("")
      }
    })
    return () => {
      cancelled = true
    }
  }, [roomId])

  const roomOptions: ComboboxOption[] = rooms.map((r) => ({
    value: r.id,
    label: r.name,
  }))

  // Only leaf-or-empty-children nodes are valid placement targets
  const nodeOptions: ComboboxOption[] = nodes
    .filter((n) => !existingNodeIds.has(n.id))
    .map((n) => ({
      value: n.id,
      label: n.path_labels.join(" › "),
      hint: `${n.code}${n.capacity_max ? ` • cap ${n.capacity_max}` : ""}`,
    }))

  function submit() {
    if (!nodeId) {
      toast.error("เลือกตำแหน่ง")
      return
    }
    const q = Number(quantity)
    if (Number.isNaN(q) || q < 0) {
      toast.error("จำนวนต้องเป็นตัวเลข ≥ 0")
      return
    }
    startTransition(async () => {
      const res = await toast.promise(
        setPlacement({ part_id: partId, node_id: nodeId, quantity: q, is_primary: primary }),
        {
          loading: "กำลังเพิ่ม...",
          success: "เพิ่มตำแหน่งสำเร็จ",
          error: (err) => (err instanceof Error ? err.message : "ผิดพลาด"),
        },
      )
      if (!res.error) onAdded()
    })
  }

  return (
    <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-3">
      <p className="mb-3 text-xs font-semibold text-primary">เพิ่มตำแหน่งใหม่</p>
      <div className="space-y-3">
        <FormField label="ห้อง">
          <Combobox
            options={roomOptions}
            value={roomId}
            onValueChange={setRoomId}
            placeholder="เลือกห้อง"
            title="เลือกห้อง"
          />
        </FormField>

        <FormField label="ตำแหน่งในห้อง" hint={!roomId ? "เลือกห้องก่อน" : undefined}>
          <Combobox
            options={nodeOptions}
            value={nodeId}
            onValueChange={setNodeId}
            placeholder={roomId ? "เลือกเชลฟ์/ช่อง" : "เลือกห้องก่อน"}
            disabled={!roomId}
            title="เลือกตำแหน่ง"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="จำนวน" htmlFor="qty">
            <Input
              id="qty"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </FormField>
          <FormField
            label="ตำแหน่งหลัก"
            reverse
            hint="เลือกเพื่อใช้เป็นที่หลักของรายการนี้"
          >
            <input
              type="checkbox"
              checked={primary}
              onChange={(e) => setPrimary(e.target.checked)}
              className="h-5 w-5 rounded"
            />
          </FormField>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
            ยกเลิก
          </Button>
          <Button type="button" size="sm" onClick={submit} loading={pending}>
            เพิ่ม
          </Button>
        </div>
      </div>
    </div>
  )
}
