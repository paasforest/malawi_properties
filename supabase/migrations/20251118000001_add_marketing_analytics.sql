-- Marketing Analytics - Traffic Source Tracking
-- Tracks where visitors come from for marketing insights

CREATE TABLE IF NOT EXISTS traffic_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text, -- Unique session identifier
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for anonymous visitors
  source text, -- 'direct', 'google', 'facebook', 'twitter', 'referral', 'email'
  medium text, -- 'organic', 'social', 'email', 'cpc', 'referral'
  campaign text, -- Campaign name if from marketing campaign
  referrer text, -- Full referrer URL
  landing_page text, -- First page visited in session
  device_type text, -- 'desktop', 'mobile', 'tablet'
  browser text,
  os text,
  country text, -- From IP geolocation
  city text,
  first_visit_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  page_views integer DEFAULT 1,
  converted boolean DEFAULT false, -- Did this visit lead to inquiry/signup?
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_traffic_sources_session_id ON traffic_sources(session_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_user_id ON traffic_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_source ON traffic_sources(source, medium);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_created_at ON traffic_sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_converted ON traffic_sources(converted) WHERE converted = true;

-- RLS Policy
ALTER TABLE traffic_sources ENABLE ROW LEVEL SECURITY;

-- Public can insert (for tracking visits)
CREATE POLICY "Anyone can insert traffic data"
  ON traffic_sources FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Only admins can view traffic analytics
CREATE POLICY "Admins can view traffic analytics"
  ON traffic_sources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

COMMENT ON TABLE traffic_sources IS 'Tracks traffic sources and marketing analytics';



