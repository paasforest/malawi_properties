import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    // Ping Supabase to show activity
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    return NextResponse.json({ 
      success: true,
      status: 'ok', 
      timestamp: new Date().toISOString(),
      supabase_active: !error,
      message: 'Supabase keep-alive ping successful'
    });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ 
      success: false,
      status: 'error', 
      error: String(error) 
    }, { status: 500 });
  }
}

