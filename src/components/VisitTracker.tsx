'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackVisit } from '../lib/visitTracking';

/**
 * Visit Tracker Component
 * Tracks all page visits, especially from Facebook and other sources
 * This component runs on every page load and route change
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Small delay to ensure page is fully loaded
    const timer = setTimeout(() => {
      trackVisit();
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]); // Track on every route change

  // This component doesn't render anything
  return null;
}


