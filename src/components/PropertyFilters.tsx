import { Search } from 'lucide-react';

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
}

export function PropertyFilters({ filters, onChange, districts }: PropertyFiltersProps) {
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
