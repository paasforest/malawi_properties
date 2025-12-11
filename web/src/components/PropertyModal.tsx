import { X, MapPin, Bed, Bath, Maximize, Check, FileText, Calendar, Phone, Mail, User } from 'lucide-react';
import type { Property, Profile } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BuyerDetailsForm } from './BuyerDetailsForm';
import { getImageUrl, getValidImageUrls, handleImageError } from '../lib/imageUtils';

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
  onInquire: () => void;
}

export function PropertyModal({ property, onClose, onInquire }: PropertyModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [agentProfile, setAgentProfile] = useState<{ full_name: string | null; email: string | null; phone: string | null } | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<{ full_name: string | null; email: string | null; phone: string | null } | null>(null);
  const [loadingContact, setLoadingContact] = useState(true);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [detailsUnlocked, setDetailsUnlocked] = useState(false);
  const [buyerFormData, setBuyerFormData] = useState<any>(null);

  // Check if user is logged in as agent/owner (they can see details immediately)
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);

  useEffect(() => {
    const checkUserAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .maybeSingle();
        
        // If user is agent or owner, they can see details immediately
        const isAgentOrOwner = profile?.user_type === 'agent' || profile?.user_type === 'owner';
        setIsLoggedInUser(isAgentOrOwner);
        if (isAgentOrOwner) {
          setDetailsUnlocked(true);
        }
      }
    };

    checkUserAuth();
    loadContactInfo();
  }, [property]);

  const loadContactInfo = async () => {
    try {
      setLoadingContact(true);
      
      // Load agent contact info if agent_id exists
      if (property.agent_id) {
        const { data: agent } = await supabase
          .from('agents')
          .select('user_id')
          .eq('id', property.agent_id)
          .maybeSingle();

        if (agent?.user_id) {
          const { data: agentProfileData } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', agent.user_id)
            .maybeSingle();
          setAgentProfile(agentProfileData || null);
        }
      }

      // Load owner contact info if owner_id exists
      if (property.owner_id) {
        const { data: ownerProfileData } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', property.owner_id)
          .maybeSingle();
        setOwnerProfile(ownerProfileData || null);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    } finally {
      setLoadingContact(false);
    }
  };

  // Track viewing duration (only if details are unlocked)
  useEffect(() => {
    if (!detailsUnlocked) return;

    const startTime = Date.now();
    let viewId: string | null = null;

    const recordView = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      // Use buyer form data if available, otherwise try to get from user profile
      let viewerLocation: string | null = null;
      let viewerCountry: string | null = null;
      let viewerCity: string | null = null;
      let viewerOriginType: 'diaspora' | 'local' | null = null;
      let viewerLocalCity: string | null = null;

      if (buyerFormData) {
        // Use form data from buyer
        viewerOriginType = buyerFormData.buyer_origin_type === 'local' ? 'local' : 'diaspora';
        viewerCountry = viewerOriginType === 'local' ? 'Malawi' : buyerFormData.buyer_country;
        viewerCity = viewerOriginType === 'local' ? buyerFormData.local_origin_city : buyerFormData.buyer_city;
        viewerLocation = viewerOriginType === 'local'
          ? `${viewerCity}, Malawi`
          : `${buyerFormData.buyer_city}, ${buyerFormData.buyer_country}`;
        viewerLocalCity = viewerOriginType === 'local' ? buyerFormData.local_origin_city : null;
      } else if (user) {
        // Try to get from user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_location, is_diaspora, buyer_origin_type, local_origin_city')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profile?.current_location) {
          viewerLocation = profile.current_location;
          const locationParts = profile.current_location.split(',').map((s: string) => s.trim());
          if (locationParts.length >= 2) {
            viewerCity = locationParts[0];
            viewerCountry = locationParts[1];
          } else {
            viewerCountry = locationParts[0];
          }
          viewerOriginType = profile.is_diaspora ? 'diaspora' : 'local';
          viewerLocalCity = profile.local_origin_city || null;
        }
      }

      // Detect device type
      const deviceType = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';

      // Get or create session
      const { getCurrentSessionId, getOrCreateSession } = await import('../lib/sessionTracking');
      let sessionId = getCurrentSessionId();
      if (!sessionId) {
        sessionId = await getOrCreateSession();
      }

      // Record property view
      const { data: viewData } = await supabase.from('property_views').insert({
        property_id: property.id,
        viewer_id: user?.id || null,
        viewer_location: viewerLocation,
        viewer_country: viewerCountry,
        viewer_city: viewerCity,
        viewer_origin_type: viewerOriginType,
        viewer_local_city: viewerLocalCity,
        device_type: deviceType,
        session_id: sessionId,
        viewing_duration: 0,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
      }).select('id').single();

      if (viewData) {
        viewId = viewData.id;
      }

      // Update property views count
      await supabase
        .from('properties')
        .update({ views_count: property.views_count + 1 })
        .eq('id', property.id);
    };

    recordView();

    // Track viewing duration on close
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (viewId && duration > 3) {
        supabase
          .from('property_views')
          .update({ viewing_duration: duration })
          .eq('id', viewId)
          .then(() => {});
      }
    };
  }, [property.id, detailsUnlocked, buyerFormData]);

  const handleViewDetails = () => {
    setShowDetailsForm(true);
  };

  const handleDetailsUnlocked = (formData: any) => {
    setBuyerFormData(formData);
    setDetailsUnlocked(true);
    setShowDetailsForm(false);
  };

  // Show form if details not unlocked and user is not logged in
  if (showDetailsForm && !detailsUnlocked) {
    return (
      <BuyerDetailsForm
        property={property}
        onDetailsUnlocked={handleDetailsUnlocked}
        onClose={() => {
          setShowDetailsForm(false);
          onClose();
        }}
      />
    );
  }

  // If details not unlocked and user is not logged in, show preview
  if (!detailsUnlocked && !isLoggedInUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg sm:rounded-xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between z-10">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-2 truncate">{property.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
              aria-label="Close"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Property Preview */}
            {(() => {
              const validImages = getValidImageUrls(property.images);
              if (validImages.length > 0) {
                return (
                  <div className="mb-6">
                    <img
                      src={getImageUrl(validImages[0])}
                      alt={property.title}
                      className="w-full h-64 object-cover rounded-lg"
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex items-center text-gray-600 mb-4">
              <MapPin size={18} className="mr-2" />
              <span className="text-lg">
                {property.area ? `${property.area}, ` : ''}
                {property.district}
              </span>
            </div>

            <div className="text-3xl font-bold text-gray-900 mb-6">
              {property.currency} {property.price.toLocaleString()}
            </div>

            {property.plot_size && (
              <div className="flex items-center gap-2 text-gray-700 mb-4">
                <Maximize size={20} />
                <span>{property.plot_size.toLocaleString()}m²</span>
              </div>
            )}

            {/* CTA to view full details */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Want to see full property details?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Fill in a quick form to unlock complete property information and seller contact details.
              </p>
              <button
                onClick={handleViewDetails}
                className="w-full bg-blue-600 text-white py-3.5 sm:py-3 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold text-base min-h-[44px]"
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full details view (unlocked)
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'MWK') {
      return `MWK ${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg max-w-4xl w-full h-full sm:h-auto max-h-full sm:max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex items-center justify-between z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 pr-2 truncate">{property.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {(() => {
            const validImages = getValidImageUrls(property.images);
            if (validImages.length > 0) {
              const safeIndex = Math.min(currentImageIndex, validImages.length - 1);
              return (
                <div className="mb-6">
                  <div className="relative h-48 sm:h-64 md:h-96 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(validImages[safeIndex])}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      loading="lazy"
                    />
                    {validImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                        {validImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <div className="mb-6 h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                No Images Available
              </div>
            );
          })()}

          <div className="flex items-center gap-2 mb-4">
            {property.is_verified && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Check size={14} />
                Verified Property
              </span>
            )}
            {property.is_featured && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                Featured
              </span>
            )}
            {property.is_urgent_sale && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                Urgent Sale
              </span>
            )}
            {property.has_title_deed && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Title Deed Available
              </span>
            )}
          </div>

          <div className="flex items-center text-gray-600 mb-4">
            <MapPin size={18} className="mr-2" />
            <span className="text-lg">
              {property.area ? `${property.area}, ` : ''}
              {property.district}
            </span>
          </div>

          <div className="text-3xl font-bold text-gray-900 mb-6">
            {formatPrice(property.price, property.currency)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Bed size={20} />
                <span>{property.bedrooms} Bedrooms</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-2 text-gray-700">
                <Bath size={20} />
                <span>{property.bathrooms} Bathrooms</span>
              </div>
            )}
            {property.plot_size && (
              <div className="flex items-center gap-2 text-gray-700">
                <Maximize size={20} />
                <span>{property.plot_size.toLocaleString()}m²</span>
              </div>
            )}
            {property.documentation_type && (
              <div className="flex items-center gap-2 text-gray-700">
                <FileText size={20} />
                <span>{property.documentation_type}</span>
              </div>
            )}
          </div>

          {property.description && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Calendar size={16} />
            <span>Listed on {formatDate(property.listed_at)}</span>
          </div>

          {/* Primary CTA: Send Inquiry */}
          <div className="mb-4">
            <button
              onClick={onInquire}
              className="w-full bg-blue-600 text-white py-3.5 sm:py-4 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl min-h-[44px]"
            >
              Send Inquiry
            </button>
            <p className="text-center text-sm text-blue-600 font-medium mt-2">
              ✨ Get priority response from agent/owner
            </p>
          </div>

          {/* Secondary Option: Contact Directly */}
          {(agentProfile || ownerProfile) && !loadingContact && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-center text-sm text-gray-600 mb-3">
                Or contact the seller directly
              </p>
              <div className="space-y-2">
                {agentProfile && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Agent: {agentProfile.full_name || 'Agent'}
                    </div>
                    {agentProfile.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <a 
                          href={`https://wa.me/${agentProfile.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                        >
                          <Phone size={16} />
                          WhatsApp
                        </a>
                        <span className="text-gray-300">•</span>
                        <a 
                          href={`tel:${agentProfile.phone}`} 
                          className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                        >
                          <Phone size={16} />
                          {agentProfile.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {ownerProfile && !agentProfile && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Owner: {ownerProfile.full_name || 'Owner'}
                    </div>
                    {ownerProfile.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <a 
                          href={`https://wa.me/${ownerProfile.phone.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                        >
                          <Phone size={16} />
                          WhatsApp
                        </a>
                        <span className="text-gray-300">•</span>
                        <a 
                          href={`tel:${ownerProfile.phone}`} 
                          className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
                        >
                          <Phone size={16} />
                          {ownerProfile.phone}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">
                All transactions happen off-platform
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
