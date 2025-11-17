'use client';

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import type { Property } from '../lib/supabase';

interface MarkAsSoldModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export function MarkAsSoldModal({ property, onClose, onSuccess }: MarkAsSoldModalProps) {
  const [loading, setLoading] = useState(false);
  const [quickMark, setQuickMark] = useState(true); // Facebook-style: quick mark by default
  const [salePrice, setSalePrice] = useState('');
  const [buyerType, setBuyerType] = useState<'local' | 'diaspora' | ''>('');
  const [error, setError] = useState('');

  const handleQuickMark = async () => {
    setLoading(true);
    setError('');

    try {
      const { supabase } = await import('../lib/supabase');
      const { error: updateError } = await supabase
        .from('properties')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
          sale_price: null,
          buyer_type: null,
        })
        .eq('id', property.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to mark property as sold');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { supabase } = await import('../lib/supabase');
      
      const updateData: any = {
        status: 'sold',
        sold_at: new Date().toISOString(),
      };

      if (salePrice) {
        const price = parseFloat(salePrice);
        if (isNaN(price) || price < 0) {
          throw new Error('Sale price must be a valid positive number');
        }
        updateData.sale_price = price;
      }

      if (buyerType) {
        updateData.buyer_type = buyerType;
      }

      const { error: updateError } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to mark property as sold');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Mark as Sold</h2>
              <p className="text-sm text-gray-600">{property.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {quickMark ? (
            // Facebook-style: Quick mark (one-click)
            <div className="space-y-4">
              <p className="text-gray-700">
                Mark this property as sold? It will be hidden from the marketplace but remain visible in your dashboard.
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickMark}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Mark as Sold
                    </>
                  )}
                </button>
              </div>

              {/* Optional: Add details link */}
              <button
                type="button"
                onClick={() => setQuickMark(false)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 text-center py-2"
              >
                + Add sale details (optional)
              </button>
            </div>
          ) : (
            // Detailed form (optional data for analytics)
            <form onSubmit={handleSubmitWithDetails} className="space-y-4">
              <p className="text-gray-700 text-sm mb-4">
                Help us improve market intelligence by sharing sale details. All fields are optional.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price ({property.currency})
                  <span className="text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={property.price.toString()}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Listed price: {property.currency} {property.price.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buyer Type
                  <span className="text-gray-500 font-normal ml-1">(optional)</span>
                </label>
                <select
                  value={buyerType}
                  onChange={(e) => setBuyerType(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select buyer type...</option>
                  <option value="local">Local Buyer (within Malawi)</option>
                  <option value="diaspora">Diaspora Buyer (outside Malawi)</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuickMark(true);
                    setSalePrice('');
                    setBuyerType('');
                    setError('');
                  }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Quick Mark
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Mark as Sold
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

