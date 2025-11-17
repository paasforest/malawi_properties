'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Property, Profile, Inquiry } from '../lib/supabase';
import { 
  Heart, Eye, MessageSquare, Clock, MapPin, DollarSign, 
  Filter, Search, CheckCircle, XCircle, Edit, Trash2,
  Building2, Calendar
} from 'lucide-react';
import { PropertyCard } from '../components/PropertyCard';

export function BuyerDashboard() {
  const [user, setUser] = useState<Profile | null>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [viewedProperties, setViewedProperties] = useState<any[]>([]);
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inquiries' | 'viewed' | 'saved'>('inquiries');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      setUser(profile);

      // Load inquiries
      const { data: inquiriesData } = await supabase
        .from('inquiries')
        .select('*, properties(*)')
        .eq('buyer_id', authUser.id)
        .order('created_at', { ascending: false });

      setInquiries(inquiriesData || []);

      // Load viewed properties (from property_views)
      const { data: viewsData } = await supabase
        .from('property_views')
        .select('*, properties(*)')
        .eq('viewer_id', authUser.id)
        .order('viewed_at', { ascending: false });

      // Get unique properties from views
      const uniqueViewedProperties = (viewsData || [])
        .map((v: any) => v.properties)
        .filter((p: any, index: number, self: any[]) => 
          index === self.findIndex((t: any) => t?.id === p?.id)
        )
        .filter((p: any) => p !== null);

      setViewedProperties(uniqueViewedProperties);

      // TODO: Implement saved/favorite properties (needs new table)
      // For now, savedProperties will be empty
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = async (propertyId: string) => {
    // TODO: Implement remove from saved
    alert('Remove from saved - to be implemented');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Please sign in to view your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your property inquiries and saved listings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">My Inquiries</span>
              <MessageSquare className="text-blue-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{inquiries.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {inquiries.filter((i: any) => i.status === 'new').length} new
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Properties Viewed</span>
              <Eye className="text-purple-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{viewedProperties.length}</div>
            <div className="text-sm text-gray-500 mt-1">Recently browsed</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Saved Properties</span>
              <Heart className="text-red-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{savedProperties.length}</div>
            <div className="text-sm text-gray-500 mt-1">Favorites</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-6">
              <button
                onClick={() => setActiveTab('inquiries')}
                className={`px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'inquiries'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageSquare size={18} className="inline mr-2" />
                My Inquiries ({inquiries.length})
              </button>
              <button
                onClick={() => setActiveTab('viewed')}
                className={`px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'viewed'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye size={18} className="inline mr-2" />
                Viewed ({viewedProperties.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-3 font-medium text-sm transition-colors ${
                  activeTab === 'saved'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Heart size={18} className="inline mr-2" />
                Saved ({savedProperties.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Inquiries Tab */}
            {activeTab === 'inquiries' && (
              <div>
                {inquiries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">You haven't sent any inquiries yet.</p>
                    <a
                      href="/"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
                    >
                      Browse Properties
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry: any) => (
                      <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {(inquiry.properties as any)?.title || 'Property'}
                            </h3>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="text-gray-600">
                                  {(inquiry.properties as any)?.district || 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign size={14} className="text-gray-400" />
                                <span className="text-gray-900 font-medium">
                                  {(inquiry.properties as any)?.currency} {(inquiry.properties as any)?.price?.toLocaleString() || 'N/A'}
                                </span>
                              </div>
                              {inquiry.budget_range && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Budget:</span>
                                  <span className="font-medium text-gray-900">{inquiry.budget_range}</span>
                                </div>
                              )}
                              {inquiry.intended_use && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Intent:</span>
                                  <span className="font-medium text-gray-900">{inquiry.intended_use}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                inquiry.status === 'new'
                                  ? 'bg-blue-100 text-blue-800'
                                  : inquiry.status === 'contacted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : inquiry.status === 'closed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {inquiry.status}
                            </span>
                            <div className="text-xs text-gray-500">
                              <Calendar size={12} className="inline mr-1" />
                              {new Date(inquiry.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {inquiry.message && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-gray-700 text-sm">{inquiry.message}</p>
                          </div>
                        )}

                        {inquiry.properties && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <a
                              href="/"
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Property →
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Viewed Tab */}
            {activeTab === 'viewed' && (
              <div>
                {viewedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600">You haven't viewed any properties yet.</p>
                    <a
                      href="/"
                      className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
                    >
                      Browse Properties
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {viewedProperties.slice(0, 12).map((property: Property) => (
                      <div key={property.id} className="relative">
                        <PropertyCard 
                          property={property} 
                          onClick={() => window.location.href = '/'}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                {savedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 mb-2">No saved properties yet.</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Save properties you're interested in by clicking the heart icon.
                    </p>
                    <a
                      href="/"
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
                    >
                      Browse Properties
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProperties.map((property) => (
                      <div key={property.id} className="relative">
                        <PropertyCard 
                          property={property} 
                          onClick={() => window.location.href = '/'}
                        />
                        <button
                          onClick={() => handleRemoveSaved(property.id)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                          title="Remove from saved"
                        >
                          <Heart className="text-red-600 fill-red-600" size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




