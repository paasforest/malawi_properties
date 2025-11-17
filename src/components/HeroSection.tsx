'use client';

import { Search, Building2, Users, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
  districts: string[];
}

export function HeroSection({ onSearch, districts }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [district, setDistrict] = useState('');
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBuyers: 0,
    verifiedAgents: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('status', 'available');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_type', 'buyer');

      const { data: agents } = await supabase
        .from('agents')
        .select('id')
        .eq('verification_status', 'verified');

      setStats({
        totalProperties: properties?.length || 0,
        totalBuyers: profiles?.length || 0,
        verifiedAgents: agents?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find Your Dream Property
            <span className="block text-blue-200">in Malawi</span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Trusted by thousands of Malawian diaspora buyers worldwide. 
            Verified properties, trusted agents, direct contact. Free for all.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-2 md:p-4 mb-12">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search properties, districts, or areas..."
                  className="w-full pl-12 pr-4 py-3 md:py-4 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                />
              </div>

              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="px-4 py-3 md:py-4 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-300 text-lg"
              >
                <option value="">All Types</option>
                <option value="land">Land</option>
                <option value="house">House</option>
                <option value="rental">Rental</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed Use</option>
              </select>

              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="px-4 py-3 md:py-4 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none border border-gray-300 text-lg"
              >
                <option value="">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <button
                type="submit"
                className="px-8 py-3 md:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg"
              >
                Search
              </button>
            </div>
          </form>

          {/* Trust Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Building2 className="mx-auto mb-3" size={32} />
              <div className="text-3xl md:text-4xl font-bold mb-1">
                {stats.totalProperties > 0 ? stats.totalProperties.toLocaleString() : '500+'}
              </div>
              <div className="text-blue-200 text-sm md:text-base">Verified Properties</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Users className="mx-auto mb-3" size={32} />
              <div className="text-3xl md:text-4xl font-bold mb-1">
                {stats.totalBuyers > 0 ? stats.totalBuyers.toLocaleString() : '10K+'}
              </div>
              <div className="text-blue-200 text-sm md:text-base">Diaspora Buyers</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <Shield className="mx-auto mb-3" size={32} />
              <div className="text-3xl md:text-4xl font-bold mb-1">
                {stats.verifiedAgents > 0 ? stats.verifiedAgents : '50+'}
              </div>
              <div className="text-blue-200 text-sm md:text-base">Trusted Agents</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg className="w-full h-16 fill-gray-50" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>
    </div>
  );
}

