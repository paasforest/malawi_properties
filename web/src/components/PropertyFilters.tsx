import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { trackSearchQuery, getCurrentSessionId } from '../lib/sessionTracking';

interface PropertyFiltersProps {
  filters: {
    search: string;
    propertyType: string;
    district: string;
    minPrice: string;
    maxPrice: string;
    currency: string;
  };
  onChange: (filters: any) => void;
  districts: string[];
  resultsCount?: number;
}

export function PropertyFilters({ filters, onChange, districts, resultsCount = 0 }: PropertyFiltersProps) {
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  // Track search queries (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Create search signature to detect changes
    const searchSignature = JSON.stringify({
      search: filters.search,
      propertyType: filters.propertyType,
      district: filters.district,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      currency: filters.currency,
    });

    // Skip if search hasn't changed
    if (searchSignature === lastSearchRef.current) {
      return;
    }

    // Debounce search tracking (wait 1 second after user stops typing)
    searchTimeoutRef.current = setTimeout(async () => {
      // Only track if user has actually applied filters (not initial load)
      if (filters.search || filters.propertyType || filters.district || filters.minPrice || filters.maxPrice || filters.currency) {
        const sessionId = getCurrentSessionId();
        if (sessionId) {
          await trackSearchQuery(
            sessionId,
            filters.search,
            {
              district: filters.district || undefined,
              propertyType: filters.propertyType || undefined,
              minPrice: filters.minPrice || undefined,
              maxPrice: filters.maxPrice || undefined,
              currency: filters.currency || undefined,
            },
            resultsCount
          );
          lastSearchRef.current = searchSignature;
        }
      }
    }, 1000);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters, resultsCount]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative lg:col-span-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filters.propertyType}
          onChange={(e) => onChange({ ...filters, propertyType: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Property Types</option>
          <option value="land">Land</option>
          <option value="house">House</option>
          <option value="rental">Rental</option>
          <option value="commercial">Commercial</option>
          <option value="mixed">Mixed Use</option>
        </select>

        <select
          value={filters.district}
          onChange={(e) => onChange({ ...filters, district: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Districts</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>

        <select
          value={filters.currency}
          onChange={(e) => onChange({ ...filters, currency: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Currencies</option>
          <option value="MWK">MWK</option>
          <option value="USD">USD</option>
          <option value="ZAR">ZAR</option>
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <input
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
