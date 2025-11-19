import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../src/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // End session using database function
    const { error } = await supabase.rpc('end_user_session', {
      session_uuid: sessionId,
    });

    if (error) {
      console.error('Error ending session:', error);
      return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in end-session API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

