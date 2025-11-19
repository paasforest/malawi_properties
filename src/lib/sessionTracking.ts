/**
 * Session Tracking Utility
 * Tracks user sessions for buyer journey intelligence
 */

import { supabase } from './supabase';

let currentSessionId: string | null = null;
let sessionStartTime: Date | null = null;

/**
 * Get or create a user session
 */
export async function getOrCreateSession(): Promise<string | null> {
  // Return existing session if less than 30 minutes old
  if (currentSessionId && sessionStartTime) {
    const sessionAge = Date.now() - sessionStartTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (sessionAge < thirtyMinutes) {
      return currentSessionId;
    }
    
    // End old session
    if (currentSessionId) {
      await endSession(currentSessionId);
    }
  }

  try {
    // Get user info
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get viewer location
    const viewerLocation = await getViewerLocation();
    
    // Detect device type
    const deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    
    // Get referrer
    const referrer = document.referrer || null;

    // Create new session
    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user?.id || null,
        session_start: new Date().toISOString(),
        viewer_location: viewerLocation.location,
        viewer_country: viewerLocation.country,
        viewer_city: viewerLocation.city,
        viewer_origin_type: viewerLocation.originType,
        device_type: deviceType,
        referrer: referrer,
        user_agent: navigator.userAgent,
        conversion_funnel: {
          searches: 0,
          views: 0,
          detail_views: 0,
          inquiries: 0,
        },
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    currentSessionId = data.id;
    sessionStartTime = new Date();
    
    return currentSessionId;
  } catch (error) {
    console.error('Error in getOrCreateSession:', error);
    return null;
  }
}

/**
 * End a user session
 */
export async function endSession(sessionId: string): Promise<void> {
  try {
    await supabase.rpc('end_user_session', { session_uuid: sessionId });
    currentSessionId = null;
    sessionStartTime = null;
  } catch (error) {
    console.error('Error ending session:', error);
  }
}

/**
 * Get viewer location information
 */
async function getViewerLocation(): Promise<{
  location: string;
  country: string;
  city: string;
  originType: 'diaspora' | 'local' | null;
  localCity: string | null;
}> {
  try {
    // Try to get from user profile first
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_location, is_diaspora')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.current_location) {
        const locationParts = profile.current_location.split(', ');
        return {
          location: profile.current_location,
          country: locationParts[locationParts.length - 1] || 'Unknown',
          city: locationParts[0] || 'Unknown',
          originType: profile.is_diaspora ? 'diaspora' : 'local',
          localCity: null, // Could be extracted from location if needed
        };
      }
    }

    // Fallback: Use geolocation API or default
    // For now, return default (can be enhanced with geolocation API)
    return {
      location: 'Unknown',
      country: 'Unknown',
      city: 'Unknown',
      originType: null,
      localCity: null,
    };
  } catch (error) {
    console.error('Error getting viewer location:', error);
    return {
      location: 'Unknown',
      country: 'Unknown',
      city: 'Unknown',
      originType: null,
      localCity: null,
    };
  }
}

/**
 * Track a search query
 */
export async function trackSearchQuery(
  sessionId: string | null,
  searchText: string,
  searchParams: {
    district?: string;
    propertyType?: string;
    minPrice?: string;
    maxPrice?: string;
    currency?: string;
    bedrooms?: number;
    bathrooms?: number;
  },
  resultsCount: number
): Promise<string | null> {
  if (!sessionId) {
    sessionId = await getOrCreateSession();
    if (!sessionId) return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('search_queries')
      .insert({
        user_id: user?.id || null,
        session_id: sessionId,
        search_text: searchText || null,
        search_params: searchParams,
        results_count: resultsCount,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error tracking search query:', error);
      return null;
    }

    // Update session search count
    await supabase.rpc('update_user_session_search_count', {
      session_uuid: sessionId,
    }).catch(() => {
      // Function might not exist yet, ignore error
    });

    return data.id;
  } catch (error) {
    console.error('Error in trackSearchQuery:', error);
    return null;
  }
}

/**
 * Get current session ID (without creating new one)
 */
export function getCurrentSessionId(): string | null {
  return currentSessionId;
}

// End session when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (currentSessionId) {
      // Use sendBeacon for reliable tracking on page unload
      const endSessionUrl = `${window.location.origin}/api/end-session`;
      navigator.sendBeacon(
        endSessionUrl,
        JSON.stringify({ sessionId: currentSessionId })
      );
    }
  });
}

