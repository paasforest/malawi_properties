import { X, Trash2, ImagePlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadFileFromClient } from '../lib/storage';
import type { Property, Agent, PropertyType, PropertyStatus } from '../lib/supabase';

interface PropertyFormProps {
  agent: Agent | null;
  userId: string;
  property?: Property | null;
  onClose: () => void;
  onSuccess: (result?: { message?: string; property?: Property }) => void;
}

const MALAWI_DISTRICTS = [
  'Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Mangochi', 'Kasungu',
  'Salima', 'Nkhotakota', 'Dedza', 'Ntchisi', 'Dowa', 'Mchinji',
  'Karonga', 'Chitipa', 'Rumphi', 'Nkhata Bay', 'Likoma', 'Balaka',
  'Chiradzulu', 'Mulanje', 'Phalombe', 'Thyolo', 'Chikwawa', 'Nsanje',
  'Machinga', 'Mwanza', 'Neno', 'Ntcheu'
];

export function PropertyForm({ agent, userId, property, onClose, onSuccess }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'land' as PropertyType,
    district: '',
    area: '',
    price: '',
    currency: 'MWK',
    plot_size: '',
    plot_dimensions: '', // e.g., "23 by 25" or "23x25"
    bedrooms: '',
    bathrooms: '',
    has_title_deed: false,
    documentation_type: '',
    reason_for_selling: '',
    is_urgent_sale: false,
    status: 'available' as PropertyStatus,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (property) {
      setFormData({
        title: property.title,
        description: property.description || '',
        property_type: property.property_type,
        district: property.district,
        area: property.area || '',
        price: property.price.toString(),
        currency: property.currency,
        plot_size: property.plot_size?.toString() || '',
        plot_dimensions: '', // Will be calculated if needed
        bedrooms: property.bedrooms.toString(),
        bathrooms: property.bathrooms.toString(),
        has_title_deed: property.has_title_deed,
        documentation_type: property.documentation_type || '',
        reason_for_selling: property.reason_for_selling || '',
        is_urgent_sale: property.is_urgent_sale,
        status: property.status,
      });
      setExistingImages(property.images || []);
    }
  }, [property]);

  useEffect(() => {
    return () => {
      // Clean up object URLs
      newImagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [newImagePreviews]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const files = Array.from(event.target.files || []);
    if (!files.length) {
      setNewImages([]);
      setNewImagePreviews((prev) => {
        prev.forEach((url) => URL.revokeObjectURL(url));
        return [];
      });
      return;
    }

    const maxFiles = 10;
    const maxSizeMb = 5;

    if (files.length + existingImages.length > maxFiles) {
      setImageError(`Please upload up to ${maxFiles} images in total.`);
      return;
    }

    const oversizedFile = files.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (oversizedFile) {
      setImageError(`"${oversizedFile.name}" is too large. Max size is ${maxSizeMb}MB per image.`);
      return;
    }

    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImages(files);
    setNewImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return previews;
    });
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return updated;
    });
  };

  // Parse dimensions like "23 by 25" or "23x25" and calculate square meters
  const parseDimensions = (dimensions: string): number | null => {
    if (!dimensions || !dimensions.trim()) return null;
    
    // Remove extra spaces and convert to lowercase
    const clean = dimensions.trim().toLowerCase();
    
    // Try "by" format: "23 by 25" or "23 by 25 meters"
    const byMatch = clean.match(/(\d+(?:\.\d+)?)\s*by\s*(\d+(?:\.\d+)?)/);
    if (byMatch) {
      const width = parseFloat(byMatch[1]);
      const length = parseFloat(byMatch[2]);
      if (!isNaN(width) && !isNaN(length) && width > 0 && length > 0) {
        return Math.round(width * length * 100) / 100; // Round to 2 decimal places
      }
    }
    
    // Try "x" format: "23x25" or "23 x 25"
    const xMatch = clean.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
    if (xMatch) {
      const width = parseFloat(xMatch[1]);
      const length = parseFloat(xMatch[2]);
      if (!isNaN(width) && !isNaN(length) && width > 0 && length > 0) {
        return Math.round(width * length * 100) / 100;
      }
    }
    
    return null;
  };

  const handleDimensionsChange = (value: string) => {
    const calculatedSize = parseDimensions(value);
    if (calculatedSize !== null) {
      setFormData(prev => ({ ...prev, plot_dimensions: value, plot_size: calculatedSize.toString() }));
    } else if (!value.trim()) {
      setFormData(prev => ({ ...prev, plot_dimensions: value, plot_size: '' }));
    } else {
      setFormData(prev => ({ ...prev, plot_dimensions: value }));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    if (!newImages.length) {
      console.log('📸 No new images to upload');
      return [];
    }

    console.log(`📸 Uploading ${newImages.length} image(s) to Hetzner Storage...`);
    const uploadedUrls: string[] = [];

    for (const image of newImages) {
      const fileExt = image.name.split('.').pop() || 'jpg';
      const filePath = `property-${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log(`  Uploading: ${image.name} -> ${filePath}`);

      try {
        const publicUrl = await uploadFileFromClient(image, filePath);
        console.log(`  ✅ Uploaded: ${publicUrl}`);
        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error(`  ❌ Upload failed for ${image.name}:`, error);
        throw new Error(`Failed to upload ${image.name}: ${error.message || 'Unknown error'}`);
      }
    }

    console.log(`✅ All images uploaded: ${uploadedUrls.length} URL(s)`);
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const uploadedImageUrls = await uploadImages();
      const combinedImages = [...existingImages, ...uploadedImageUrls];

      let savedProperty: Property | null = null;

      const propertyData = {
        title: formData.title,
        description: formData.description || null,
        property_type: formData.property_type,
        district: formData.district,
        area: formData.area || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        plot_size: formData.plot_size ? parseFloat(formData.plot_size) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : 0,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : 0,
        has_title_deed: formData.has_title_deed,
        documentation_type: formData.documentation_type || null,
        reason_for_selling: formData.reason_for_selling || null,
        is_urgent_sale: formData.is_urgent_sale,
        status: formData.status,
        images: combinedImages.length > 0 ? combinedImages : [],
        agent_id: agent?.id || null,
        owner_id: agent ? null : userId,
      };

      console.log('💾 Saving property data:', {
        title: propertyData.title,
        status: propertyData.status,
        imagesCount: propertyData.images.length,
        images: propertyData.images,
        agent_id: propertyData.agent_id,
        owner_id: propertyData.owner_id,
      });

      if (property) {
        const { data: updatedProperty, error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', property.id)
          .select('*')
          .single();

        if (updateError) throw updateError;
        savedProperty = updatedProperty as Property;
        setExistingImages(combinedImages);
      } else {
        const { data: insertedProperty, error: insertError } = await supabase
          .from('properties')
          .insert(propertyData)
          .select('*')
          .single();

        if (insertError) throw insertError;

        savedProperty = insertedProperty as Property;

        if (agent) {
          await supabase
            .from('agents')
            .update({ total_listings: agent.total_listings + 1 })
            .eq('id', agent.id);
        }
      }

      setNewImages([]);
      setNewImagePreviews((prev) => {
        prev.forEach((preview) => URL.revokeObjectURL(preview));
        return [];
      });

      const successMessage = property
        ? 'Property updated successfully!'
        : 'Property added successfully!';

      console.log('✅ Property saved successfully:', {
        id: savedProperty?.id,
        title: savedProperty?.title,
        status: savedProperty?.status,
        imagesCount: savedProperty?.images?.length || 0,
        images: savedProperty?.images,
      });

      onSuccess({
        message: successMessage,
        property: savedProperty || undefined,
      });
    } catch (err: any) {
      console.error('❌ Error saving property:', err);
      setError(err.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {property ? 'Edit Property' : 'Add New Property'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Photos
              </label>
              <div className="flex flex-col gap-3">
                <label className="w-full cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors">
                  <ImagePlus size={20} />
                  <span className="text-sm font-medium">
                    Click to upload (PNG, JPG up to 5MB each)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  You can upload up to 10 images. The first photo will be used as the cover image.
                </p>
                {imageError && (
                  <p className="text-sm text-red-600">{imageError}</p>
                )}
              </div>

              {(existingImages.length > 0 || newImagePreviews.length > 0) && (
                <div className="mt-4 space-y-4">
                  {existingImages.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-gray-500 mb-2">Existing Images</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {existingImages.map((url, index) => (
                          <div key={url} className="relative group rounded-lg overflow-hidden border border-gray-200">
                            <img src={url} alt={`Property image ${index + 1}`} className="w-full h-32 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingImage(index)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newImagePreviews.length > 0 && (
                    <div>
                      <p className="text-xs uppercase text-gray-500 mb-2">New Images</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {newImagePreviews.map((preview, index) => (
                          <div key={preview} className="relative group rounded-lg overflow-hidden border border-gray-200">
                            <img src={preview} alt={`New property image ${index + 1}`} className="w-full h-32 object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(index)}
                              className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Remove image"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., 3 Bedroom House in Area 47"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe the property..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Type *
              </label>
              <select
                required
                value={formData.property_type}
                onChange={(e) => setFormData({ ...formData, property_type: e.target.value as PropertyType })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="land">Land</option>
                <option value="house">House</option>
                <option value="rental">Rental</option>
                <option value="commercial">Commercial</option>
                <option value="mixed">Mixed Use</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <select
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select district</option>
                {MALAWI_DISTRICTS.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specific Area
              </label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Area 47, Sector 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency *
              </label>
              <select
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MWK">MWK</option>
                <option value="USD">USD</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Dimensions (meters)
              </label>
              <input
                type="text"
                value={formData.plot_dimensions}
                onChange={(e) => handleDimensionsChange(e.target.value)}
                placeholder="e.g., 23 by 25 or 23x25"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter dimensions like "23 by 25" or "23x25" (automatically calculates area)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plot Size (m²) <span className="text-gray-400 text-xs">(calculated automatically)</span>
              </label>
              <input
                type="number"
                value={formData.plot_size}
                onChange={(e) => setFormData({ ...formData, plot_size: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                readOnly={!!formData.plot_dimensions}
                title={formData.plot_dimensions ? "Calculated from dimensions above" : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms
              </label>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms
              </label>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documentation Type
              </label>
              <input
                type="text"
                value={formData.documentation_type}
                onChange={(e) => setFormData({ ...formData, documentation_type: e.target.value })}
                placeholder="e.g., Title Deed, Lease Agreement"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Selling (optional)
              </label>
              <input
                type="text"
                value={formData.reason_for_selling}
                onChange={(e) => setFormData({ ...formData, reason_for_selling: e.target.value })}
                placeholder="e.g., Relocation, Investment, Financial"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_title_deed"
                checked={formData.has_title_deed}
                onChange={(e) => setFormData({ ...formData, has_title_deed: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="has_title_deed" className="ml-2 text-sm text-gray-700">
                Has Title Deed
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_urgent_sale"
                checked={formData.is_urgent_sale}
                onChange={(e) => setFormData({ ...formData, is_urgent_sale: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_urgent_sale" className="ml-2 text-sm text-gray-700">
                Urgent Sale
              </label>
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
              {loading ? 'Saving...' : property ? 'Update Property' : 'Add Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
