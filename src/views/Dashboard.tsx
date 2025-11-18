 'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Property, Profile, Agent, Inquiry } from '../lib/supabase';
import { Plus, TrendingUp, Eye, MessageSquare, DollarSign, Clock, Trash2, CheckCircle, XCircle, Edit, Settings, AlertCircle } from 'lucide-react';
import { PropertyForm } from '../components/PropertyForm';
import { MarkAsSoldModal } from '../components/MarkAsSoldModal';

export function Dashboard() {
  const [user, setUser] = useState<Profile | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAgentProfileForm, setShowAgentProfileForm] = useState(false);
  const [updatingInquiry, setUpdatingInquiry] = useState<string | null>(null);
  const [propertyToMarkSold, setPropertyToMarkSold] = useState<Property | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);

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

      if (profile?.user_type === 'agent') {
        const { data: agentData } = await supabase
          .from('agents')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        setAgent(agentData);

        if (agentData) {
          const { data: propertiesData, error: propertiesError } = await supabase
            .from('properties')
            .select('*')
            .eq('agent_id', agentData.id)
            .order('created_at', { ascending: false });

          if (propertiesError) {
            console.error('❌ Error loading agent properties:', propertiesError);
          } else {
            console.log('✅ Agent properties loaded:', {
              count: propertiesData?.length || 0,
              properties: propertiesData?.map(p => ({
                id: p.id,
                title: p.title,
                status: p.status,
                imagesCount: p.images?.length || 0,
              })),
            });
          }

          setProperties(propertiesData || []);

          const { data: inquiriesData } = await supabase
            .from('inquiries')
            .select('*, properties(*)')
            .in('property_id', propertiesData?.map(p => p.id) || [])
            .order('created_at', { ascending: false });

          setInquiries(inquiriesData || []);
        }
      } else if (profile?.user_type === 'owner') {
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', authUser.id)
          .order('created_at', { ascending: false });

        if (propertiesError) {
          console.error('❌ Error loading owner properties:', propertiesError);
        } else {
          console.log('✅ Owner properties loaded:', {
            count: propertiesData?.length || 0,
            properties: propertiesData?.map(p => ({
              id: p.id,
              title: p.title,
              status: p.status,
              imagesCount: p.images?.length || 0,
            })),
          });
        }

        setProperties(propertiesData || []);

        const { data: inquiriesData } = await supabase
          .from('inquiries')
          .select('*, properties(*)')
          .in('property_id', propertiesData?.map(p => p.id) || [])
          .order('created_at', { ascending: false });

        setInquiries(inquiriesData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.from('agents').insert({
        user_id: user.id,
        company_name: '',
        license_number: '',
      });

      if (error) throw error;
      await loadDashboardData();
    } catch (error) {
      console.error('Error creating agent profile:', error);
    }
  };

  const calculateStats = () => {
    const totalViews = properties.reduce((sum, p) => sum + p.views_count, 0);
    const totalInquiries = properties.reduce((sum, p) => sum + p.inquiries_count, 0);
    const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
    const totalSales = properties.filter((p) => p.status === 'sold').length;
    const conversionRate = properties.length > 0 
      ? (totalSales / properties.length) * 100 
      : 0;
    
    // Calculate average time to sale
    const soldProperties = properties.filter((p) => p.status === 'sold' && p.sold_at);
    const avgTimeToSale = soldProperties.length > 0
      ? soldProperties.reduce((sum, p) => {
          const listDate = new Date(p.listed_at);
          const soldDate = new Date(p.sold_at!);
          const days = Math.floor((soldDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / soldProperties.length
      : 0;

    return { 
      totalViews, 
      totalInquiries, 
      totalValue, 
      totalSales, 
      conversionRate,
      avgTimeToSale: Math.round(avgTimeToSale)
    };
  };

  const stats = calculateStats();

  const handleMarkAsSold = (property: Property) => {
    setPropertyToMarkSold(property);
  };

  const handleUpdatePropertyStatus = async (propertyId: string, newStatus: 'available' | 'pending' | 'sold' | 'withdrawn') => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'sold') {
        updateData.sold_at = new Date().toISOString();
      } else {
        updateData.sold_at = null;
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId);

      if (error) throw error;
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating property status:', error);
      alert('Failed to update property status');
    }
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      await loadDashboardData();
      alert('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      alert('Failed to delete property');
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    try {
      setUpdatingInquiry(inquiryId);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'contacted') {
        updateData.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('inquiries')
        .update(updateData)
        .eq('id', inquiryId);

      if (error) throw error;
      await loadDashboardData();
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      alert('Failed to update inquiry status');
    } finally {
      setUpdatingInquiry(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (user?.user_type === 'agent' && !agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Complete Your Agent Profile</h2>
          <p className="text-gray-600 mb-6">
            To start listing properties, you need to create your agent profile.
          </p>
          <button
            onClick={handleCreateAgent}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Agent Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your property listings</p>
          </div>
          <div className="flex gap-3">
            {agent && (
              <button
                onClick={() => setShowAgentProfileForm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Settings size={18} />
                Agent Profile
              </button>
            )}
            <button
              onClick={() => setShowPropertyForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Add Property
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Listings</span>
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{properties.length}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.totalSales} sold
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Conversion Rate</span>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.totalSales} / {properties.length} sold
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Views</span>
              <Eye className="text-purple-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalViews}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.totalInquiries} inquiries
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Avg Time to Sale</span>
              <Clock className="text-orange-600" size={20} />
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats.avgTimeToSale || 'N/A'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.avgTimeToSale > 0 ? 'days' : 'No sales yet'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
          </div>
          <div className="p-6">
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't listed any properties yet.</p>
                <button
                  onClick={() => setShowPropertyForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Add Your First Property
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Views</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Inquiries</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((property) => (
                      <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{property.title}</td>
                        <td className="py-3 px-4 capitalize">{property.property_type}</td>
                        <td className="py-3 px-4">{property.district}</td>
                        <td className="py-3 px-4">
                          {property.currency} {property.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              property.status === 'available'
                                ? 'bg-green-100 text-green-800'
                                : property.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {property.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">{property.views_count}</td>
                        <td className="py-3 px-4">{property.inquiries_count}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={property.status}
                              onChange={(e) => handleUpdatePropertyStatus(property.id, e.target.value as any)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="available">Available</option>
                              <option value="pending">Pending</option>
                              <option value="sold">Sold</option>
                              <option value="withdrawn">Withdrawn</option>
                            </select>
                            <button
                              onClick={() => {
                                setEditingProperty(property);
                                setShowPropertyForm(true);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm p-1"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            {property.status !== 'sold' && (
                              <button
                                onClick={() => handleMarkAsSold(property)}
                                className="text-green-600 hover:text-green-700 text-sm p-1"
                                title="Mark as Sold"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteProperty(property.id)}
                              className="text-red-600 hover:text-red-700 text-sm p-1"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Inquiries</h2>
          </div>
          <div className="p-6">
            {inquiries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No inquiries yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inquiry: any) => {
                  // Build buyer location display
                  const buyerLocation = inquiry.buyer_city && inquiry.buyer_country
                    ? `${inquiry.buyer_city}, ${inquiry.buyer_country}`
                    : inquiry.buyer_country
                    ? inquiry.buyer_country
                    : inquiry.buyer_location || 'Location not specified';

                  return (
                    <div key={inquiry.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {inquiry.properties?.title}
                          </h3>
                          
                          {/* Buyer Intelligence - NO CONTACT DETAILS */}
                          <div className="space-y-2">
                            {/* Buyer Location */}
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500">📍 Buyer from:</span>
                              <span className="font-medium text-gray-900">{buyerLocation}</span>
                            </div>

                            {/* Buyer Name - Only if provided */}
                            {inquiry.buyer_name && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">👤 Name:</span>
                                <span className="font-medium text-gray-900">{inquiry.buyer_name}</span>
                              </div>
                            )}

                            {/* Budget Range */}
                            {inquiry.budget_range && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">💵 Budget:</span>
                                <span className="font-medium text-gray-900">{inquiry.budget_range}</span>
                              </div>
                            )}

                            {/* Intended Use */}
                            {inquiry.intended_use && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">🏠 Intent:</span>
                                <span className="font-medium text-gray-900">{inquiry.intended_use}</span>
                              </div>
                            )}

                            {/* Payment Preference */}
                            {inquiry.payment_method_preference && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">💳 Payment:</span>
                                <span className="font-medium text-gray-900">{inquiry.payment_method_preference}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${
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
                      </div>

                      {/* Message */}
                      {inquiry.message && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-gray-700 text-sm">{inquiry.message}</p>
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Note: Buyer contact details are private. Respond via this platform or wait for buyer to contact you.
                          </p>
                        </div>
                      )}

                      {/* Inquiry Actions */}
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2">
                        <span className="text-xs text-gray-600">Update Status:</span>
                        <select
                          value={inquiry.status}
                          onChange={(e) => handleUpdateInquiryStatus(inquiry.id, e.target.value)}
                          disabled={updatingInquiry === inquiry.id}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="viewing_scheduled">Viewing Scheduled</option>
                          <option value="negotiating">Negotiating</option>
                          <option value="closed">Closed</option>
                          <option value="lost">Lost</option>
                        </select>
                        {updatingInquiry === inquiry.id && (
                          <span className="text-xs text-gray-500">Updating...</span>
                        )}
                        {inquiry.responded_at && (
                          <span className="text-xs text-gray-500 ml-auto">
                            Responded: {new Date(inquiry.responded_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {showPropertyForm && (
        <PropertyForm
          agent={agent}
          userId={user?.id || ''}
          property={editingProperty}
          onClose={() => {
            setShowPropertyForm(false);
            setEditingProperty(null);
          }}
          onSuccess={async (result) => {
            const wasEditing = Boolean(editingProperty);
            setShowPropertyForm(false);
            setEditingProperty(null);
            await loadDashboardData();
            setToast({
              message: result?.message || (wasEditing ? 'Property updated successfully!' : 'Property added successfully!'),
              type: 'success',
            });
          }}
        />
      )}

      {/* Agent Profile Form */}
      {showAgentProfileForm && agent && (
        <AgentProfileForm
          agent={agent}
          onClose={() => setShowAgentProfileForm(false)}
          onSuccess={() => {
            setShowAgentProfileForm(false);
            loadDashboardData();
          }}
        />
      )}

      {/* Mark as Sold Modal */}
      {propertyToMarkSold && (
        <MarkAsSoldModal
          property={propertyToMarkSold}
          onClose={() => setPropertyToMarkSold(null)}
          onSuccess={() => {
            setPropertyToMarkSold(null);
            loadDashboardData();
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-50">
          <div
            className={`max-w-sm ml-auto bg-white border-l-4 rounded-lg shadow-xl p-4 flex items-start gap-3 ${
              toast.type === 'success' ? 'border-green-500' : 'border-red-500'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="text-green-600 mt-0.5" size={18} />
            ) : (
              <AlertCircle className="text-red-600 mt-0.5" size={18} />
            )}
            <div className="flex-1 text-sm text-gray-800">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Agent Profile Management Component
function AgentProfileForm({ agent, onClose, onSuccess }: { agent: Agent; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    company_name: agent.company_name || '',
    license_number: agent.license_number || '',
    districts_covered: agent.districts_covered || [],
  });
  const [newDistrict, setNewDistrict] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          company_name: formData.company_name,
          license_number: formData.license_number,
          districts_covered: formData.districts_covered,
        })
        .eq('id', agent.id);

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error updating agent profile:', error);
      alert('Failed to update agent profile');
    } finally {
      setLoading(false);
    }
  };

  const addDistrict = () => {
    if (newDistrict.trim() && !formData.districts_covered.includes(newDistrict.trim())) {
      setFormData({
        ...formData,
        districts_covered: [...formData.districts_covered, newDistrict.trim()],
      });
      setNewDistrict('');
    }
  };

  const removeDistrict = (district: string) => {
    setFormData({
      ...formData,
      districts_covered: formData.districts_covered.filter(d => d !== district),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Agent Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Districts Covered
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newDistrict}
                  onChange={(e) => setNewDistrict(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDistrict())}
                  placeholder="Enter district name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addDistrict}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.districts_covered.map((district) => (
                  <span
                    key={district}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {district}
                    <button
                      type="button"
                      onClick={() => removeDistrict(district)}
                      className="hover:text-blue-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
