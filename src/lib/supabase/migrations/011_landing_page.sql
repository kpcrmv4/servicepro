-- ============================================================
-- 011_landing_page.sql
-- Premium-only Landing Page Builder. Each tenant has at most one
-- landing page; the page renders at /shop/<slug> publicly. Sections
-- are JSON blobs keyed by type so we can add new section types
-- without altering the schema.
-- ============================================================

CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
  is_published BOOLEAN NOT NULL DEFAULT false,
  -- Visual theme
  primary_color TEXT NOT NULL DEFAULT '#1e40af',
  hero_image_url TEXT,
  logo_url TEXT,
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  -- Section list — array of { id, type, data, order }.
  -- Supported section types:
  --   'hero'      { headline, subheadline, cta_label, cta_link, image_url }
  --   'about'     { title, body, image_url }
  --   'services'  { title, items: [{name, description, price_label}] }
  --   'gallery'   { title, images: [{url, caption}] }
  --   'reviews'   { title, items: [{author, rating, text}] }
  --   'contact'   { phone, email, address, map_url, hours }
  --   'faq'       { items: [{question, answer}] }
  --   'cta'       { headline, button_label, button_link }
  sections JSONB NOT NULL DEFAULT '[]',
  -- Public booking widget integration
  show_booking_widget BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_tenant_id ON landing_pages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_published ON landing_pages(is_published) WHERE is_published = true;

ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landing_tenant ON landing_pages;
CREATE POLICY landing_tenant ON landing_pages
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  );

DROP POLICY IF EXISTS landing_public_read ON landing_pages;
CREATE POLICY landing_public_read ON landing_pages
  FOR SELECT USING (is_published = true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    EXECUTE 'CREATE TRIGGER set_updated_at BEFORE UPDATE ON landing_pages
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
