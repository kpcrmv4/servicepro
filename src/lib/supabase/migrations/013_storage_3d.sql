-- =============================================================================
-- 013: 3D Storage System — buildings → rooms → nodes (recursive tree) → placements
-- =============================================================================
-- Multi-tenant 3D virtual shelf system. Each tenant creates buildings, rooms,
-- and arbitrary-depth storage nodes (shelves, levels, bins, drawers, hooks…).
-- One product can be placed in multiple nodes with quantity per location.
-- Movement history is auto-logged via trigger.
-- =============================================================================

-- ─────────────────────────────────────────────
-- 1. Buildings (optional grouping)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage_buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_buildings_tenant
  ON storage_buildings(tenant_id);

-- ─────────────────────────────────────────────
-- 2. Rooms (have real-world dimensions in cm)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  building_id UUID REFERENCES storage_buildings(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  floor_number INT,

  -- Room dimensions (cm) — used for door view perspective
  width_cm INT NOT NULL DEFAULT 600 CHECK (width_cm > 0),
  depth_cm INT NOT NULL DEFAULT 400 CHECK (depth_cm > 0),
  height_cm INT NOT NULL DEFAULT 280 CHECK (height_cm > 0),

  -- Camera = standing at center of front wall, looking in.
  -- Reserved JSONB for future customization (different entry walls).
  entry JSONB DEFAULT '{"side":"front","facing":"in"}',

  notes TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_rooms_tenant
  ON storage_rooms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_rooms_building
  ON storage_rooms(building_id);

-- ─────────────────────────────────────────────
-- 3. Nodes — recursive tree (depth NOT fixed)
--    Top-level nodes (parent_id NULL) sit on the room floor.
--    Children represent levels/bins/drawers within their parent.
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS storage_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES storage_rooms(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES storage_nodes(id) ON DELETE CASCADE,

  code TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'shelf', 'cabinet', 'rack', 'level', 'bin',
    'drawer', 'hook', 'pallet', 'compartment', 'custom'
  )),

  -- Position interpretation depends on context:
  --   top-level (in room): {x, y, z, rotation_deg, width_cm, depth_cm, height_cm}
  --   child of grid parent: {row, col, layer}
  --   child of free-form parent: {x_pct, y_pct, w_pct, h_pct}
  position JSONB NOT NULL DEFAULT '{}',

  -- Layout config for this node's children (NULL = leaf):
  --   {"mode":"grid","rows":4,"cols":6,"layers":1}
  --   {"mode":"free"}
  child_layout JSONB,

  -- Denormalized path (maintained by trigger) — labels of all ancestors
  path_labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  depth INT NOT NULL DEFAULT 0,

  capacity_max INT CHECK (capacity_max IS NULL OR capacity_max > 0),
  weight_max_kg NUMERIC(10, 2) CHECK (weight_max_kg IS NULL OR weight_max_kg > 0),

  color TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (tenant_id, room_id, code)
);

CREATE INDEX IF NOT EXISTS idx_storage_nodes_tenant
  ON storage_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_room
  ON storage_nodes(room_id);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_parent
  ON storage_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_path
  ON storage_nodes USING GIN(path_labels);

-- ─────────────────────────────────────────────
-- 4. Product placements — N:N parts ↔ nodes
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES storage_nodes(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (part_id, node_id)
);

-- Only one primary placement per part
CREATE UNIQUE INDEX IF NOT EXISTS idx_placements_one_primary
  ON product_placements(part_id) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_placements_tenant
  ON product_placements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_placements_part
  ON product_placements(part_id);
CREATE INDEX IF NOT EXISTS idx_placements_node
  ON product_placements(node_id);

-- ─────────────────────────────────────────────
-- 5. Movement audit (every qty change is logged)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS placement_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  from_node_id UUID REFERENCES storage_nodes(id) ON DELETE SET NULL,
  to_node_id UUID REFERENCES storage_nodes(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'adjust',
  -- 'restock' | 'sale' | 'reorganize' | 'audit-correction' | 'transfer' | 'damage' | 'adjust'
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_movements_tenant_time
  ON placement_movements(tenant_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_movements_part
  ON placement_movements(part_id, performed_at DESC);

-- ─────────────────────────────────────────────
-- 6. Triggers — maintain path_labels, depth, audit
-- ─────────────────────────────────────────────

-- Maintain path_labels + depth from parent
CREATE OR REPLACE FUNCTION update_storage_node_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT[];
  parent_depth INT;
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path_labels := ARRAY[NEW.label];
    NEW.depth := 0;
  ELSE
    SELECT path_labels, depth
    INTO parent_path, parent_depth
    FROM storage_nodes
    WHERE id = NEW.parent_id;

    IF parent_path IS NULL THEN
      RAISE EXCEPTION 'Parent node not found';
    END IF;

    NEW.path_labels := array_append(parent_path, NEW.label);
    NEW.depth := parent_depth + 1;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_storage_node_path ON storage_nodes;
CREATE TRIGGER trg_storage_node_path
  BEFORE INSERT OR UPDATE OF parent_id, label ON storage_nodes
  FOR EACH ROW EXECUTE FUNCTION update_storage_node_path();

-- Cascade label change to descendants (if parent renamed, children paths update)
CREATE OR REPLACE FUNCTION cascade_path_to_descendants()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.label != NEW.label OR OLD.parent_id IS DISTINCT FROM NEW.parent_id) THEN
    -- Touch all descendants so their trigger re-runs
    WITH RECURSIVE descendants AS (
      SELECT id FROM storage_nodes WHERE parent_id = NEW.id
      UNION ALL
      SELECT n.id FROM storage_nodes n
      JOIN descendants d ON n.parent_id = d.id
    )
    UPDATE storage_nodes
    SET label = label  -- no-op write to fire trg_storage_node_path
    WHERE id IN (SELECT id FROM descendants);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cascade_path ON storage_nodes;
CREATE TRIGGER trg_cascade_path
  AFTER UPDATE OF label, parent_id ON storage_nodes
  FOR EACH ROW EXECUTE FUNCTION cascade_path_to_descendants();

-- Auto-log placement quantity changes
CREATE OR REPLACE FUNCTION log_placement_movement()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF TG_OP = 'INSERT' AND NEW.quantity > 0 THEN
    INSERT INTO placement_movements (
      tenant_id, part_id, from_node_id, to_node_id, quantity, reason, performed_by
    ) VALUES (
      NEW.tenant_id, NEW.part_id, NULL, NEW.node_id, NEW.quantity,
      'restock', current_user_id
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.quantity != OLD.quantity THEN
    INSERT INTO placement_movements (
      tenant_id, part_id, from_node_id, to_node_id, quantity, reason, performed_by
    ) VALUES (
      NEW.tenant_id,
      NEW.part_id,
      CASE WHEN NEW.quantity < OLD.quantity THEN NEW.node_id ELSE NULL END,
      CASE WHEN NEW.quantity > OLD.quantity THEN NEW.node_id ELSE NULL END,
      ABS(NEW.quantity - OLD.quantity),
      CASE WHEN NEW.quantity > OLD.quantity THEN 'restock' ELSE 'adjust' END,
      current_user_id
    );
  ELSIF TG_OP = 'DELETE' AND OLD.quantity > 0 THEN
    INSERT INTO placement_movements (
      tenant_id, part_id, from_node_id, to_node_id, quantity, reason, performed_by
    ) VALUES (
      OLD.tenant_id, OLD.part_id, OLD.node_id, NULL, OLD.quantity,
      'reorganize', current_user_id
    );
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_placement_audit ON product_placements;
CREATE TRIGGER trg_placement_audit
  AFTER INSERT OR UPDATE OF quantity OR DELETE ON product_placements
  FOR EACH ROW EXECUTE FUNCTION log_placement_movement();

-- updated_at maintenance for non-trigger tables
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_buildings_touch ON storage_buildings;
CREATE TRIGGER trg_buildings_touch
  BEFORE UPDATE ON storage_buildings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_rooms_touch ON storage_rooms;
CREATE TRIGGER trg_rooms_touch
  BEFORE UPDATE ON storage_rooms
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────
-- 7. RLS — tenant isolation
-- ─────────────────────────────────────────────
ALTER TABLE storage_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_movements ENABLE ROW LEVEL SECURITY;

-- Helper to read current user's tenant_id (matches existing pattern)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS storage_buildings_tenant_isolation ON storage_buildings;
CREATE POLICY storage_buildings_tenant_isolation ON storage_buildings
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS storage_rooms_tenant_isolation ON storage_rooms;
CREATE POLICY storage_rooms_tenant_isolation ON storage_rooms
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS storage_nodes_tenant_isolation ON storage_nodes;
CREATE POLICY storage_nodes_tenant_isolation ON storage_nodes
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS product_placements_tenant_isolation ON product_placements;
CREATE POLICY product_placements_tenant_isolation ON product_placements
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

DROP POLICY IF EXISTS placement_movements_tenant_isolation ON placement_movements;
CREATE POLICY placement_movements_tenant_isolation ON placement_movements
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

-- ─────────────────────────────────────────────
-- 8. Helpful views
-- ─────────────────────────────────────────────

-- Total stock per part across all locations
CREATE OR REPLACE VIEW part_stock_total AS
SELECT
  p.tenant_id,
  p.part_id,
  COUNT(*) AS location_count,
  SUM(p.quantity) AS total_quantity,
  ARRAY_AGG(p.node_id) AS node_ids
FROM product_placements p
WHERE p.quantity > 0
GROUP BY p.tenant_id, p.part_id;
