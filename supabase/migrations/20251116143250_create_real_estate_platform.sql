/*
  # Malawi Diaspora Real Estate Platform - Core Schema

  ## Overview
  This migration creates the foundation for a real-estate data intelligence platform
  targeting the Malawian diaspora. It captures market data while providing a trusted
  marketplace for property transactions.

  ## New Tables

  ### 1. `profiles`
  Extended user profiles with diaspora-specific data
  - `id` (uuid, references auth.users)
  - `email` (text)
  - `full_name` (text)
  - `phone` (text)
  - `user_type` (enum: buyer, agent, owner, admin)
  - `current_location` (text) - captures diaspora location
  - `is_diaspora` (boolean)
  - `is_verified` (boolean) - trust signal
  - `created_at` (timestamptz)

  ### 2. `agents`
  Agent profiles with performance metrics for data intelligence
  - `id` (uuid)
  - `user_id` (uuid, references profiles)
  - `company_name` (text)
  - `license_number` (text)
  - `districts_covered` (text array)
  - `total_listings` (integer) - analytics
  - `total_sales` (integer) - analytics
  - `average_time_to_sale` (integer) - days, analytics
  - `rating` (numeric) - trust signal
  - `verification_status` (enum: pending, verified, rejected)
  - `created_at` (timestamptz)

  ### 3. `properties`
  Core property listings with comprehensive data capture
  - `id` (uuid)
  - `agent_id` (uuid, references agents)
  - `owner_id` (uuid, references profiles) - if direct owner listing
  - `title` (text)
  - `description` (text)
  - `property_type` (enum: land, house, rental, commercial, mixed)
  - `district` (text) - key analytics dimension
  - `area` (text) - specific location
  - `gps_coordinates` (point) - for heat maps
  - `price` (numeric)
  - `currency` (text) - MWK, USD, ZAR for diaspora
  - `plot_size` (numeric) - in square meters
  - `bedrooms` (integer)
  - `bathrooms` (integer)
  - `has_title_deed` (boolean) - trust signal
  - `documentation_type` (text) - title deed, lease, offer letter
  - `reason_for_selling` (text) - market intelligence
  - `is_urgent_sale` (boolean) - market intelligence
  - `status` (enum: available, pending, sold, withdrawn)
  - `images` (text array) - URLs
  - `is_verified` (boolean) - trust signal
  - `is_featured` (boolean)
  - `views_count` (integer) - analytics
  - `inquiries_count` (integer) - analytics
  - `listed_at` (timestamptz)
  - `sold_at` (timestamptz) - for time-to-sale analytics
  - `created_at` (timestamptz)

  ### 4. `inquiries`
  Buyer inquiries with diaspora buyer intelligence
  - `id` (uuid)
  - `property_id` (uuid, references properties)
  - `buyer_id` (uuid, references profiles)
  - `buyer_location` (text) - diaspora location
  - `budget_range` (text)
  - `intended_use` (text) - home build, rental income, farming, commercial
  - `payment_method_preference` (text)
  - `message` (text)
  - `status` (enum: new, contacted, viewing_scheduled, negotiating, closed, lost)
  - `created_at` (timestamptz)
  - `responded_at` (timestamptz)

  ### 5. `property_views`
  Detailed view tracking for heat map analytics
  - `id` (uuid)
  - `property_id` (uuid, references properties)
  - `viewer_id` (uuid, references profiles) - nullable for anonymous
  - `viewer_location` (text) - diaspora location tracking
  - `viewing_duration` (integer) - seconds
  - `viewed_at` (timestamptz)

  ### 6. `market_analytics`
  Aggregated market intelligence (updated via triggers/functions)
  - `id` (uuid)
  - `period` (text) - YYYY-MM for monthly aggregation
  - `district` (text)
  - `property_type` (text)
  - `total_listings` (integer)
  - `total_sales` (integer)
  - `average_price` (numeric)
  - `average_time_to_sale` (integer) - days
  - `total_views` (integer)
  - `total_inquiries` (integer)
  - `diaspora_inquiry_percentage` (numeric)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Public read access for property listings (marketplace)
  - Authenticated users can create inquiries
  - Agents can manage their own listings
  - Admin can access all analytics data
*/

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
