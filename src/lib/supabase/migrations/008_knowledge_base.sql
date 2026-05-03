-- ============================================================
-- 008_knowledge_base.sql
-- Per-tenant repair knowledge base — articles by car make/model with
-- specs, tips, and how-to videos. Used by technicians on the dashboard.
-- ============================================================

CREATE TABLE IF NOT EXISTS knowledge_base_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_categories_slug
  ON knowledge_base_categories(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_kb_categories_tenant ON knowledge_base_categories(tenant_id);
ALTER TABLE knowledge_base_categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS knowledge_base_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES knowledge_base_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  car_make TEXT,                          -- e.g. 'Toyota'
  car_model TEXT,                         -- e.g. 'Civic'
  year_from INTEGER,
  year_to INTEGER,
  summary TEXT,
  body MARKDOWN,                          -- handled below if MARKDOWN type doesn't exist
  body_text TEXT NOT NULL,                -- raw markdown content (fallback)
  video_url TEXT,
  attachments JSONB DEFAULT '[]',         -- [{name, url, kind}]
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_kb_articles_slug
  ON knowledge_base_articles(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tenant ON knowledge_base_articles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_kb_articles_make_model ON knowledge_base_articles(tenant_id, car_make, car_model);
CREATE INDEX IF NOT EXISTS idx_kb_articles_search ON knowledge_base_articles
  USING gin(to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body_text, '')));

ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON knowledge_base_articles
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS kb_cat_tenant ON knowledge_base_categories;
CREATE POLICY kb_cat_tenant ON knowledge_base_categories
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS kb_art_tenant ON knowledge_base_articles;
CREATE POLICY kb_art_tenant ON knowledge_base_articles
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

-- NOTE: PostgreSQL doesn't have a native MARKDOWN type. Drop it.
ALTER TABLE knowledge_base_articles DROP COLUMN IF EXISTS body;
