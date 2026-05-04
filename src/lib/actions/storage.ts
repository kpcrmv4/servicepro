"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getUserInfo } from "@/lib/actions/auth-helpers"

// =============================================================================
// Types
// =============================================================================

export type NodeType =
  | "shelf"
  | "cabinet"
  | "rack"
  | "level"
  | "bin"
  | "drawer"
  | "hook"
  | "pallet"
  | "compartment"
  | "custom"

export interface NodePosition {
  // Top-level (in room)
  x?: number
  y?: number
  z?: number
  rotation_deg?: number
  width_cm?: number
  depth_cm?: number
  height_cm?: number
  // Grid child
  row?: number
  col?: number
  layer?: number
  // Free child
  x_pct?: number
  y_pct?: number
  w_pct?: number
  h_pct?: number
}

export interface ChildLayout {
  mode: "grid" | "free"
  rows?: number
  cols?: number
  layers?: number
}

export interface StorageBuilding {
  id: string
  tenant_id: string
  name: string
  notes: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface StorageRoom {
  id: string
  tenant_id: string
  building_id: string | null
  name: string
  floor_number: number | null
  width_cm: number
  depth_cm: number
  height_cm: number
  entry: { side: string; facing: string }
  notes: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export interface StorageNode {
  id: string
  tenant_id: string
  room_id: string
  parent_id: string | null
  code: string
  label: string
  type: NodeType
  position: NodePosition
  child_layout: ChildLayout | null
  path_labels: string[]
  depth: number
  capacity_max: number | null
  weight_max_kg: number | null
  color: string | null
  notes: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface ProductPlacement {
  id: string
  tenant_id: string
  part_id: string
  node_id: string
  quantity: number
  is_primary: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PlacementMovement {
  id: string
  tenant_id: string
  part_id: string
  from_node_id: string | null
  to_node_id: string | null
  quantity: number
  reason: string
  performed_by: string | null
  performed_at: string
  notes: string | null
}

// =============================================================================
// Buildings
// =============================================================================

export async function listBuildings(): Promise<StorageBuilding[]> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from("storage_buildings")
    .select("*")
    .eq("tenant_id", userInfo.tenant_id)
    .order("display_order")
    .order("name")

  return (data ?? []) as StorageBuilding[]
}

export async function createBuilding(input: {
  name: string
  notes?: string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { data, error } = await supabase
    .from("storage_buildings")
    .insert({
      tenant_id: userInfo.tenant_id,
      name: input.name,
      notes: input.notes,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return { id: data.id }
}

export async function updateBuilding(
  id: string,
  input: { name?: string; notes?: string; display_order?: number },
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("storage_buildings")
    .update(input)
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

export async function deleteBuilding(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("storage_buildings")
    .delete()
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

// =============================================================================
// Rooms
// =============================================================================

export async function listRooms(): Promise<StorageRoom[]> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from("storage_rooms")
    .select("*")
    .eq("tenant_id", userInfo.tenant_id)
    .order("display_order")
    .order("name")

  return (data ?? []) as StorageRoom[]
}

export async function getRoom(id: string): Promise<StorageRoom | null> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from("storage_rooms")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)
    .single()

  return (data as StorageRoom) ?? null
}

export async function createRoom(input: {
  building_id?: string | null
  name: string
  floor_number?: number
  width_cm?: number
  depth_cm?: number
  height_cm?: number
  notes?: string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { data, error } = await supabase
    .from("storage_rooms")
    .insert({
      tenant_id: userInfo.tenant_id,
      building_id: input.building_id ?? null,
      name: input.name,
      floor_number: input.floor_number,
      width_cm: input.width_cm ?? 600,
      depth_cm: input.depth_cm ?? 400,
      height_cm: input.height_cm ?? 280,
      notes: input.notes,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return { id: data.id }
}

export async function updateRoom(
  id: string,
  input: Partial<{
    building_id: string | null
    name: string
    floor_number: number
    width_cm: number
    depth_cm: number
    height_cm: number
    notes: string
    display_order: number
  }>,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("storage_rooms")
    .update(input)
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

export async function deleteRoom(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("storage_rooms")
    .delete()
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

// =============================================================================
// Nodes (recursive tree)
// =============================================================================

export async function listNodesForRoom(roomId: string): Promise<StorageNode[]> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from("storage_nodes")
    .select("*")
    .eq("tenant_id", userInfo.tenant_id)
    .eq("room_id", roomId)
    .eq("is_active", true)
    .order("depth")
    .order("display_order")
    .order("label")

  return (data ?? []) as StorageNode[]
}

export async function getNode(id: string): Promise<StorageNode | null> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return null

  const { data } = await supabase
    .from("storage_nodes")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)
    .single()

  return (data as StorageNode) ?? null
}

export async function createNode(input: {
  room_id: string
  parent_id?: string | null
  code: string
  label: string
  type: NodeType
  position: NodePosition
  child_layout?: ChildLayout | null
  capacity_max?: number
  weight_max_kg?: number
  color?: string
  notes?: string
}): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { data, error } = await supabase
    .from("storage_nodes")
    .insert({
      tenant_id: userInfo.tenant_id,
      room_id: input.room_id,
      parent_id: input.parent_id ?? null,
      code: input.code,
      label: input.label,
      type: input.type,
      position: input.position,
      child_layout: input.child_layout ?? null,
      capacity_max: input.capacity_max,
      weight_max_kg: input.weight_max_kg,
      color: input.color,
      notes: input.notes,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return { id: data.id }
}

export async function updateNode(
  id: string,
  input: Partial<{
    parent_id: string | null
    code: string
    label: string
    type: NodeType
    position: NodePosition
    child_layout: ChildLayout | null
    capacity_max: number | null
    weight_max_kg: number | null
    color: string | null
    notes: string | null
    is_active: boolean
    display_order: number
  }>,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("storage_nodes")
    .update(input)
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

export async function deleteNode(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("storage_nodes")
    .delete()
    .eq("id", id)
    .eq("tenant_id", userInfo.tenant_id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

/**
 * Bulk create children based on parent's child_layout.
 * For grid mode, fills rows × cols × layers with auto-generated codes/labels.
 */
export async function generateChildren(
  parentId: string,
  options?: { codePrefix?: string },
): Promise<{ created: number; error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { created: 0, error: "ไม่พบข้อมูลร้าน" }

  const parent = await getNode(parentId)
  if (!parent) return { created: 0, error: "ไม่พบ node" }
  if (!parent.child_layout || parent.child_layout.mode !== "grid") {
    return { created: 0, error: "Node นี้ไม่ใช่ grid layout" }
  }

  const { rows = 1, cols = 1, layers = 1 } = parent.child_layout
  const prefix = options?.codePrefix ?? parent.code

  const children: Array<{
    tenant_id: string
    room_id: string
    parent_id: string
    code: string
    label: string
    type: NodeType
    position: NodePosition
  }> = []

  for (let layer = 1; layer <= layers; layer++) {
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const rowChar = String.fromCharCode(64 + row) // A, B, C...
        const codeBase = layers > 1 ? `${prefix}-L${layer}-${rowChar}${col}` : `${prefix}-${rowChar}${col}`
        const labelBase = layers > 1 ? `ชั้น ${layer} ${rowChar}${col}` : `${rowChar}${col}`
        children.push({
          tenant_id: userInfo.tenant_id,
          room_id: parent.room_id,
          parent_id: parent.id,
          code: codeBase,
          label: labelBase,
          type: "bin" as NodeType,
          position: { row, col, layer },
        })
      }
    }
  }

  const { error } = await supabase.from("storage_nodes").insert(children)
  if (error) return { created: 0, error: error.message }

  revalidatePath("/dashboard/inventory/storage")
  return { created: children.length }
}

// =============================================================================
// Placements
// =============================================================================

export interface PlacementWithNode extends ProductPlacement {
  node: StorageNode | null
  room: { id: string; name: string } | null
}

export async function listPlacementsForPart(
  partId: string,
): Promise<PlacementWithNode[]> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from("product_placements")
    .select(
      `*, storage_nodes!product_placements_node_id_fkey (
        id, room_id, code, label, path_labels, position
      )`,
    )
    .eq("tenant_id", userInfo.tenant_id)
    .eq("part_id", partId)

  if (!data) return []

  // Resolve room names in a separate query (Postgres FK relationship limit)
  const roomIds = Array.from(
    new Set(
      data
        .map((p) => (p.storage_nodes as { room_id?: string } | null)?.room_id)
        .filter(Boolean) as string[],
    ),
  )
  let rooms: Map<string, string> = new Map()
  if (roomIds.length > 0) {
    const { data: roomData } = await supabase
      .from("storage_rooms")
      .select("id, name")
      .in("id", roomIds)
    rooms = new Map((roomData ?? []).map((r) => [r.id, r.name]))
  }

  return data.map((p) => {
    const node = p.storage_nodes as StorageNode | null
    return {
      ...p,
      node,
      room:
        node && rooms.has(node.room_id)
          ? { id: node.room_id, name: rooms.get(node.room_id)! }
          : null,
    } as PlacementWithNode
  })
}

export async function listPlacementsForNode(
  nodeId: string,
): Promise<Array<ProductPlacement & { part: { id: string; name: string; part_number: string } | null }>> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  const { data } = await supabase
    .from("product_placements")
    .select(`*, parts (id, name, part_number)`)
    .eq("tenant_id", userInfo.tenant_id)
    .eq("node_id", nodeId)

  return (data ?? []).map((p) => ({
    ...p,
    part: p.parts as { id: string; name: string; part_number: string } | null,
  }))
}

export async function setPlacement(input: {
  part_id: string
  node_id: string
  quantity: number
  is_primary?: boolean
  notes?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  // Upsert by (part_id, node_id)
  const { error } = await supabase.from("product_placements").upsert(
    {
      tenant_id: userInfo.tenant_id,
      part_id: input.part_id,
      node_id: input.node_id,
      quantity: input.quantity,
      is_primary: input.is_primary ?? false,
      notes: input.notes,
    },
    { onConflict: "part_id,node_id" },
  )

  if (error) return { error: error.message }

  // If this is being set as primary, clear primary on other placements of the same part
  if (input.is_primary) {
    await supabase
      .from("product_placements")
      .update({ is_primary: false })
      .eq("tenant_id", userInfo.tenant_id)
      .eq("part_id", input.part_id)
      .neq("node_id", input.node_id)
  }

  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

export async function deletePlacement(
  partId: string,
  nodeId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  const { error } = await supabase
    .from("product_placements")
    .delete()
    .eq("tenant_id", userInfo.tenant_id)
    .eq("part_id", partId)
    .eq("node_id", nodeId)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory")
  revalidatePath("/dashboard/inventory/storage")
  return {}
}

// =============================================================================
// Search
// =============================================================================

export interface PartSearchResult {
  id: string
  name: string
  part_number: string
  brand: string | null
  total_quantity: number
  placements: Array<{
    node_id: string
    room_id: string
    room_name: string
    path: string[]      // breadcrumb labels
    quantity: number
    is_primary: boolean
  }>
}

export async function searchPartsWithLocations(
  query: string,
): Promise<PartSearchResult[]> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id || !query.trim()) return []

  const q = query.trim()

  // Find matching parts (limit to 20 for dropdown)
  const { data: parts } = await supabase
    .from("parts")
    .select("id, name, part_number, brand")
    .eq("tenant_id", userInfo.tenant_id)
    .or(
      `name.ilike.%${q}%,part_number.ilike.%${q}%,brand.ilike.%${q}%,barcode.ilike.%${q}%`,
    )
    .limit(20)

  if (!parts || parts.length === 0) return []

  const partIds = parts.map((p) => p.id)

  // Fetch placements for these parts
  const { data: placements } = await supabase
    .from("product_placements")
    .select(
      `quantity, is_primary, node_id,
       storage_nodes!product_placements_node_id_fkey (
         id, room_id, path_labels
       )`,
    )
    .eq("tenant_id", userInfo.tenant_id)
    .in("part_id", partIds)
    .order("is_primary", { ascending: false })

  // Map placements back to parts. Resolve room names in a single batch.
  const roomIds = Array.from(
    new Set(
      (placements ?? [])
        .map((p) => (p.storage_nodes as { room_id?: string } | null)?.room_id)
        .filter(Boolean) as string[],
    ),
  )
  let roomMap = new Map<string, string>()
  if (roomIds.length > 0) {
    const { data: roomsData } = await supabase
      .from("storage_rooms")
      .select("id, name")
      .in("id", roomIds)
    roomMap = new Map((roomsData ?? []).map((r) => [r.id, r.name]))
  }

  // Bucket placements by part_id (need to query placements again with part_id)
  // The previous query lost part_id — re-query directly
  const { data: placementsWithPart } = await supabase
    .from("product_placements")
    .select(
      `part_id, quantity, is_primary, node_id,
       storage_nodes!product_placements_node_id_fkey (
         id, room_id, path_labels
       )`,
    )
    .eq("tenant_id", userInfo.tenant_id)
    .in("part_id", partIds)
    .order("is_primary", { ascending: false })

  const placementsByPart = new Map<string, PartSearchResult["placements"]>()
  for (const p of placementsWithPart ?? []) {
    const node = p.storage_nodes as unknown as
      | { id: string; room_id: string; path_labels: string[] }
      | null
    if (!node) continue
    const list = placementsByPart.get(p.part_id) ?? []
    list.push({
      node_id: node.id,
      room_id: node.room_id,
      room_name: roomMap.get(node.room_id) ?? "—",
      path: node.path_labels ?? [],
      quantity: p.quantity,
      is_primary: p.is_primary,
    })
    placementsByPart.set(p.part_id, list)
  }

  return parts.map((p) => {
    const list = placementsByPart.get(p.id) ?? []
    const total = list.reduce((s, x) => s + x.quantity, 0)
    return {
      id: p.id,
      name: p.name,
      part_number: p.part_number,
      brand: p.brand,
      total_quantity: total,
      placements: list,
    }
  })
}

// =============================================================================
// Movements (audit)
// =============================================================================

export interface MovementWithJoins extends PlacementMovement {
  part: { id: string; name: string; part_number: string } | null
  from_node: Pick<StorageNode, "id" | "label" | "path_labels"> | null
  to_node: Pick<StorageNode, "id" | "label" | "path_labels"> | null
  performed_by_user: { id: string; full_name: string } | null
}

export async function listMovements(filters?: {
  partId?: string
  nodeId?: string
  reason?: string
  limit?: number
}): Promise<MovementWithJoins[]> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return []

  let q = supabase
    .from("placement_movements")
    .select(
      `*,
       parts (id, name, part_number),
       from_node:storage_nodes!placement_movements_from_node_id_fkey (id, label, path_labels),
       to_node:storage_nodes!placement_movements_to_node_id_fkey (id, label, path_labels),
       performed_by_user:users!placement_movements_performed_by_fkey (id, full_name)`,
    )
    .eq("tenant_id", userInfo.tenant_id)
    .order("performed_at", { ascending: false })
    .limit(filters?.limit ?? 100)

  if (filters?.partId) q = q.eq("part_id", filters.partId)
  if (filters?.reason) q = q.eq("reason", filters.reason)

  const { data } = await q

  return (data ?? []).map((row) => ({
    ...row,
    part: row.parts as { id: string; name: string; part_number: string } | null,
    from_node: row.from_node as Pick<StorageNode, "id" | "label" | "path_labels"> | null,
    to_node: row.to_node as Pick<StorageNode, "id" | "label" | "path_labels"> | null,
    performed_by_user: row.performed_by_user as { id: string; full_name: string } | null,
  }))
}

export async function recordMovement(input: {
  part_id: string
  from_node_id: string | null
  to_node_id: string | null
  quantity: number
  reason: string
  notes?: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const userInfo = await getUserInfo()
  if (!userInfo?.tenant_id) return { error: "ไม่พบข้อมูลร้าน" }

  // For a transfer, decrement from + increment to (the trigger logs each side)
  if (input.from_node_id && input.to_node_id) {
    const { data: fromPlacement } = await supabase
      .from("product_placements")
      .select("quantity")
      .eq("tenant_id", userInfo.tenant_id)
      .eq("part_id", input.part_id)
      .eq("node_id", input.from_node_id)
      .single()

    const fromQty = fromPlacement?.quantity ?? 0
    if (fromQty < input.quantity) {
      return { error: "จำนวนต้นทางไม่พอ" }
    }

    // Decrement from
    await supabase
      .from("product_placements")
      .update({ quantity: fromQty - input.quantity })
      .eq("tenant_id", userInfo.tenant_id)
      .eq("part_id", input.part_id)
      .eq("node_id", input.from_node_id)

    // Upsert to
    const { data: toPlacement } = await supabase
      .from("product_placements")
      .select("quantity")
      .eq("tenant_id", userInfo.tenant_id)
      .eq("part_id", input.part_id)
      .eq("node_id", input.to_node_id)
      .maybeSingle()

    await supabase.from("product_placements").upsert(
      {
        tenant_id: userInfo.tenant_id,
        part_id: input.part_id,
        node_id: input.to_node_id,
        quantity: (toPlacement?.quantity ?? 0) + input.quantity,
      },
      { onConflict: "part_id,node_id" },
    )

    // Override the auto-logged movement reason to be more specific
    await supabase
      .from("placement_movements")
      .update({ reason: input.reason, notes: input.notes })
      .eq("tenant_id", userInfo.tenant_id)
      .eq("part_id", input.part_id)
      .order("performed_at", { ascending: false })
      .limit(2)

    revalidatePath("/dashboard/inventory/storage")
    return {}
  }

  // Pure adjust (no transfer)
  const { error } = await supabase.from("placement_movements").insert({
    tenant_id: userInfo.tenant_id,
    part_id: input.part_id,
    from_node_id: input.from_node_id,
    to_node_id: input.to_node_id,
    quantity: input.quantity,
    reason: input.reason,
    notes: input.notes,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard/inventory/storage")
  return {}
}
