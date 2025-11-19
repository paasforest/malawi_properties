'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, MapPin, Building2, Users, DollarSign, Clock, 
  Search, BarChart3, Eye, Target, Calendar, Smartphone, Monitor 
} from 'lucide-react';

interface AnalyticsData {
  totalProperties: number;
  totalInquiries: number;
  totalViews: number;
  totalSearches: number;
  totalSessions: number;
  averageTimeToSale: number;
  topDistricts: { district: string; count: number }[];
  propertyTypeDistribution: { type: string; count: number }[];
  diasporaPercentage: number;
  recentInquiries: any[];
  hotProperties: any[];
  // New deep insights
  searchIntelligence: {
    topSearches: { search: string; count: number; conversionRate: number }[];
    districtSearches: { district: string; count: number }[];
    priceRangeSearches: { range: string; count: number }[];
    searchToViewRate: number;
    searchToInquiryRate: number;
  };
  userJourney: {
    averageViewsPerSession: number;
    averageSearchesPerSession: number;
    averageInquiriesPerSession: number;
    conversionFunnel: {
      searches: number;
      views: number;
      detailViews: number;
      inquiries: number;
    };
    averageSessionDuration: number;
  };
  timeBasedAnalytics: {
    hourlyViews: { hour: number; count: number }[];
    dailyViews: { day: string; count: number }[];
    hourlyInquiries: { hour: number; count: number }[];
    dailyInquiries: { day: string; count: number }[];
  };
  deviceAnalytics: {
    mobilePercentage: number;
    desktopPercentage: number;
    mobileViews: number;
    desktopViews: number;
  };
}

export function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalProperties: 0,
    totalInquiries: 0,
    totalViews: 0,
    totalSearches: 0,
    totalSessions: 0,
    averageTimeToSale: 0,
    topDistricts: [],
    propertyTypeDistribution: [],
    diasporaPercentage: 0,
    recentInquiries: [],
    hotProperties: [],
    searchIntelligence: {
      topSearches: [],
      districtSearches: [],
      priceRangeSearches: [],
      searchToViewRate: 0,
      searchToInquiryRate: 0,
    },
    userJourney: {
      averageViewsPerSession: 0,
      averageSearchesPerSession: 0,
      averageInquiriesPerSession: 0,
      conversionFunnel: {
        searches: 0,
        views: 0,
        detailViews: 0,
        inquiries: 0,
      },
      averageSessionDuration: 0,
    },
    timeBasedAnalytics: {
      hourlyViews: [],
      dailyViews: [],
      hourlyInquiries: [],
      dailyInquiries: [],
    },
    deviceAnalytics: {
      mobilePercentage: 0,
      desktopPercentage: 0,
      mobileViews: 0,
      desktopViews: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      // Load all data in parallel
      const [
        { data: properties },
        { data: inquiries },
        { data: views },
        { data: searchQueries },
        { data: sessions },
      ] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('inquiries').select('*, profiles(is_diaspora, current_location)'),
        supabase.from('property_views').select('*'),
        supabase.from('search_queries').select('*'),
        supabase.from('user_sessions').select('*'),
      ]);

      const totalProperties = properties?.length || 0;
      const totalInquiries = inquiries?.length || 0;
      const totalViews = views?.length || 0;
      const totalSearches = searchQueries?.length || 0;
      const totalSessions = sessions?.length || 0;

      // Time to sale
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

      // Districts
      const districtCounts = properties?.reduce((acc: any, p) => {
        acc[p.district] = (acc[p.district] || 0) + 1;
        return acc;
      }, {});
      const topDistricts = Object.entries(districtCounts || {})
        .map(([district, count]) => ({ district, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Property types
      const typeCounts = properties?.reduce((acc: any, p) => {
        acc[p.property_type] = (acc[p.property_type] || 0) + 1;
        return acc;
      }, {});
      const propertyTypeDistribution = Object.entries(typeCounts || {}).map(
        ([type, count]) => ({ type, count: count as number })
      );

      // Diaspora percentage
      const diasporaInquiries = inquiries?.filter((i: any) => i.profiles?.is_diaspora) || [];
      const diasporaPercentage =
        totalInquiries > 0 ? (diasporaInquiries.length / totalInquiries) * 100 : 0;

      // Hot properties
      const hotProperties = (properties || [])
        .sort((a, b) => b.inquiries_count - a.inquiries_count)
        .slice(0, 5);

      // Search Intelligence
      const topSearchesMap = new Map<string, { count: number; conversions: number }>();
      const districtSearchesMap = new Map<string, number>();
      const priceRangeSearchesMap = new Map<string, number>();

      searchQueries?.forEach((sq: any) => {
        // Top searches by text
        if (sq.search_text) {
          const searchText = sq.search_text.toLowerCase();
          const existing = topSearchesMap.get(searchText) || { count: 0, conversions: 0 };
          existing.count++;
          if (sq.converted_to_inquiry) existing.conversions++;
          topSearchesMap.set(searchText, existing);
        }

        // District searches
        const district = sq.search_params?.district;
        if (district) {
          districtSearchesMap.set(
            district,
            (districtSearchesMap.get(district) || 0) + 1
          );
        }

        // Price range searches
        const minPrice = sq.search_params?.minPrice || sq.search_params?.min_price;
        const maxPrice = sq.search_params?.maxPrice || sq.search_params?.max_price;
        if (minPrice || maxPrice) {
          const min = minPrice || '0';
          const max = maxPrice || '∞';
          const range = `${min} - ${max}`;
          priceRangeSearchesMap.set(range, (priceRangeSearchesMap.get(range) || 0) + 1);
        }
      });

      const topSearches = Array.from(topSearchesMap.entries())
        .map(([search, data]) => ({
          search,
          count: data.count,
          conversionRate: data.count > 0 ? (data.conversions / data.count) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const districtSearches = Array.from(districtSearchesMap.entries())
        .map(([district, count]) => ({ district, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const priceRangeSearches = Array.from(priceRangeSearchesMap.entries())
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Search conversion rates
      const searchesWithViews = searchQueries?.filter((sq: any) => 
        sq.viewed_property_ids && sq.viewed_property_ids.length > 0
      ) || [];
      const searchesWithInquiries = searchQueries?.filter((sq: any) => 
        sq.converted_to_inquiry
      ) || [];

      const searchToViewRate = totalSearches > 0 
        ? (searchesWithViews.length / totalSearches) * 100 
        : 0;
      const searchToInquiryRate = totalSearches > 0 
        ? (searchesWithInquiries.length / totalSearches) * 100 
        : 0;

      // User Journey
      const sessionsWithData = sessions?.filter((s: any) => 
        s.conversion_funnel && Object.keys(s.conversion_funnel).length > 0
      ) || [];

      const totalFunnel = sessionsWithData.reduce((acc: any, s: any) => {
        const funnel = s.conversion_funnel || {};
        return {
          searches: (acc.searches || 0) + (funnel.searches || 0),
          views: (acc.views || 0) + (funnel.views || 0),
          detailViews: (acc.detailViews || 0) + (funnel.detail_views || 0),
          inquiries: (acc.inquiries || 0) + (funnel.inquiries || 0),
        };
      }, { searches: 0, views: 0, detailViews: 0, inquiries: 0 });

      const averageViewsPerSession = totalSessions > 0 
        ? (totalViews / totalSessions) 
        : 0;
      const averageSearchesPerSession = totalSessions > 0 
        ? (totalSearches / totalSessions) 
        : 0;
      const averageInquiriesPerSession = totalSessions > 0 
        ? (totalInquiries / totalSessions) 
        : 0;

      const sessionsWithDuration = sessions?.filter((s: any) => 
        s.duration_seconds > 0
      ) || [];
      const averageSessionDuration = sessionsWithDuration.length > 0
        ? sessionsWithDuration.reduce((sum: number, s: any) => sum + s.duration_seconds, 0) / sessionsWithDuration.length
        : 0;

      // Time-Based Analytics
      const hourlyViewsMap = new Map<number, number>();
      const dailyViewsMap = new Map<string, number>();
      const hourlyInquiriesMap = new Map<number, number>();
      const dailyInquiriesMap = new Map<string, number>();

      views?.forEach((v: any) => {
        const date = new Date(v.viewed_at || v.created_at);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });

        hourlyViewsMap.set(hour, (hourlyViewsMap.get(hour) || 0) + 1);
        dailyViewsMap.set(day, (dailyViewsMap.get(day) || 0) + 1);
      });

      inquiries?.forEach((i: any) => {
        const date = new Date(i.created_at);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });

        hourlyInquiriesMap.set(hour, (hourlyInquiriesMap.get(hour) || 0) + 1);
        dailyInquiriesMap.set(day, (dailyInquiriesMap.get(day) || 0) + 1);
      });

      const hourlyViews = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyViewsMap.get(i) || 0,
      }));

      const dailyViews = Array.from(dailyViewsMap.entries()).map(([day, count]) => ({
        day,
        count,
      }));

      const hourlyInquiries = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: hourlyInquiriesMap.get(i) || 0,
      }));

      const dailyInquiries = Array.from(dailyInquiriesMap.entries()).map(([day, count]) => ({
        day,
        count,
      }));

      // Device Analytics
      const mobileViews = views?.filter((v: any) => v.device_type === 'mobile').length || 0;
      const desktopViews = views?.filter((v: any) => v.device_type === 'desktop').length || 0;
      const mobilePercentage = totalViews > 0 ? (mobileViews / totalViews) * 100 : 0;
      const desktopPercentage = totalViews > 0 ? (desktopViews / totalViews) * 100 : 0;

      setData({
        totalProperties,
        totalInquiries,
        totalViews,
        totalSearches,
        totalSessions,
        averageTimeToSale: Math.round(avgTime),
        topDistricts,
        propertyTypeDistribution,
        diasporaPercentage,
        recentInquiries: inquiries?.slice(0, 10) || [],
        hotProperties,
        searchIntelligence: {
          topSearches,
          districtSearches,
          priceRangeSearches,
          searchToViewRate,
          searchToInquiryRate,
        },
        userJourney: {
          averageViewsPerSession: Math.round(averageViewsPerSession * 10) / 10,
          averageSearchesPerSession: Math.round(averageSearchesPerSession * 10) / 10,
          averageInquiriesPerSession: Math.round(averageInquiriesPerSession * 10) / 10,
          conversionFunnel: totalFunnel,
          averageSessionDuration: Math.round(averageSessionDuration),
        },
        timeBasedAnalytics: {
          hourlyViews,
          dailyViews,
          hourlyInquiries,
          dailyInquiries,
        },
        deviceAnalytics: {
          mobilePercentage,
          desktopPercentage,
          mobileViews,
          desktopViews,
        },
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
          <p className="text-gray-600 mt-1">Deep insights into Malawi property market</p>
        </div>

        {/* Key Metrics */}
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
              <span className="text-gray-600">Total Searches</span>
              <Search className="text-purple-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.totalSearches}</div>
            <div className="text-sm text-gray-500 mt-1">
              {data.searchIntelligence.searchToViewRate.toFixed(1)}% → View, {data.searchIntelligence.searchToInquiryRate.toFixed(1)}% → Inquiry
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Sessions</span>
              <Users className="text-green-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.totalSessions}</div>
            <div className="text-sm text-gray-500 mt-1">
              {data.userJourney.averageViewsPerSession.toFixed(1)} views/session
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total Inquiries</span>
              <Target className="text-orange-600" size={24} />
            </div>
            <div className="text-4xl font-bold text-gray-900">{data.totalInquiries}</div>
            <div className="text-sm text-gray-500 mt-1">
              {data.userJourney.averageInquiriesPerSession.toFixed(2)} inquiries/session
            </div>
          </div>
        </div>

        {/* Search Intelligence */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Search className="text-purple-600" size={24} />
            Search Intelligence
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Top Searches</h3>
              <div className="space-y-2">
                {data.searchIntelligence.topSearches.slice(0, 5).map((search, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700 truncate flex-1">{search.search}</span>
                    <div className="ml-2 text-right">
                      <div className="text-xs font-semibold text-gray-900">{search.count}</div>
                      <div className="text-xs text-purple-600">{search.conversionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Top District Searches</h3>
              <div className="space-y-2">
                {data.searchIntelligence.districtSearches.slice(0, 5).map((district, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{district.district}</span>
                    <span className="text-sm font-semibold text-gray-900">{district.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Price Range Searches</h3>
              <div className="space-y-2">
                {data.searchIntelligence.priceRangeSearches.slice(0, 5).map((range, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{range.range}</span>
                    <span className="text-sm font-semibold text-gray-900">{range.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User Journey */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={24} />
            User Journey & Conversion Funnel
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Searches</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {data.userJourney.conversionFunnel.searches}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Views</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {data.userJourney.conversionFunnel.views}
                  </span>
                  <span className="text-sm text-gray-500">
                    {data.userJourney.conversionFunnel.searches > 0
                      ? ((data.userJourney.conversionFunnel.views / data.userJourney.conversionFunnel.searches) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Detail Views</span>
                  <span className="text-2xl font-bold text-green-600">
                    {data.userJourney.conversionFunnel.detailViews}
                  </span>
                  <span className="text-sm text-gray-500">
                    {data.userJourney.conversionFunnel.views > 0
                      ? ((data.userJourney.conversionFunnel.detailViews / data.userJourney.conversionFunnel.views) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Inquiries</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {data.userJourney.conversionFunnel.inquiries}
                  </span>
                  <span className="text-sm text-gray-500">
                    {data.userJourney.conversionFunnel.detailViews > 0
                      ? ((data.userJourney.conversionFunnel.inquiries / data.userJourney.conversionFunnel.detailViews) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Session Metrics</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Average Views per Session</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {data.userJourney.averageViewsPerSession.toFixed(1)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Average Searches per Session</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {data.userJourney.averageSearchesPerSession.toFixed(1)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Average Session Duration</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.floor(data.userJourney.averageSessionDuration / 60)}m {data.userJourney.averageSessionDuration % 60}s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time-Based Analytics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="text-green-600" size={24} />
            Time-Based Analytics
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Views by Hour</h3>
              <div className="space-y-2">
                {data.timeBasedAnalytics.hourlyViews.map((item) => {
                  const maxCount = Math.max(...data.timeBasedAnalytics.hourlyViews.map((h) => h.count));
                  return (
                    <div key={item.hour} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-12">{item.hour}:00</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-blue-600 h-4 rounded-full"
                          style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-8">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Inquiries by Hour</h3>
              <div className="space-y-2">
                {data.timeBasedAnalytics.hourlyInquiries.map((item) => {
                  const maxCount = Math.max(...data.timeBasedAnalytics.hourlyInquiries.map((h) => h.count));
                  return (
                    <div key={item.hour} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-12">{item.hour}:00</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-orange-600 h-4 rounded-full"
                          style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-8">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Device Analytics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Smartphone className="text-indigo-600" size={24} />
            Device Analytics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="text-indigo-600" size={20} />
                <span className="font-semibold text-gray-900">Mobile</span>
              </div>
              <div className="text-3xl font-bold text-indigo-600">{data.deviceAnalytics.mobilePercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 mt-1">{data.deviceAnalytics.mobileViews} views</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="text-gray-600" size={20} />
                <span className="font-semibold text-gray-900">Desktop</span>
              </div>
              <div className="text-3xl font-bold text-gray-600">{data.deviceAnalytics.desktopPercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600 mt-1">{data.deviceAnalytics.desktopViews} views</div>
            </div>
          </div>
        </div>

        {/* Traditional Metrics */}
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

        {/* Diaspora Intelligence */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Diaspora Buyer Intelligence</h2>
          <div className="text-6xl font-bold mb-2">{data.diasporaPercentage.toFixed(1)}%</div>
          <p className="text-blue-100 text-lg">
            of all inquiries come from diaspora buyers
          </p>
        </div>
      </div>
    </div>
  );
}
