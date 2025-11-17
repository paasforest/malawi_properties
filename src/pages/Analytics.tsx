 'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, MapPin, Building2, Users, DollarSign, Clock } from 'lucide-react';

interface AnalyticsData {
  totalProperties: number;
  totalInquiries: number;
  totalViews: number;
  averageTimeToSale: number;
  topDistricts: { district: string; count: number }[];
  propertyTypeDistribution: { type: string; count: number }[];
  diasporaPercentage: number;
  recentInquiries: any[];
  hotProperties: any[];
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalProperties: 0,
    totalInquiries: 0,
    totalViews: 0,
    averageTimeToSale: 0,
    topDistricts: [],
    propertyTypeDistribution: [],
    diasporaPercentage: 0,
    recentInquiries: [],
    hotProperties: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: properties } = await supabase.from('properties').select('*');

      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('*, profiles(is_diaspora, current_location)');

      const { data: views } = await supabase.from('property_views').select('*');

      const totalProperties = properties?.length || 0;
      const totalInquiries = inquiries?.length || 0;
      const totalViews = views?.length || 0;

      const soldProperties = properties?.filter((p) => p.sold_at) || [];
      const avgTime =
        soldProperties.length > 0
          ? soldProperties.reduce((sum, p) => {
              const listDate = new Date(p.listed_at);
              const soldDate = new Date(p.sold_at!);
              const days = Math.floor(
                (soldDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / soldProperties.length
          : 0;

      const districtCounts = properties?.reduce((acc: any, p) => {
        acc[p.district] = (acc[p.district] || 0) + 1;
        return acc;
      }, {});

      const topDistricts = Object.entries(districtCounts || {})
        .map(([district, count]) => ({ district, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const typeCounts = properties?.reduce((acc: any, p) => {
        acc[p.property_type] = (acc[p.property_type] || 0) + 1;
        return acc;
      }, {});

      const propertyTypeDistribution = Object.entries(typeCounts || {}).map(
        ([type, count]) => ({ type, count: count as number })
      );

      const diasporaInquiries = inquiries?.filter((i: any) => i.profiles?.is_diaspora) || [];
      const diasporaPercentage =
        totalInquiries > 0 ? (diasporaInquiries.length / totalInquiries) * 100 : 0;

      const hotProperties = (properties || [])
        .sort((a, b) => b.inquiries_count - a.inquiries_count)
        .slice(0, 5);

      setData({
        totalProperties,
        totalInquiries,
        totalViews,
        averageTimeToSale: Math.round(avgTime),
        topDistricts,
        propertyTypeDistribution,
        diasporaPercentage,
        recentInquiries: inquiries?.slice(0, 10) || [],
        hotProperties,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Market Intelligence</h1>
          <p className="text-gray-600 mt-1">Real-time insights into Malawi property market</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Properties</span>
              <Building2 className="text-blue-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.totalProperties}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Inquiries</span>
              <Users className="text-green-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.totalInquiries}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Views</span>
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.totalViews}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Avg. Time to Sale</span>
              <Clock className="text-orange-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.averageTimeToSale}</div>
            <div className="text-sm text-gray-500">days</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin size={20} />
              Top Districts by Listings
            </h2>
            <div className="space-y-3">
              {data.topDistricts.map((district) => (
                <div key={district.district}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700 font-medium">{district.district}</span>
                    <span className="text-gray-900 font-bold">{district.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(district.count / data.totalProperties) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Property Type Distribution
            </h2>
            <div className="space-y-3">
              {data.propertyTypeDistribution.map((type) => (
                <div key={type.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700 font-medium capitalize">{type.type}</span>
                    <span className="text-gray-900 font-bold">{type.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(type.count / data.totalProperties) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Diaspora Buyer Intelligence</h2>
          <div className="text-6xl font-bold mb-2">{data.diasporaPercentage.toFixed(1)}%</div>
          <p className="text-blue-100 text-lg">
            of all inquiries come from diaspora buyers
          </p>
          <p className="text-blue-200 text-sm mt-4">
            This validates your strategy of targeting the Malawian diaspora as the primary buyer
            segment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hot Properties</h2>
            <p className="text-sm text-gray-600 mb-4">
              Properties with the most inquiries (demand indicators)
            </p>
            <div className="space-y-3">
              {data.hotProperties.map((property) => (
                <div key={property.id} className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-gray-900">{property.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <span>{property.district}</span>
                    <span>•</span>
                    <span>{property.inquiries_count} inquiries</span>
                    <span>•</span>
                    <span>{property.views_count} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Key Insights</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-1">Market Activity</h3>
                <p className="text-sm text-blue-800">
                  You have {data.totalProperties} properties generating {data.totalViews} views
                  and {data.totalInquiries} inquiries. This data is your competitive advantage.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-1">Diaspora Dominance</h3>
                <p className="text-sm text-green-800">
                  {data.diasporaPercentage.toFixed(0)}% of buyers are diaspora. Your platform is
                  perfectly positioned as the diaspora real estate gateway.
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-1">Sales Velocity</h3>
                <p className="text-sm text-orange-800">
                  Average time to sale is {data.averageTimeToSale} days. This metric helps
                  developers and investors understand market liquidity.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-1">Data Intelligence Value</h3>
                <p className="text-sm text-purple-800">
                  This data can be packaged and sold to developers, banks, and government
                  agencies as market reports and insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
