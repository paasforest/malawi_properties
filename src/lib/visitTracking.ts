/**
 * Visit Tracking Utility
 * Tracks all website visits, especially from Facebook and other sources
 */

import { supabase } from './supabase';

/**
 * Track a website visit
 * Called on every page load to track visitors
 * Uses API route for more reliable tracking
 */
export async function trackVisit(): Promise<void> {
  // Only run on client side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Get referrer information
    const referrer = document.referrer || null;
    const landingPage = window.location.pathname || '/';
    
    // Parse source and medium from referrer
    const { source, medium } = parseTrafficSource(referrer);
    
    // Get user info (if logged in)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get device and browser info
    const deviceInfo = getDeviceInfo();
    
    // Create or update session ID
    const sessionId = getOrCreateSessionId();
    
    // Check if we already tracked this visit in this page load (avoid duplicates)
    const trackingKey = `tracking_${sessionId}_${landingPage}`;
    if (sessionStorage.getItem(trackingKey)) {
      // Already tracked this page in this session
      return;
    }
    
    // Use API route for more reliable tracking
    const response = await fetch('/api/track-visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        userId: user?.id || null,
        source,
        medium,
        referrer,
        landingPage,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Error tracking visit:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        sessionId: sessionId.substring(0, 20) + '...',
      });
      return;
    }

    const result = await response.json();
    
    // Mark this page as tracked
    sessionStorage.setItem(trackingKey, 'true');
    
    // Log success (always log for debugging)
    console.log('✅ Visit tracked:', { 
      source, 
      medium, 
      landingPage, 
      sessionId: sessionId.substring(0, 20) + '...',
      success: true 
    });
    
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

