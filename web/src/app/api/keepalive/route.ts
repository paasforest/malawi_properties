import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase client inline (no import issues)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Ping Supabase to show activity
    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    return NextResponse.json({ 
      success: true,
      status: 'ok', 
      timestamp: new Date().toISOString(),
      supabase_active: !error 
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

