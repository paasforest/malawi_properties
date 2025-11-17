-- Malawi Diaspora Real Estate Platform - Core Schema
-- Copy and paste this entire file into Supabase SQL Editor and click "Run"

-- Create enums
CREATE TYPE user_type AS ENUM ('buyer', 'agent', 'owner', 'admin');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE property_type AS ENUM ('land', 'house', 'rental', 'commercial', 'mixed');
CREATE TYPE property_status AS ENUM ('available', 'pending', 'sold', 'withdrawn');
CREATE TYPE inquiry_status AS ENUM ('new', 'contacted', 'viewing_scheduled', 'negotiating', 'closed', 'lost');

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  user_type user_type DEFAULT 'buyer',
  current_location text,
  is_diaspora boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  company_name text,
  license_number text,
  districts_covered text[] DEFAULT '{}',
  total_listings integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  average_time_to_sale integer DEFAULT 0,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  verification_status verification_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents are viewable by everyone"
  ON agents FOR SELECT
  USING (true);

CREATE POLICY "Users can create agent profile"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Agents can update own profile"
  ON agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  property_type property_type NOT NULL,
  district text NOT NULL,
  area text,
  gps_coordinates point,
  price numeric NOT NULL CHECK (price >= 0),
  currency text DEFAULT 'MWK',
  plot_size numeric,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  has_title_deed boolean DEFAULT false,
  documentation_type text,
  reason_for_selling text,
  is_urgent_sale boolean DEFAULT false,
  status property_status DEFAULT 'available',
  images text[] DEFAULT '{}',
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  inquiries_count integer DEFAULT 0,
  listed_at timestamptz DEFAULT now(),
  sold_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties are viewable by everyone"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Agents can create properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    )
    OR auth.uid() = owner_id
  );

CREATE POLICY "Agents can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    )
    OR auth.uid() = owner_id
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    )
    OR auth.uid() = owner_id
  );

CREATE POLICY "Agents can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_id
      AND agents.user_id = auth.uid()
    )
    OR auth.uid() = owner_id
  );

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_location text,
  budget_range text,
  intended_use text,
  payment_method_preference text,
  message text,
  status inquiry_status DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can view own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = buyer_id);

CREATE POLICY "Agents can view inquiries for their properties"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN agents a ON p.agent_id = a.id
      WHERE p.id = property_id
      AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Agents can update inquiry status"
  ON inquiries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN agents a ON p.agent_id = a.id
      WHERE p.id = property_id
      AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
      AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN agents a ON p.agent_id = a.id
      WHERE p.id = property_id
      AND a.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id
      AND p.owner_id = auth.uid()
    )
  );

-- Property views table (for analytics)
CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewer_location text,
  viewing_duration integer DEFAULT 0,
  viewed_at timestamptz DEFAULT now()
);

ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create property views"
  ON property_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agents can view analytics for their properties"
  ON property_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      JOIN agents a ON p.agent_id = a.id
      WHERE p.id = property_id
      AND a.user_id = auth.uid()
    )
  );

-- Market analytics table
CREATE TABLE IF NOT EXISTS market_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period text NOT NULL,
  district text,
  property_type text,
  total_listings integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  average_price numeric DEFAULT 0,
  average_time_to_sale integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_inquiries integer DEFAULT 0,
  diaspora_inquiry_percentage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(period, district, property_type)
);

ALTER TABLE market_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Market analytics viewable by authenticated users"
  ON market_analytics FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_district ON properties(district);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer ON inquiries(buyer_id);
CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_market_analytics_period ON market_analytics(period);

-- Admin policies (add after creating admin user)
-- Run this separately after creating admin user in Supabase

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all property views"
  ON property_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all agents"
  ON agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update agent verification"
  ON agents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all market analytics"
  ON market_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin'
    )
  );



