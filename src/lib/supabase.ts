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
      key: supabaseAnonKey ? '✓' : '✗'
    });
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables and redeploy.');
  } else {
    console.log('✅ Supabase initialized:', {
      url: `${cleanUrl.substring(0, 30)}...`,
      key: `${safeKey.substring(0, 20)}...`
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
