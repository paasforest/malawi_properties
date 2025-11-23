import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client for server-side
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sessionId,
      userId,
      source,
      medium,
      referrer,
      landingPage,
      deviceType,
      browser,
      os,
      userAgent,
    } = body;

    // Validate required fields
    if (!sessionId || !landingPage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if this session already exists
    // Use a service role client or check with proper error handling
    const { data: existing, error: selectError } = await supabase
      .from('traffic_sources')
      .select('id, page_views')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    // If select fails due to RLS, we'll still try to insert (might be first visit)
    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected), other errors are real issues
      return NextResponse.json(
        { error: 'Failed to check existing session', code: selectError.code },
        { status: 500 }
      );
    }

    if (existing) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('traffic_sources')
        .update({
          last_activity_at: new Date().toISOString(),
          page_views: (existing.page_views || 0) + 1,
        })
        .eq('id', existing.id);

      if (updateError) {
        // Log server-side only (not exposed to client)
        return NextResponse.json(
          { error: 'Failed to update traffic source' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, updated: true });
    }

    // Insert new record
    const { data, error } = await supabase
      .from('traffic_sources')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        source: source || 'direct',
        medium: medium || 'none',
        referrer: referrer || null,
        landing_page: landingPage || '/',
        device_type: deviceType || 'unknown',
        browser: browser || 'unknown',
        os: os || 'unknown',
        country: 'Unknown',
        city: 'Unknown',
        first_visit_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        page_views: 1,
        converted: false,
      })
      .select()
      .single();

    if (error) {
      // Log server-side only (not exposed to client)
      return NextResponse.json(
        { error: 'Failed to track visit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    // Log server-side only (not exposed to client)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET for testing
export async function GET() {
  return NextResponse.json({ message: 'Visit tracking API is active' });
}

