-- Add sales tracking fields to properties table
-- This enables Facebook Marketplace-style "Mark as Sold" with sales analytics

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS sale_price numeric CHECK (sale_price >= 0),
ADD COLUMN IF NOT EXISTS buyer_type text CHECK (buyer_type IN ('local', 'diaspora'));

COMMENT ON COLUMN properties.sale_price IS 'Final sale price (may differ from listing price)';
COMMENT ON COLUMN properties.buyer_type IS 'Type of buyer: local or diaspora';

-- Index for sales analytics queries
CREATE INDEX IF NOT EXISTS idx_properties_sold_at ON properties(sold_at) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_properties_buyer_type ON properties(buyer_type) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_properties_district_sold ON properties(district, status) WHERE status = 'sold';

