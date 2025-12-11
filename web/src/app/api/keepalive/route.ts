import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    const { data, error } = await supabase.from('properties').select('*').limit(1);
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), supabase_active: !error });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}