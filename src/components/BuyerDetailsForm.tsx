'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/supabase';
import { X, User, MapPin, DollarSign, Home, CreditCard, MessageSquare } from 'lucide-react';

interface BuyerDetailsFormProps {
  property: Property;
  onDetailsUnlocked: (formData: any) => void;
  onClose: () => void;
}

export function BuyerDetailsForm({ property, onDetailsUnlocked, onClose }: BuyerDetailsFormProps) {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_origin_type: '' as 'diaspora' | 'local' | '',
    buyer_country: '',
    buyer_city: '',
    local_origin_city: '',
    budget_range: '',
    intended_use: '',
    payment_method_preference: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Malawi cities for local buyers
  const malawiCities = [
    'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 
    'Karonga', 'Salima', 'Nkhotakota', 'Liwonde', 'Nsanje', 'Mchinji',
    'Dedza', 'Dowa', 'Ntcheu', 'Balaka', 'Mulanje', 'Thyolo', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.buyer_name || !formData.buyer_origin_type) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Determine buyer origin type if not set
      const buyerOriginType = formData.buyer_origin_type || 
        (formData.buyer_country?.toLowerCase() === 'malawi' ? 'local' : 'diaspora');

      // Record property view with buyer data (no login required)
      const deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

      const viewerCountry = buyerOriginType === 'local' ? 'Malawi' : formData.buyer_country;
      const viewerCity = buyerOriginType === 'local' ? formData.local_origin_city : formData.buyer_city;
      const viewerLocation = buyerOriginType === 'local' 
        ? `${viewerCity}, Malawi`
        : `${formData.buyer_city}, ${formData.buyer_country}`;

      // Insert property view with buyer data
      const { error: viewError } = await supabase.from('property_views').insert({
        property_id: property.id,
        viewer_id: null, // No user account needed
        viewer_location: viewerLocation, // Legacy field
        viewer_country: viewerCountry,
        viewer_city: viewerCity,
        viewer_origin_type: buyerOriginType,
        viewer_local_city: buyerOriginType === 'local' ? formData.local_origin_city : null,
        device_type: deviceType,
        viewing_duration: 0,
      });

      if (viewError) throw viewError;

      // Update property views count
      await supabase
        .from('properties')
        .update({ views_count: property.views_count + 1 })
        .eq('id', property.id);

      // Unlock details and pass form data
      onDetailsUnlocked(formData);
    } catch (err: any) {
      setError('Failed to submit. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Get Property Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help us connect you with the seller
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Property Preview */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-4">
            {property.images && property.images.length > 0 && (
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{property.title}</h3>
              <p className="text-gray-600 text-sm mb-2">
                <MapPin size={14} className="inline mr-1" />
                {property.area ? `${property.area}, ` : ''}
                {property.district}
              </p>
              <p className="text-xl font-bold text-blue-600">
                {property.currency} {property.price.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User size={16} />
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.buyer_name}
                onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                placeholder="e.g., John Mwale"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buyer Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin size={16} />
                Are you living in Malawi or outside? *
              </label>
              <select
                required
                value={formData.buyer_origin_type}
                onChange={(e) => {
                  const originType = e.target.value as 'diaspora' | 'local' | '';
                  setFormData({ 
                    ...formData, 
                    buyer_origin_type: originType,
                    buyer_country: originType === 'local' ? 'Malawi' : formData.buyer_country,
                    local_origin_city: originType === 'local' ? formData.local_origin_city : '',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="local">Local (Living in Malawi)</option>
                <option value="diaspora">Diaspora (Living outside Malawi)</option>
              </select>
            </div>

            {/* Location Fields - Different based on buyer type */}
            {formData.buyer_origin_type === 'local' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which city in Malawi are you from? *
                </label>
                <select
                  required
                  value={formData.local_origin_city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    local_origin_city: e.target.value,
                    buyer_city: e.target.value,
                    buyer_country: 'Malawi'
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select your city</option>
                  {malawiCities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            ) : formData.buyer_origin_type === 'diaspora' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buyer_country}
                    onChange={(e) => setFormData({ ...formData, buyer_country: e.target.value })}
                    placeholder="e.g., South Africa, UK, USA"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.buyer_city}
                    onChange={(e) => setFormData({ ...formData, buyer_city: e.target.value })}
                    placeholder="e.g., Johannesburg, London"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <DollarSign size={16} />
                Budget Range (optional)
              </label>
              <input
                type="text"
                value={formData.budget_range}
                onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                placeholder="e.g., MK 20M-30M"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Home size={16} />
                Intended Use (optional)
              </label>
              <select
                value={formData.intended_use}
                onChange={(e) => setFormData({ ...formData, intended_use: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select intended use</option>
                <option value="Home Build">Home Build</option>
                <option value="Rental Income">Rental Income</option>
                <option value="Farming">Farming</option>
                <option value="Commercial">Commercial</option>
                <option value="Investment">Investment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CreditCard size={16} />
                Payment Method Preference (optional)
              </label>
              <select
                value={formData.payment_method_preference}
                onChange={(e) => setFormData({ ...formData, payment_method_preference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select payment method</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Installments">Installments</option>
                <option value="Mortgage">Mortgage</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'View Full Details'}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 mt-4">
            Your information helps us provide better service. We respect your privacy.
          </p>
        </form>
      </div>
    </div>
  );
}


