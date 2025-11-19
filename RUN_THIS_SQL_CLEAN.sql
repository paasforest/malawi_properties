-- Deep Data Mining Migration
-- Adds comprehensive data intelligence tracking for property market intelligence

-- 1. Search Queries Table - Track all search queries for buyer intent intelligence
CREATE TABLE IF NOT EXISTS search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id uuid, -- Links to user_sessions
  search_text text,
  search_params jsonb NOT NULL DEFAULT '{}', -- {district, property_type, min_price, max_price, currency, bedrooms, bathrooms}
  results_count integer DEFAULT 0,
  viewed_property_ids uuid[] DEFAULT '{}', -- Properties viewed after this search
  inquired_property_ids uuid[] DEFAULT '{}', -- Properties inquired after this search
  converted_to_inquiry boolean DEFAULT false, -- Did search lead to inquiry?
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create search queries"
  ON search_queries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all search queries"
  ON search_queries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- Indexes for search queries
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_session_id ON search_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_search_params ON search_queries USING GIN(search_params);
CREATE INDEX IF NOT EXISTS idx_search_queries_converted ON search_queries(converted_to_inquiry);

-- 2. User Sessions Table - Track user journeys and buyer behavior
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  duration_seconds integer DEFAULT 0,
  properties_viewed_count integer DEFAULT 0,
  properties_viewed_ids uuid[] DEFAULT '{}',
  properties_inquired_count integer DEFAULT 0,
  properties_inquired_ids uuid[] DEFAULT '{}',
  search_queries_count integer DEFAULT 0,
  conversion_funnel jsonb DEFAULT '{}', -- {searches: 0, views: 0, detail_views: 0, inquiries: 0}
  viewer_location text,
  viewer_country text,
  viewer_city text,
  viewer_origin_type text, -- 'diaspora' or 'local'
  device_type text, -- 'mobile' or 'desktop'
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create user sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.user_type = 'admin'
    )
  );

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_start ON user_sessions(session_start);
CREATE INDEX IF NOT EXISTS idx_user_sessions_viewer_location ON user_sessions(viewer_location);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_type ON user_sessions(device_type);

-- 3. Price History Table - Track all price changes for trend analysis
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  currency text NOT NULL,
  previous_price numeric,
  price_change numeric, -- price - previous_price
  price_change_percentage numeric, -- ((price - previous_price) / previous_price) * 100
  recorded_at timestamptz DEFAULT now(),
  recorded_by uuid REFERENCES profiles(id) ON DELETE SET NULL, -- Who changed the price
  change_reason text, -- Why price changed (if available)
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create price history"
  ON price_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can view price history"
  ON price_history FOR SELECT
  USING (true);

-- Indexes for price history
CREATE INDEX IF NOT EXISTS idx_price_history_property_id ON price_history(property_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_price_history_price ON price_history(price);

-- 4. Function to track price changes automatically
CREATE OR REPLACE FUNCTION track_price_change()
RETURNS TRIGGER AS $$
DECLARE
  prev_price numeric;
  prev_currency text;
  price_diff numeric;
  price_percentage numeric;
BEGIN
  -- Get previous price and currency from most recent price history entry
  SELECT price, currency 
  INTO prev_price, prev_currency
  FROM price_history
  WHERE property_id = NEW.id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Only track if price actually changed
  IF (OLD.price IS DISTINCT FROM NEW.price) OR (OLD.currency IS DISTINCT FROM NEW.currency) THEN
    -- Calculate price change
    IF prev_price IS NOT NULL AND prev_currency = NEW.currency THEN
      price_diff := NEW.price - prev_price;
      price_percentage := CASE 
        WHEN prev_price > 0 THEN ((NEW.price - prev_price) / prev_price) * 100
        ELSE NULL
      END;
    ELSE
      price_diff := NULL;
      price_percentage := NULL;
    END IF;

    -- Insert into price history
    INSERT INTO price_history (
      property_id,
      price,
      currency,
      previous_price,
      price_change,
      price_change_percentage,
      recorded_by
    ) VALUES (
      NEW.id,
      NEW.price,
      NEW.currency,
      prev_price,
      price_diff,
      price_percentage,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track price changes
DROP TRIGGER IF EXISTS trigger_track_price_change ON properties;
CREATE TRIGGER trigger_track_price_change
  AFTER UPDATE OF price, currency ON properties
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price OR OLD.currency IS DISTINCT FROM NEW.currency)
  EXECUTE FUNCTION track_price_change();

-- 5. Function to aggregate market analytics monthly
CREATE OR REPLACE FUNCTION aggregate_market_analytics(period_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  period_text text;
  district_rec record;
  type_rec record;
  total_views integer;
  total_inquiries integer;
  diaspora_inquiries integer;
  diaspora_percentage numeric;
BEGIN
  -- Format period as YYYY-MM
  period_text := TO_CHAR(DATE_TRUNC('month', period_date), 'YYYY-MM');

  -- Loop through all district and property type combinations
  FOR district_rec IN 
    SELECT DISTINCT district FROM properties WHERE district IS NOT NULL
  LOOP
    FOR type_rec IN
      SELECT DISTINCT property_type FROM properties WHERE property_type IS NOT NULL
    LOOP
      -- Calculate views for this district/type combination
      SELECT COALESCE(SUM(p.views_count), 0)
      INTO total_views
      FROM properties p
      WHERE p.district = district_rec.district
        AND p.property_type = type_rec.property_type
        AND DATE_TRUNC('month', p.listed_at) = DATE_TRUNC('month', period_date);

      -- Calculate inquiries for this district/type combination
      SELECT COUNT(DISTINCT i.id)
      INTO total_inquiries
      FROM inquiries i
      JOIN properties p ON i.property_id = p.id
      WHERE p.district = district_rec.district
        AND p.property_type = type_rec.property_type
        AND DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', period_date);

      -- Calculate diaspora inquiry percentage
      SELECT COUNT(DISTINCT CASE WHEN pr.is_diaspora THEN i.id END)
      INTO diaspora_inquiries
      FROM inquiries i
      JOIN properties p ON i.property_id = p.id
      JOIN profiles pr ON i.buyer_id = pr.id
      WHERE p.district = district_rec.district
        AND p.property_type = type_rec.property_type
        AND DATE_TRUNC('month', i.created_at) = DATE_TRUNC('month', period_date);

      diaspora_percentage := CASE 
        WHEN total_inquiries > 0 THEN (diaspora_inquiries::numeric / total_inquiries::numeric) * 100
        ELSE 0
      END;

      -- Insert or update market analytics
      INSERT INTO market_analytics (
        period,
        district,
        property_type,
        total_listings,
        total_sales,
        average_price,
        average_time_to_sale,
        total_views,
        total_inquiries,
        diaspora_inquiry_percentage
      ) VALUES (
        period_text,
        district_rec.district,
        type_rec.property_type,
        (SELECT COUNT(DISTINCT p.id) FROM properties p 
         WHERE p.district = district_rec.district 
           AND p.property_type = type_rec.property_type
           AND DATE_TRUNC('month', p.listed_at) = DATE_TRUNC('month', period_date)),
        (SELECT COUNT(DISTINCT p.id) FROM properties p 
         WHERE p.district = district_rec.district 
           AND p.property_type = type_rec.property_type
           AND p.status = 'sold'
           AND DATE_TRUNC('month', p.listed_at) = DATE_TRUNC('month', period_date)),
        (SELECT AVG(p.price) FROM properties p 
         WHERE p.district = district_rec.district 
           AND p.property_type = type_rec.property_type
           AND DATE_TRUNC('month', p.listed_at) = DATE_TRUNC('month', period_date)),
        (SELECT AVG(EXTRACT(EPOCH FROM (p.sold_at - p.listed_at)) / 86400)
         FROM properties p
         WHERE p.district = district_rec.district
           AND p.property_type = type_rec.property_type
           AND p.status = 'sold'
           AND p.sold_at IS NOT NULL
           AND p.listed_at IS NOT NULL
           AND DATE_TRUNC('month', p.listed_at) = DATE_TRUNC('month', period_date)),
        total_views,
        total_inquiries,
        diaspora_percentage
      )
      ON CONFLICT (period, district, property_type) 
      DO UPDATE SET
        total_listings = EXCLUDED.total_listings,
        total_sales = EXCLUDED.total_sales,
        average_price = EXCLUDED.average_price,
        average_time_to_sale = EXCLUDED.average_time_to_sale,
        total_views = EXCLUDED.total_views,
        total_inquiries = EXCLUDED.total_inquiries,
        diaspora_inquiry_percentage = EXCLUDED.diaspora_inquiry_percentage,
        created_at = now();
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enhanced property_views table with more tracking fields
ALTER TABLE property_views 
  ADD COLUMN IF NOT EXISTS viewer_country text,
  ADD COLUMN IF NOT EXISTS viewer_city text,
  ADD COLUMN IF NOT EXISTS viewer_origin_type text, -- 'diaspora' or 'local'
  ADD COLUMN IF NOT EXISTS viewer_local_city text, -- If local, which city in Malawi
  ADD COLUMN IF NOT EXISTS device_type text, -- 'mobile' or 'desktop'
  ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES user_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS user_agent text;

-- Indexes for enhanced property_views
CREATE INDEX IF NOT EXISTS idx_property_views_viewer_country ON property_views(viewer_country);
CREATE INDEX IF NOT EXISTS idx_property_views_session_id ON property_views(session_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_property_views_device_type ON property_views(device_type);

-- 7. Function to update search query when property is viewed/inquired
CREATE OR REPLACE FUNCTION update_search_query_conversion()
RETURNS TRIGGER AS $$
BEGIN
  -- Update search query if property was viewed
  IF TG_TABLE_NAME = 'property_views' THEN
    UPDATE search_queries
    SET viewed_property_ids = array_append(
      COALESCE(viewed_property_ids, ARRAY[]::uuid[]),
      NEW.property_id
    )
    WHERE session_id = NEW.session_id
      AND NOT (NEW.property_id = ANY(COALESCE(viewed_property_ids, ARRAY[]::uuid[])));
  END IF;

  -- Update search query if property was inquired
  IF TG_TABLE_NAME = 'inquiries' THEN
    UPDATE search_queries
    SET inquired_property_ids = array_append(
      COALESCE(inquired_property_ids, ARRAY[]::uuid[]),
      NEW.property_id
    ),
    converted_to_inquiry = true
    WHERE session_id IN (
      SELECT session_id FROM property_views 
      WHERE property_id = NEW.property_id 
      AND viewer_id = NEW.buyer_id
      ORDER BY viewed_at DESC
      LIMIT 1
    )
    AND NOT (NEW.property_id = ANY(COALESCE(inquired_property_ids, ARRAY[]::uuid[])));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update search queries when properties are viewed
DROP TRIGGER IF EXISTS trigger_update_search_on_view ON property_views;
CREATE TRIGGER trigger_update_search_on_view
  AFTER INSERT ON property_views
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_search_query_conversion();

-- Trigger to update search queries when inquiries are created
DROP TRIGGER IF EXISTS trigger_update_search_on_inquiry ON inquiries;
CREATE TRIGGER trigger_update_search_on_inquiry
  AFTER INSERT ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_search_query_conversion();

-- 8. Function to update user session when properties are viewed/inquired
CREATE OR REPLACE FUNCTION update_user_session()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'property_views' AND NEW.session_id IS NOT NULL THEN
    UPDATE user_sessions
    SET 
      properties_viewed_count = (
        SELECT COUNT(DISTINCT property_id) 
        FROM property_views 
        WHERE session_id = NEW.session_id
      ),
      properties_viewed_ids = (
        SELECT ARRAY_AGG(DISTINCT property_id)
        FROM property_views
        WHERE session_id = NEW.session_id
      ),
      conversion_funnel = jsonb_set(
        COALESCE(conversion_funnel, '{}'::jsonb),
        '{views}',
        to_jsonb((
          SELECT COUNT(DISTINCT property_id) 
          FROM property_views 
          WHERE session_id = NEW.session_id
        ))
      )
    WHERE id = NEW.session_id;
  END IF;

  IF TG_TABLE_NAME = 'inquiries' THEN
    -- Find session for this inquiry
    UPDATE user_sessions
    SET 
      properties_inquired_count = (
        SELECT COUNT(DISTINCT property_id) 
        FROM inquiries i
        JOIN property_views pv ON i.property_id = pv.property_id AND i.buyer_id = pv.viewer_id
        WHERE pv.session_id = user_sessions.id
      ),
      properties_inquired_ids = (
        SELECT ARRAY_AGG(DISTINCT property_id)
        FROM inquiries i
        JOIN property_views pv ON i.property_id = pv.property_id AND i.buyer_id = pv.viewer_id
        WHERE pv.session_id = user_sessions.id
      ),
      conversion_funnel = jsonb_set(
        jsonb_set(
          COALESCE(conversion_funnel, '{}'::jsonb),
          '{inquiries}',
          to_jsonb((
            SELECT COUNT(DISTINCT property_id) 
            FROM inquiries i
            JOIN property_views pv ON i.property_id = pv.property_id AND i.buyer_id = pv.viewer_id
            WHERE pv.session_id = user_sessions.id
          ))
        ),
        '{detail_views}',
        to_jsonb((
          SELECT COUNT(DISTINCT property_id) 
          FROM property_views 
          WHERE session_id = user_sessions.id
          AND viewing_duration > 10 -- At least 10 seconds = detail view
        ))
      )
    WHERE id IN (
      SELECT DISTINCT session_id
      FROM property_views
      WHERE property_id = NEW.property_id
      AND viewer_id = NEW.buyer_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update user sessions when properties are viewed
DROP TRIGGER IF EXISTS trigger_update_session_on_view ON property_views;
CREATE TRIGGER trigger_update_session_on_view
  AFTER INSERT ON property_views
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_user_session();

-- Trigger to update user sessions when inquiries are created
DROP TRIGGER IF EXISTS trigger_update_session_on_inquiry ON inquiries;
CREATE TRIGGER trigger_update_session_on_inquiry
  AFTER INSERT ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_session();

-- 9. Function to end user session when it times out (called by client)
CREATE OR REPLACE FUNCTION end_user_session(session_uuid uuid)
RETURNS void AS $$
DECLARE
  start_time timestamptz;
BEGIN
  SELECT session_start INTO start_time
  FROM user_sessions
  WHERE id = session_uuid;

  IF start_time IS NOT NULL THEN
    UPDATE user_sessions
    SET 
      session_end = now(),
      duration_seconds = EXTRACT(EPOCH FROM (now() - start_time))::integer
    WHERE id = session_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION aggregate_market_analytics(date) TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session(uuid) TO authenticated;

