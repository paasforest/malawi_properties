'use client';

import { useEffect } from 'react';
import { trackVisit } from '../lib/visitTracking';

/**
 * Visit Tracker Component
 * Tracks all page visits, especially from Facebook and other sources
 * This component runs on every page load
 */
export function VisitTracker() {
  useEffect(() => {
    // Track visit on component mount (page load)
    trackVisit();
  }, []);

  // This component doesn't render anything
  return null;
}

