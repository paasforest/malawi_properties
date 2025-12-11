import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Simple ping to keep connection alive
    const { error } = await supabase.from('_keep_alive').select('count').limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (which is fine)
      console.error('Keep-alive error:', error);
    }

    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Keep-alive error:', error);
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}