"use client"

import * as React from "react"
import { useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { FormField, FormSection } from "@/components/ui/form-field"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import {
  createBuilding,
  createRoom,
  createNode,
  generateChildren,
  type StorageBuilding,
  type StorageNode,
  type NodeType,
  type ChildLayout,
} from "@/lib/actions/storage"

// =============================================================================
// CreateBuildingDialog
// =============================================================================

interface BuildingDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreated?: (id: string) => void
}

export function CreateBuildingDialog({ open, onOpenChange, onCreated }: BuildingDialogProps) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") || "").trim()
    const notes = String(fd.get("notes") || "").trim() || undefined
    if (!name) return

    startTransition(async () => {
      const result = await toast.promise(createBuilding({ name, notes }), {
        loading: "กำลังสร้าง...",
        success: "เพิ่มอาคารสำเร็จ",
        error: (err) => (err instanceof Error ? err.message : "ผิดพลาด"),
      })
      if (result.id) {
        onCreated?.(result.id)
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มอาคารใหม่</DialogTitle>
          <DialogDescription>กลุ่มห้องตามอาคาร เช่น &quot;ตึกหลัก&quot; / &quot;โกดังหลัง&quot;</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="ชื่ออาคาร" required htmlFor="building-name">
            <Input id="building-name" name="name" placeholder="ตึก A" required />
          </FormField>
          <FormField label="หมายเหตุ" htmlFor="building-notes">
            <Textarea id="building-notes" name="notes" rows={2} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={pending}>เพิ่มอาคาร</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// CreateRoomDialog
// =============================================================================

interface RoomDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  buildings: StorageBuilding[]
  defaultBuildingId?: string
  onCreated?: (id: string) => void
}

export function CreateRoomDialog({
  open,
  onOpenChange,
  buildings,
  defaultBuildingId,
  onCreated,
}: RoomDialogProps) {
  const [pending, startTransition] = useTransition()
  const [buildingId, setBuildingId] = React.useState(defaultBuildingId ?? "")

  React.useEffect(() => {
    if (open) setBuildingId(defaultBuildingId ?? "")
  }, [open, defaultBuildingId])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") || "").trim()
    if (!name) return

    startTransition(async () => {
      const result = await toast.promise(
        createRoom({
          name,
          building_id: buildingId || null,
          floor_number: Number(fd.get("floor_number") || 0) || undefined,
          width_cm: Number(fd.get("width_cm") || 600),
          depth_cm: Number(fd.get("depth_cm") || 400),
          height_cm: Number(fd.get("height_cm") || 280),
          notes: String(fd.get("notes") || "").trim() || undefined,
        }),
        {
          loading: "กำลังสร้าง...",
          success: "เพิ่มห้องสำเร็จ",
          error: (err) => (err instanceof Error ? err.message : "ผิดพลาด"),
        },
      )
      if (result.id) {
        onCreated?.(result.id)
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มห้องใหม่</DialogTitle>
          <DialogDescription>กำหนดขนาดห้องเพื่อ render มุมมอง 3D ได้ตามจริง</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {buildings.length > 0 && (
            <FormField label="อาคาร">
              <Select value={buildingId} onValueChange={setBuildingId} title="เลือกอาคาร">
                <SelectTrigger>
                  <SelectValue placeholder="ไม่ผูกกับอาคาร" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— ไม่ระบุ —</SelectItem>
                  {buildings.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="ชื่อห้อง" required htmlFor="room-name">
              <Input id="room-name" name="name" placeholder="ห้องอะไหล่หลัก" required />
            </FormField>
            <FormField label="ชั้นที่" htmlFor="room-floor">
              <Input id="room-floor" name="floor_number" type="number" placeholder="1" />
            </FormField>
          </div>

          <FormSection title="ขนาดห้อง" description="หน่วย cm — ใช้คำนวณมุมมอง 3D" variant="plain">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="กว้าง" htmlFor="w">
                <Input id="w" name="width_cm" type="number" defaultValue={600} />
              </FormField>
              <FormField label="ลึก" htmlFor="d">
                <Input id="d" name="depth_cm" type="number" defaultValue={400} />
              </FormField>
              <FormField label="สูง" htmlFor="h">
                <Input id="h" name="height_cm" type="number" defaultValue={280} />
              </FormField>
            </div>
          </FormSection>

          <FormField label="หมายเหตุ" htmlFor="room-notes">
            <Textarea id="room-notes" name="notes" rows={2} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={pending}>เพิ่มห้อง</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// =============================================================================
// CreateShelfDialog (top-level node in a room)
// =============================================================================

interface ShelfDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  roomId: string
  /** existing top-level nodes — used to suggest unused position */
  existingShelves: StorageNode[]
  onCreated?: (id: string) => void
}

const NODE_TYPES: { value: NodeType; label: string }[] = [
  { value: "shelf", label: "เชลฟ์ (Shelf)" },
  { value: "cabinet", label: "ตู้ (Cabinet)" },
  { value: "rack", label: "แท่น/แร็ค (Rack)" },
  { value: "drawer", label: "ลิ้นชัก (Drawer)" },
  { value: "pallet", label: "พาเลท (Pallet)" },
  { value: "custom", label: "อื่นๆ" },
]

export function CreateShelfDialog({
  open,
  onOpenChange,
  roomId,
  existingShelves,
  onCreated,
}: ShelfDialogProps) {
  const [pending, startTransition] = useTransition()
  const [type, setType] = React.useState<NodeType>("shelf")
  const [createGrid, setCreateGrid] = React.useState(true)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const code = String(fd.get("code") || "").trim()
    const label = String(fd.get("label") || "").trim()
    if (!code || !label) return

    const rows = Number(fd.get("rows") || 4)
    const cols = Number(fd.get("cols") || 6)
    const layers = Number(fd.get("layers") || 1)

    startTransition(async () => {
      // Pick a default position — stack along x axis
      const offsetX = existingShelves.length * 150 + 80

      const layout: ChildLayout | null = createGrid
        ? { mode: "grid", rows, cols, layers }
        : null

      const result = await toast.promise(
        createNode({
          room_id: roomId,
          parent_id: null,
          code,
          label,
          type,
          position: {
            x: offsetX,
            z: 80,
            rotation_deg: 0,
            width_cm: Number(fd.get("width_cm") || 100),
            depth_cm: Number(fd.get("depth_cm") || 50),
            height_cm: Number(fd.get("height_cm") || 200),
          },
          child_layout: layout,
        }),
        {
          loading: "กำลังสร้าง...",
          success: "เพิ่มเชลฟ์สำเร็จ",
          error: (err) => (err instanceof Error ? err.message : "ผิดพลาด"),
        },
      )

      if (result.id && createGrid) {
        // Auto-generate cells
        await generateChildren(result.id)
      }

      if (result.id) {
        onCreated?.(result.id)
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>เพิ่มเชลฟ์/ตู้/แท่น</DialogTitle>
          <DialogDescription>
            สร้างที่จัดเก็บใหม่ในห้องนี้ — ระบบจะจัดวางอัตโนมัติ ขยับตำแหน่งได้ใน Floor Plan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="รหัส" required htmlFor="code">
              <Input id="code" name="code" placeholder="S1, A, R-01" required />
            </FormField>
            <FormField label="ชื่อ" required htmlFor="label">
              <Input id="label" name="label" placeholder="เชลฟ์อะไหล่หลัก" required />
            </FormField>
          </div>

          <FormField label="ประเภท">
            <Select value={type} onValueChange={(v) => setType(v as NodeType)} title="เลือกประเภท">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NODE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormSection title="ขนาด (cm)" description="สำหรับ render 3D" variant="plain">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <FormField label="กว้าง" htmlFor="w">
                <Input id="w" name="width_cm" type="number" defaultValue={100} />
              </FormField>
              <FormField label="ลึก" htmlFor="d">
                <Input id="d" name="depth_cm" type="number" defaultValue={50} />
              </FormField>
              <FormField label="สูง" htmlFor="h">
                <Input id="h" name="height_cm" type="number" defaultValue={200} />
              </FormField>
            </div>
          </FormSection>

          <FormSection
            title="โครงภายใน"
            description="แบ่งเป็น grid ให้ระบบสร้าง cells อัตโนมัติ"
            variant="plain"
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createGrid}
                onChange={(e) => setCreateGrid(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              สร้าง grid ภายในอัตโนมัติ
            </label>

            {createGrid && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <FormField label="ชั้น (rows)" htmlFor="rows">
                  <Input id="rows" name="rows" type="number" defaultValue={4} min={1} />
                </FormField>
                <FormField label="ช่อง (cols)" htmlFor="cols">
                  <Input id="cols" name="cols" type="number" defaultValue={6} min={1} />
                </FormField>
                <FormField label="ความลึก (layers)" htmlFor="layers">
                  <Input id="layers" name="layers" type="number" defaultValue={1} min={1} />
                </FormField>
              </div>
            )}
          </FormSection>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={pending}>
              เพิ่ม
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
