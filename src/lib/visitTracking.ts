/**
 * Visit Tracking Utility
 * Tracks all website visits, especially from Facebook and other sources
 */

import { supabase } from './supabase';

/**
 * Track a website visit
 * Called on every page load to track visitors
 */
export async function trackVisit(): Promise<void> {
  try {
    // Get referrer information
    const referrer = typeof window !== 'undefined' ? document.referrer : null;
    const landingPage = typeof window !== 'undefined' ? window.location.pathname : '/';
    
    // Parse source and medium from referrer
    const { source, medium } = parseTrafficSource(referrer);
    
    // Get user info (if logged in)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get device and browser info
    const deviceInfo = getDeviceInfo();
    
    // Create or update session ID
    const sessionId = getOrCreateSessionId();
    
    // Check if we already tracked this visit (avoid duplicates)
    const lastTracked = sessionStorage.getItem('lastVisitTracked');
    const now = Date.now();
    
    // Only track if it's been more than 5 minutes since last track (new session)
    if (lastTracked && (now - parseInt(lastTracked)) < 5 * 60 * 1000) {
      // Update existing record instead
      await updateTrafficSource(sessionId, landingPage);
      return;
    }
    
    // Insert new traffic source record
    const { error } = await supabase
      .from('traffic_sources')
      .insert({
        session_id: sessionId,
        user_id: user?.id || null,
        source: source,
        medium: medium,
        referrer: referrer,
        landing_page: landingPage,
        device_type: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        country: 'Unknown', // Could be enhanced with geolocation API
        city: 'Unknown',
        first_visit_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        page_views: 1,
        converted: false,
      });
    
    if (error) {
      console.error('Error tracking visit:', error);
      return;
    }
    
    // Store timestamp to avoid duplicate tracking
    sessionStorage.setItem('lastVisitTracked', now.toString());
    sessionStorage.setItem('sessionId', sessionId);
    
  } catch (error) {
    console.error('Error in trackVisit:', error);
  }
}

/**
 * Parse traffic source from referrer URL
 */
function parseTrafficSource(referrer: string | null): { source: string; medium: string } {
  if (!referrer) {
    return { source: 'direct', medium: 'none' };
  }
  
  const url = new URL(referrer);
  const hostname = url.hostname.toLowerCase();
  
  // Facebook detection
  if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('m.facebook.com')) {
    return { source: 'facebook', medium: 'social' };
  }
  
  // Instagram (owned by Facebook)
  if (hostname.includes('instagram.com')) {
    return { source: 'instagram', medium: 'social' };
  }
  
  // Google
  if (hostname.includes('google.com') || hostname.includes('google.co.za') || hostname.includes('google.co.uk')) {
    // Check if it's from search
    if (url.searchParams.has('q') || url.searchParams.has('query')) {
      return { source: 'google', medium: 'organic' };
    }
    return { source: 'google', medium: 'referral' };
  }
  
  // Twitter/X
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return { source: 'twitter', medium: 'social' };
  }
  
  // LinkedIn
  if (hostname.includes('linkedin.com')) {
    return { source: 'linkedin', medium: 'social' };
  }
  
  // WhatsApp
  if (hostname.includes('whatsapp.com') || hostname.includes('wa.me')) {
    return { source: 'whatsapp', medium: 'social' };
  }
  
  // Email
  if (hostname.includes('mail.') || hostname.includes('email') || url.searchParams.has('utm_source=email')) {
    return { source: 'email', medium: 'email' };
  }
  
  // Check for UTM parameters
  const utmSource = url.searchParams.get('utm_source');
  const utmMedium = url.searchParams.get('utm_medium');
  
  if (utmSource) {
    return {
      source: utmSource.toLowerCase(),
      medium: utmMedium?.toLowerCase() || 'referral',
    };
  }
  
  // Default: referral
  return { source: 'referral', medium: 'referral' };
}

/**
 * Get device information
 */
function getDeviceInfo(): { deviceType: string; browser: string; os: string } {
  if (typeof window === 'undefined') {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }
  
  const userAgent = navigator.userAgent;
  
  // Device type
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    deviceType = /iPad/i.test(userAgent) ? 'tablet' : 'mobile';
  }
  
  // Browser
  let browser = 'unknown';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browser = 'chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'safari';
  } else if (userAgent.includes('Edg')) {
    browser = 'edge';
  }
  
  // OS
  let os = 'unknown';
  if (userAgent.includes('Windows')) {
    os = 'windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macos';
  } else if (userAgent.includes('Linux')) {
    os = 'linux';
  } else if (userAgent.includes('Android')) {
    os = 'android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'ios';
  }
  
  return { deviceType, browser, os };
}

/**
 * Get or create session ID
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return `session-${Date.now()}`;
  }
  
  let sessionId = sessionStorage.getItem('sessionId');
  
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  
  return sessionId;
}

/**
 * Update existing traffic source record (for same session)
 */
async function updateTrafficSource(sessionId: string, currentPage: string): Promise<void> {
  try {
    // First get current page_views
    const { data: existing } = await supabase
      .from('traffic_sources')
      .select('page_views')
      .eq('session_id', sessionId)
      .maybeSingle();
    
    if (existing) {
      const { error } = await supabase
        .from('traffic_sources')
        .update({
          last_activity_at: new Date().toISOString(),
          page_views: (existing.page_views || 0) + 1,
        })
        .eq('session_id', sessionId);
      
      if (error) {
        console.error('Error updating traffic source:', error);
      }
    }
  } catch (error) {
    console.error('Error in updateTrafficSource:', error);
  }
}

/**
 * Mark a visit as converted (led to inquiry/signup)
 */
export async function markVisitAsConverted(sessionId: string | null): Promise<void> {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('sessionId') || null;
  }
  
  if (!sessionId) return;
  
  try {
    await supabase
      .from('traffic_sources')
      .update({ converted: true })
      .eq('session_id', sessionId);
  } catch (error) {
    console.error('Error marking visit as converted:', error);
  }
}

