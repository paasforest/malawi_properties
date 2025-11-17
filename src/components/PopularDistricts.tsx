'use client';

import { MapPin, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

interface DistrictData {
  district: string;
  count: number;
}

export function PopularDistricts() {
  const [districts, setDistricts] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopularDistricts();
  }, []);

  const loadPopularDistricts = async () => {
    try {
      const { data: properties } = await supabase
        .from('properties')
        .select('district')
        .eq('status', 'available');

      const districtCounts = properties?.reduce((acc: any, p) => {
        acc[p.district] = (acc[p.district] || 0) + 1;
        return acc;
      }, {});

      const popularDistricts = Object.entries(districtCounts || {})
        .map(([district, count]) => ({ district, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // If not enough data, show popular districts anyway
      if (popularDistricts.length === 0) {
        setDistricts([
          { district: 'Lilongwe', count: 0 },
          { district: 'Blantyre', count: 0 },
          { district: 'Mzuzu', count: 0 },
          { district: 'Zomba', count: 0 },
          { district: 'Mangochi', count: 0 },
          { district: 'Kasungu', count: 0 },
        ]);
      } else {
        setDistricts(popularDistricts);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <MapPin className="text-blue-600" size={32} />
            Popular Districts
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most sought-after locations in Malawi
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {districts.map((district) => (
            <Link
              key={district.district}
              href={`/?district=${encodeURIComponent(district.district)}`}
              className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 border border-gray-200 group"
            >
              <div className="flex items-center justify-between mb-3">
                <MapPin className="text-blue-600 group-hover:text-blue-700" size={24} />
                {district.count > 0 && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <TrendingUp size={12} />
                    {district.count}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {district.district}
              </h3>
              {district.count > 0 && (
                <p className="text-sm text-gray-500 mt-1">{district.count} properties</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


