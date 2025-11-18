'use client';

import { MapPin, Bed, Bath, Maximize, Check, Eye, MessageSquare, Star } from 'lucide-react';
import type { Property } from '../lib/supabase';
import { getImageUrl, getValidImageUrls, handleImageError } from '../lib/imageUtils';

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const formatPrice = (price: number, currency: string) => {
    if (currency === 'MWK') {
      return `MWK ${price.toLocaleString()}`;
    }
    return `${currency} ${price.toLocaleString()}`;
  };

  const getPropertyTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100 group"
    >
      {/* Image Section */}
      <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {(() => {
          const validImages = getValidImageUrls(property.images);
          const firstImage = validImages[0];
          
          if (firstImage) {
            return (
              <img
                src={getImageUrl(firstImage)}
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  handleImageError(e);
                  // Show placeholder if image fails
                  const placeholder = e.currentTarget.nextElementSibling;
                  if (placeholder) {
                    placeholder.classList.remove('hidden');
                  }
                  e.currentTarget.style.display = 'none';
                }}
                loading="lazy"
              />
            );
          }
          
          return null;
        })()}
        {(() => {
          const validImages = getValidImageUrls(property.images);
          if (validImages.length === 0) {
            return (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
                <div className="text-center">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Image</p>
                </div>
              </div>
            );
          }
          return (
            <div className="hidden w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
              <div className="text-center">
                <MapPin size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          );
        })()}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {property.is_featured && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
              <Star size={12} className="fill-white" />
              Featured
            </div>
          )}
          {property.is_urgent_sale && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
              Urgent Sale
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3">
          {property.is_verified && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1 backdrop-blur-sm">
              <Check size={12} className="fill-white" />
              Verified
            </div>
          )}
        </div>

        {/* Image Count Badge */}
        {(() => {
          const validImages = getValidImageUrls(property.images);
          if (validImages.length > 1) {
            return (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium">
                {validImages.length} photos
              </div>
            );
          }
          return null;
        })()}

        {/* View/Inquiry Stats Overlay */}
        <div className="absolute bottom-3 left-3 flex gap-3 text-white text-xs font-medium">
          {(property.views_count > 0 || property.inquiries_count > 0) && (
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <Eye size={12} />
              {property.views_count || 0}
            </div>
          )}
          {property.inquiries_count > 0 && (
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
              <MessageSquare size={12} />
              {property.inquiries_count}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors min-h-[3.5rem]">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <MapPin size={14} className="mr-1 text-blue-600 flex-shrink-0" />
          <span className="truncate">
            {property.area ? `${property.area}, ` : ''}
            {property.district}
          </span>
        </div>

        {/* Tags */}
        <div className="flex items-center flex-wrap gap-2 mb-4">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
            {getPropertyTypeLabel(property.property_type)}
          </span>
          {property.has_title_deed && (
            <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Check size={12} />
              Title Deed
            </span>
          )}
        </div>

        {/* Property Details */}
        {(property.bedrooms > 0 || property.bathrooms > 0 || property.plot_size) && (
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 text-sm text-gray-600">
            {property.bedrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bed size={18} className="text-blue-600" />
                <span className="font-medium">{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center gap-1.5">
                <Bath size={18} className="text-blue-600" />
                <span className="font-medium">{property.bathrooms}</span>
              </div>
            )}
            {property.plot_size && (
              <div className="flex items-center gap-1.5">
                <Maximize size={18} className="text-blue-600" />
                <span className="font-medium">{property.plot_size.toLocaleString()}m²</span>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(property.price, property.currency)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {property.status === 'available' && 'Available Now'}
              {property.status === 'pending' && 'Pending'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
