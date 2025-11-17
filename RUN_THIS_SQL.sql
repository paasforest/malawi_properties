-- Enhance Data Collection - Add buyer details and device tracking
-- Copy and paste this ENTIRE content into Supabase SQL Editor and click "Run"

-- Add buyer details columns to inquiries table
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS buyer_name text,
ADD COLUMN IF NOT EXISTS buyer_country text,
ADD COLUMN IF NOT EXISTS buyer_city text;

-- Add device type to property_views table
ALTER TABLE property_views 
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS viewer_country text,
ADD COLUMN IF NOT EXISTS viewer_city text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer_country ON inquiries(buyer_country);
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer_city ON inquiries(buyer_city);
CREATE INDEX IF NOT EXISTS idx_property_views_viewer_country ON property_views(viewer_country);
CREATE INDEX IF NOT EXISTS idx_property_views_device_type ON property_views(device_type);

-- Update buyer_location to keep it for backward compatibility but encourage use of country/city
COMMENT ON COLUMN inquiries.buyer_location IS 'Legacy field. Use buyer_country and buyer_city instead.';
COMMENT ON COLUMN property_views.viewer_location IS 'Legacy field. Use viewer_country and viewer_city instead.';




