 'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/supabase';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyFilters } from '../components/PropertyFilters';
import { PropertyModal } from '../components/PropertyModal';
import { InquiryModal } from '../components/InquiryModal';
import { HeroSection } from '../components/HeroSection';
import { PropertyCategories } from '../components/PropertyCategories';
import { PopularDistricts } from '../components/PopularDistricts';
import { HowItWorks } from '../components/HowItWorks';
import { TrustSection } from '../components/TrustSection';
import { Testimonials } from '../components/Testimonials';
import { CTASection } from '../components/CTASection';

export function Marketplace() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    propertyType: '',
    district: '',
    minPrice: '',
    maxPrice: '',
    currency: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'available')
        .order('is_featured', { ascending: false })
        .order('listed_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching properties:', error);
        throw error;
      }

      setProperties(data || []);

      const uniqueDistricts = [...new Set(data?.map((p) => p.district) || [])];
      setDistricts(uniqueDistricts.sort());
    } catch (error) {
      console.error('❌ Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower) ||
          p.district.toLowerCase().includes(searchLower) ||
          p.area?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.propertyType) {
      filtered = filtered.filter((p) => p.property_type === filters.propertyType);
    }

    if (filters.district) {
      filtered = filtered.filter((p) => p.district === filters.district);
    }

    if (filters.currency) {
      filtered = filtered.filter((p) => p.currency === filters.currency);
    }

    if (filters.minPrice) {
      filtered = filtered.filter((p) => p.price >= Number(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((p) => p.price <= Number(filters.maxPrice));
    }

    setFilteredProperties(filtered);
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleInquireClick = () => {
    setShowInquiryModal(true);
  };

  const handleInquirySuccess = () => {
    setShowInquiryModal(false);
    setSelectedProperty(null);
    alert('Your inquiry has been sent successfully!');
  };

  const handleHeroSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    // Scroll to properties section
    const propertiesSection = document.getElementById('properties-section');
    if (propertiesSection) {
      propertiesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading properties...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection onSearch={handleHeroSearch} districts={districts} />

      {/* Property Categories */}
      <PropertyCategories />

      {/* Popular Districts */}
      <PopularDistricts />

      {/* How It Works */}
      <HowItWorks />

      {/* Trust Section */}
      <TrustSection />

      {/* Main Properties Section */}
      <div id="properties-section" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Available Properties
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover verified properties across Malawi
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <PropertyFilters filters={filters} onChange={setFilters} districts={districts} />
          </div>

          {/* Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-gray-700 font-medium">
              Showing <span className="text-blue-600 font-bold">{filteredProperties.length}</span> of{' '}
              <span className="text-gray-900 font-bold">{properties.length}</span> properties
            </div>
          </div>

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-md">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl text-gray-900 font-semibold mb-2">
                  No properties found
                </p>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or search criteria
                </p>
                <button
                  onClick={() => setFilters({
                    search: '',
                    propertyType: '',
                    district: '',
                    minPrice: '',
                    maxPrice: '',
                    currency: '',
                  })}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onClick={() => handlePropertyClick(property)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <CTASection />

      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onInquire={handleInquireClick}
        />
      )}

      {showInquiryModal && selectedProperty && (
        <InquiryModal
          property={selectedProperty}
          onClose={() => setShowInquiryModal(false)}
          onSuccess={handleInquirySuccess}
        />
      )}
    </div>
  );
}
