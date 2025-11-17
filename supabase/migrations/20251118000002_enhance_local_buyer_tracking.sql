-- Enhance Local Buyer Tracking
-- Track both diaspora AND local Malawi buyers for complete market intelligence

-- Add local buyer origin tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS buyer_origin_type text CHECK (buyer_origin_type IN ('diaspora', 'local')),
ADD COLUMN IF NOT EXISTS local_origin_city text, -- If local, which city in Malawi (Lilongwe, Blantyre, Mzuzu, etc.)
ADD COLUMN IF NOT EXISTS local_origin_district text; -- If local, which district

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_profiles_buyer_origin_type ON profiles(buyer_origin_type);
CREATE INDEX IF NOT EXISTS idx_profiles_local_origin_city ON profiles(local_origin_city);
CREATE INDEX IF NOT EXISTS idx_profiles_is_diaspora_origin ON profiles(is_diaspora, buyer_origin_type);

-- Update existing profiles: Set buyer_origin_type based on is_diaspora
UPDATE profiles
SET buyer_origin_type = CASE 
  WHEN is_diaspora = true THEN 'diaspora'
  WHEN is_diaspora = false THEN 'local'
  WHEN current_location IS NOT NULL AND current_location != 'Malawi' THEN 'diaspora'
  ELSE 'local'
END
WHERE buyer_origin_type IS NULL;

-- Add local buyer tracking to inquiries
ALTER TABLE inquiries
ADD COLUMN IF NOT EXISTS buyer_origin_type text CHECK (buyer_origin_type IN ('diaspora', 'local')),
ADD COLUMN IF NOT EXISTS local_origin_city text; -- If local buyer, which city in Malawi

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_inquiries_buyer_origin_type ON inquiries(buyer_origin_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_local_origin_city ON inquiries(local_origin_city);

-- Add local buyer tracking to property_views
ALTER TABLE property_views
ADD COLUMN IF NOT EXISTS viewer_origin_type text CHECK (viewer_origin_type IN ('diaspora', 'local')),
ADD COLUMN IF NOT EXISTS viewer_local_city text; -- If local viewer, which city in Malawi

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_property_views_viewer_origin_type ON property_views(viewer_origin_type);
CREATE INDEX IF NOT EXISTS idx_property_views_viewer_local_city ON property_views(viewer_local_city);

-- Function to auto-update buyer_origin_type based on country/city
CREATE OR REPLACE FUNCTION update_buyer_origin_type()
RETURNS TRIGGER AS $$
BEGIN
  -- For profiles
  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.is_diaspora = true THEN
      NEW.buyer_origin_type = 'diaspora';
    ELSIF NEW.is_diaspora = false OR (NEW.current_location IS NOT NULL AND LOWER(NEW.current_location) = 'malawi') THEN
      NEW.buyer_origin_type = 'local';
    ELSIF NEW.current_location IS NOT NULL AND LOWER(NEW.current_location) != 'malawi' THEN
      NEW.buyer_origin_type = 'diaspora';
    END IF;
  END IF;
  
  -- For inquiries
  IF TG_TABLE_NAME = 'inquiries' THEN
    IF NEW.buyer_country IS NOT NULL AND LOWER(NEW.buyer_country) != 'malawi' THEN
      NEW.buyer_origin_type = 'diaspora';
    ELSIF NEW.buyer_country IS NOT NULL AND LOWER(NEW.buyer_country) = 'malawi' THEN
      NEW.buyer_origin_type = 'local';
      NEW.local_origin_city = NEW.buyer_city; -- Store local city
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update buyer_origin_type
CREATE TRIGGER update_profile_buyer_origin_type
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_origin_type();

CREATE TRIGGER update_inquiry_buyer_origin_type
  BEFORE INSERT OR UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_buyer_origin_type();

COMMENT ON COLUMN profiles.buyer_origin_type IS 'diaspora = living outside Malawi, local = living in Malawi';
COMMENT ON COLUMN profiles.local_origin_city IS 'If local buyer, which city in Malawi they are from (Lilongwe, Blantyre, Mzuzu, etc.)';
COMMENT ON COLUMN inquiries.buyer_origin_type IS 'diaspora = living outside Malawi, local = living in Malawi';
COMMENT ON COLUMN inquiries.local_origin_city IS 'If local buyer, which city in Malawi they are from';



