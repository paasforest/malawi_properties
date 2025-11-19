import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Use placeholder values during build if env vars are missing (build will succeed)
// Runtime will fail gracefully if not set, but build won't fail
// Ensure URL has https:// protocol and no trailing slash
const cleanUrl = supabaseUrl 
  ? supabaseUrl.replace(/\/$/, '').replace(/^(https?:\/\/)?/, 'https://')
  : 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

// Only validate in browser runtime, not during build
if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables:', {
      url: supabaseUrl ? '✓' : '✗',
      key: supabaseAnonKey ? '✓' : '✗',
      urlValue: supabaseUrl || 'MISSING',
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING'
    });
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables and redeploy.');
  } else if (supabaseAnonKey === 'placeholder-key' || supabaseAnonKey.length < 50) {
    console.error('❌ Invalid Supabase anon key:', {
      keyLength: supabaseAnonKey.length,
      keyPreview: supabaseAnonKey.substring(0, 30) + '...',
      message: 'Anon key appears to be a placeholder or too short. Please check Vercel environment variables.'
    });
  }
}

export const supabase = createClient(cleanUrl, safeKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type UserType = 'buyer' | 'agent' | 'owner' | 'admin';
export type PropertyType = 'land' | 'house' | 'rental' | 'commercial' | 'mixed';
export type PropertyStatus = 'available' | 'pending' | 'sold' | 'withdrawn';
export type InquiryStatus = 'new' | 'contacted' | 'viewing_scheduled' | 'negotiating' | 'closed' | 'lost';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_type: UserType;
  current_location: string | null;
  is_diaspora: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  company_name: string | null;
  license_number: string | null;
  districts_covered: string[];
  total_listings: number;
  total_sales: number;
  average_time_to_sale: number;
  rating: number;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface Property {
  id: string;
  agent_id: string | null;
  owner_id: string | null;
  title: string;
  description: string | null;
  property_type: PropertyType;
  district: string;
  area: string | null;
  gps_coordinates: string | null;
  price: number;
  currency: string;
  plot_size: number | null;
  bedrooms: number;
  bathrooms: number;
  has_title_deed: boolean;
  documentation_type: string | null;
  reason_for_selling: string | null;
  is_urgent_sale: boolean;
  status: PropertyStatus;
  images: string[];
  is_verified: boolean;
  is_featured: boolean;
  views_count: number;
  inquiries_count: number;
  listed_at: string;
  sold_at: string | null;
  sale_price: number | null;
  buyer_type: 'local' | 'diaspora' | null;
  created_at: string;
}

export interface Inquiry {
  id: string;
  property_id: string;
  buyer_id: string;
  buyer_name: string | null;
  buyer_country: string | null;
  buyer_city: string | null;
  buyer_location: string | null; // Legacy field
  buyer_origin_type: 'diaspora' | 'local' | null; // New: diaspora or local
  local_origin_city: string | null; // New: If local, which city in Malawi
  budget_range: string | null;
  intended_use: string | null;
  payment_method_preference: string | null;
  message: string | null;
  status: InquiryStatus;
  created_at: string;
  responded_at: string | null;
}

export interface SearchQuery {
  id: string;
  user_id: string | null;
  session_id: string | null;
  search_text: string | null;
  search_params: {
    district?: string;
    property_type?: string;
    min_price?: string;
    max_price?: string;
    currency?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  results_count: number;
  viewed_property_ids: string[];
  inquired_property_ids: string[];
  converted_to_inquiry: boolean;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string | null;
  session_start: string;
  session_end: string | null;
  duration_seconds: number;
  properties_viewed_count: number;
  properties_viewed_ids: string[];
  properties_inquired_count: number;
  properties_inquired_ids: string[];
  search_queries_count: number;
  conversion_funnel: {
    searches?: number;
    views?: number;
    detail_views?: number;
    inquiries?: number;
  };
  viewer_location: string | null;
  viewer_country: string | null;
  viewer_city: string | null;
  viewer_origin_type: 'diaspora' | 'local' | null;
  device_type: 'mobile' | 'desktop' | null;
  user_agent: string | null;
  referrer: string | null;
  created_at: string;
}

export interface PriceHistory {
  id: string;
  property_id: string;
  price: number;
  currency: string;
  previous_price: number | null;
  price_change: number | null;
  price_change_percentage: number | null;
  recorded_at: string;
  recorded_by: string | null;
  change_reason: string | null;
  created_at: string;
}
