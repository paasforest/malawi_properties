import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Property } from '../lib/supabase';

interface InquiryModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export function InquiryModal({ property, onClose, onSuccess }: InquiryModalProps) {
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_country: '',
    buyer_city: '',
    buyer_location: '', // Legacy field, keep for compatibility
    buyer_origin_type: '' as 'diaspora' | 'local' | '', // New: diaspora or local
    local_origin_city: '', // New: If local, which city in Malawi
    budget_range: '',
    intended_use: '',
    payment_method_preference: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Malawi cities for local buyers
  const malawiCities = [
    'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 
    'Karonga', 'Salima', 'Nkhotakota', 'Liwonde', 'Nsanje', 'Mchinji',
    'Dedza', 'Dowa', 'Ntcheu', 'Balaka', 'Mulanje', 'Thyolo', 'Other'
  ];

  // Pre-populate buyer location from user profile on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, current_location')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile) {
          // Try to parse current_location into country/city
          if (profile.current_location) {
            const locationParts = profile.current_location.split(',').map((s: string) => s.trim());
            setFormData((prev) => ({
              ...prev,
              buyer_name: profile.full_name || '',
              buyer_location: profile.current_location || '',
              buyer_city: locationParts[0] || '',
              buyer_country: locationParts[1] || locationParts[0] || '',
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              buyer_name: profile.full_name || '',
            }));
          }
        }
      }
    };

    loadUserProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('Please sign in to send an inquiry');
        setLoading(false);
        return;
      }

      // Determine buyer_origin_type if not set
      const buyerOriginType = formData.buyer_origin_type || 
        (formData.buyer_country?.toLowerCase() === 'malawi' ? 'local' : 'diaspora');

      // Combine country and city for legacy buyer_location field
      const buyerLocation = formData.buyer_city && formData.buyer_country
        ? `${formData.buyer_city}, ${formData.buyer_country}`
        : formData.buyer_location;

      const { error: insertError } = await supabase.from('inquiries').insert({
        property_id: property.id,
        buyer_id: user.id,
        buyer_name: formData.buyer_name,
        buyer_country: formData.buyer_country,
        buyer_city: formData.buyer_city,
        buyer_location: buyerLocation, // Legacy field
        buyer_origin_type: buyerOriginType, // New: diaspora or local
        local_origin_city: buyerOriginType === 'local' ? formData.local_origin_city : null, // New: local city if local
        budget_range: formData.budget_range,
        intended_use: formData.intended_use,
        payment_method_preference: formData.payment_method_preference,
        message: formData.message,
      });

      if (insertError) throw insertError;

      await supabase
        .from('properties')
        .update({ inquiries_count: property.inquiries_count + 1 })
        .eq('id', property.id);

      onSuccess();
    } catch (err) {
      setError('Failed to send inquiry. Please try again.');
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
            <h2 className="text-2xl font-bold text-gray-900">Send Inquiry</h2>
            <p className="text-sm text-blue-600 font-medium mt-1">✨ Get priority response from agent/owner</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-lg mb-1">{property.title}</h3>
            <p className="text-gray-600 text-sm">
              {property.district} • {property.currency} {property.price.toLocaleString()}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    // Auto-set country based on selection
                    buyer_country: originType === 'local' ? 'Malawi' : formData.buyer_country,
                    local_origin_city: originType === 'local' ? formData.local_origin_city : '',
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                <option value="diaspora">Diaspora (Living outside Malawi)</option>
                <option value="local">Local (Living in Malawi)</option>
              </select>
            </div>

            {/* Country and City - Different based on buyer type */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Current Location (optional)
              </label>
              <input
                type="text"
                value={formData.buyer_location}
                onChange={(e) => setFormData({ ...formData, buyer_location: e.target.value })}
                placeholder="e.g., Johannesburg, South Africa"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This field is optional. Country and City above are preferred.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Range
              </label>
              <input
                type="text"
                value={formData.budget_range}
                onChange={(e) => setFormData({ ...formData, budget_range: e.target.value })}
                placeholder="e.g., $50,000 - $75,000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intended Use
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method Preference
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell us more about your interest..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
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
              {loading ? 'Sending...' : 'Send Inquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
