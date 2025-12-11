import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      checks: {},
      issues: [],
      recommendations: [],
    };

    // Check 1: Table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('traffic_sources')
      .select('id')
      .limit(1);
    
    diagnostics.checks.tableExists = !tableError;
    if (tableError) {
      diagnostics.issues.push(`Table check failed: ${tableError.message}`);
    }

    // Check 2: Can insert (test)
    const testSessionId = `diagnostic-${Date.now()}`;
    const { data: insertData, error: insertError } = await supabase
      .from('traffic_sources')
      .insert({
        session_id: testSessionId,
        source: 'diagnostic',
        medium: 'test',
        landing_page: '/diagnostic',
        device_type: 'desktop',
        browser: 'test',
        os: 'test',
        first_visit_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        page_views: 1,
      })
      .select()
      .single();

    diagnostics.checks.canInsert = !insertError;
    if (insertError) {
      diagnostics.issues.push(`Insert failed: ${insertError.message} (Code: ${insertError.code})`);
      diagnostics.recommendations.push('Check RLS policies - anonymous users need INSERT permission');
    } else {
      // Clean up test record
      await supabase
        .from('traffic_sources')
        .delete()
        .eq('session_id', testSessionId);
    }

    // Check 3: Count existing records
    const { count, error: countError } = await supabase
      .from('traffic_sources')
      .select('*', { count: 'exact', head: true });

    diagnostics.checks.recordCount = count || 0;
    if (countError) {
      diagnostics.issues.push(`Count failed: ${countError.message}`);
    }

    // Check 4: Recent records
    const { data: recent, error: recentError } = await supabase
      .from('traffic_sources')
      .select('id, source, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    diagnostics.checks.recentRecords = recent || [];
    if (recentError) {
      diagnostics.issues.push(`Recent records query failed: ${recentError.message}`);
    }

    // Summary
    diagnostics.status = diagnostics.issues.length === 0 ? 'healthy' : 'issues_found';
    diagnostics.summary = {
      tableExists: diagnostics.checks.tableExists,
      canInsert: diagnostics.checks.canInsert,
      totalRecords: diagnostics.checks.recordCount,
      hasRecentRecords: (recent || []).length > 0,
    };

    return NextResponse.json(diagnostics, { 
      status: diagnostics.issues.length === 0 ? 200 : 500 
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Diagnostic failed',
      message: error.message,
    }, { status: 500 });
  }
}

