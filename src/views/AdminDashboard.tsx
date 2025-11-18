'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Property, Agent, Inquiry } from '../lib/supabase';
import {
  Users, Building2, TrendingUp, Eye, MessageSquare, MapPin,
  DollarSign, Clock, Shield, AlertCircle, CheckCircle, XCircle,
  Download, RefreshCw, BarChart3, PieChart, Activity, Globe,
  HardDrive, Server, Zap, History, ExternalLink
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalAgents: number;
  totalProperties: number;
  totalInquiries: number;
  totalViews: number;
  totalSales: number;
  estimatedMarketValue: number; // Replaced totalRevenue
  diasporaPercentage: number;
  averageTimeToSale: number;
  inquiryRate: number; // Replaced conversionRate - inquiries per listing
  viewToInquiryRate: number; // Views to inquiries conversion
  activeUsers7d: number;
  activeUsers30d: number;
  mostActivePropertyType: string;
}

interface RecentActivity {
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAgents: 0,
    totalProperties: 0,
    totalInquiries: 0,
    totalViews: 0,
    totalSales: 0,
    estimatedMarketValue: 0,
    diasporaPercentage: 0,
    averageTimeToSale: 0,
    inquiryRate: 0,
    viewToInquiryRate: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    mostActivePropertyType: '',
  });
  const [buyerJourney, setBuyerJourney] = useState({ views: 0, inquiries: 0, estimatedDirectCalls: 0 });
  const [topPerformingProperties, setTopPerformingProperties] = useState<any[]>([]);
  const [needsAttentionProperties, setNeedsAttentionProperties] = useState<any[]>([]);
  const [realTimeActivity, setRealTimeActivity] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState({ apiResponseTime: 0, databaseConnected: true, errorRate: 0 });
  const [adminActivityLog, setAdminActivityLog] = useState<any[]>([]);
  const [trafficSources, setTrafficSources] = useState<any[]>([]);
  const [inquiryFunnel, setInquiryFunnel] = useState({ views: 0, inquiries: 0, visits: 0, sales: 0 });
  const [performanceTrends, setPerformanceTrends] = useState<any[]>([]);
  const [buyerSegmentComparison, setBuyerSegmentComparison] = useState({
    diaspora: { count: 0, avgBudget: 0, topDistricts: [] as any[] },
    local: { count: 0, avgBudget: 0, topCities: [] as any[], topDistricts: [] as any[] },
  });
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [districtData, setDistrictData] = useState<any[]>([]);
  const [propertyTypeData, setPropertyTypeData] = useState<any[]>([]);
  const [diasporaData, setDiasporaData] = useState<any[]>([]);
  const [plotPriceData, setPlotPriceData] = useState<any[]>([]);
  const [commonPlotSizes, setCommonPlotSizes] = useState<any[]>([]);
  const [plotSizeDistribution, setPlotSizeDistribution] = useState<any[]>([]);
  const [diasporaPlotPreferences, setDiasporaPlotPreferences] = useState<any[]>([]);
  const [plotPriceTrends, setPlotPriceTrends] = useState<any[]>([]);
  const [plotSizeDemand, setPlotSizeDemand] = useState<any[]>([]);
  const [hasLandProperties, setHasLandProperties] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.user_type !== 'admin') {
        alert('Access denied. Admin privileges required.');
        window.location.href = '/admin/login';
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      window.location.href = '/admin/login';
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [
        { data: profiles },
        { data: agents },
        { data: properties },
        { data: inquiries },
        { data: views },
        { data: propertyViews },
        { data: allPropertyViews }
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('agents').select('*'),
        supabase.from('properties').select('*'),
        supabase.from('inquiries').select('*, profiles(is_diaspora, current_location), properties(title, district)'),
        supabase.from('property_views').select('*'),
        supabase.from('property_views').select('viewer_location, properties(district)'),
        supabase.from('property_views').select('property_id, viewed_at')
      ]);

      // Calculate Stats
      const totalUsers = profiles?.length || 0;
      const totalAgents = agents?.length || 0;
      const totalProperties = properties?.length || 0;
      const totalInquiries = inquiries?.length || 0;
      const totalViews = propertyViews?.length || 0;

      const soldProperties = properties?.filter((p) => p.status === 'sold') || [];
      const totalSales = soldProperties.length;

      // Calculate Estimated Market Value (sum of all active listings)
      const activeProperties = properties?.filter((p) => p.status === 'available' || p.status === 'pending') || [];
      const estimatedMarketValue = activeProperties.reduce((sum, p) => sum + Number(p.price || 0), 0);

      // Enhanced buyer segmentation: Diaspora vs Local
      const diasporaInquiries = inquiries?.filter((i: any) => 
        i.buyer_origin_type === 'diaspora' || 
        i.profiles?.is_diaspora || 
        (i.buyer_country && i.buyer_country.toLowerCase() !== 'malawi')
      ) || [];
      
      const localInquiries = inquiries?.filter((i: any) => 
        i.buyer_origin_type === 'local' || 
        (i.buyer_country && i.buyer_country.toLowerCase() === 'malawi')
      ) || [];

      const diasporaPercentage = totalInquiries > 0 
        ? (diasporaInquiries.length / totalInquiries) * 100 
        : 0;

      // Local buyer analytics
      const localBuyerCities = localInquiries.reduce((acc: any, i: any) => {
        const city = i.local_origin_city || i.buyer_city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {});

      const topLocalCities = Object.entries(localBuyerCities)
        .map(([city, count]: [string, any]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Buyer Segment Comparison Analytics
      const diasporaBudgets = diasporaInquiries
        .filter((i: any) => i.budget_range)
        .map((i: any) => {
          // Extract numeric value from budget range (e.g., "MK 20M-30M" -> 25M)
          const match = i.budget_range.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(b => b > 0);

      const localBudgets = localInquiries
        .filter((i: any) => i.budget_range)
        .map((i: any) => {
          const match = i.budget_range.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(b => b > 0);

      const diasporaAvgBudget = diasporaBudgets.length > 0
        ? diasporaBudgets.reduce((a, b) => a + b, 0) / diasporaBudgets.length
        : 0;

      const localAvgBudget = localBudgets.length > 0
        ? localBudgets.reduce((a, b) => a + b, 0) / localBudgets.length
        : 0;

      // Top districts by segment
      const diasporaDistricts = diasporaInquiries.reduce((acc: any, i: any) => {
        const district = i.properties?.district || 'Unknown';
        acc[district] = (acc[district] || 0) + 1;
        return acc;
      }, {});

      const localDistricts = localInquiries.reduce((acc: any, i: any) => {
        const district = i.properties?.district || 'Unknown';
        acc[district] = (acc[district] || 0) + 1;
        return acc;
      }, {});

      setBuyerSegmentComparison({
        diaspora: {
          count: diasporaInquiries.length,
          avgBudget: Math.round(diasporaAvgBudget),
          topDistricts: Object.entries(diasporaDistricts)
            .map(([district, count]: [string, any]) => ({ district, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
        },
        local: {
          count: localInquiries.length,
          avgBudget: Math.round(localAvgBudget),
          topCities: topLocalCities,
          topDistricts: Object.entries(localDistricts)
            .map(([district, count]: [string, any]) => ({ district, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5),
        },
      });

      // Calculate average time to sale
      const soldWithDates = soldProperties.filter((p) => p.sold_at && p.listed_at);
      const avgTimeToSale = soldWithDates.length > 0
        ? soldWithDates.reduce((sum, p) => {
            const listDate = new Date(p.listed_at);
            const soldDate = new Date(p.sold_at!);
            const days = Math.floor((soldDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / soldWithDates.length
        : 0;

      // Inquiry Rate per Listing (replaces conversion rate)
      const inquiryRate = totalProperties > 0 
        ? (totalInquiries / totalProperties) * 100 
        : 0;

      // View to Inquiry Rate
      const viewToInquiryRate = totalViews > 0
        ? (totalInquiries / totalViews) * 100
        : 0;

      // Active Users (last 7 and 30 days)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const activeUsers7d = profiles?.filter((p) => new Date(p.last_login || p.created_at) >= sevenDaysAgo).length || 0;
      const activeUsers30d = profiles?.filter((p) => new Date(p.last_login || p.created_at) >= thirtyDaysAgo).length || 0;

      // Most Active Property Type
      const mostActiveTypeCounts = properties?.reduce((acc: any, p) => {
        acc[p.property_type] = (acc[p.property_type] || 0) + 1;
        return acc;
      }, {}) || {};
      const mostActivePropertyType = Object.entries(mostActiveTypeCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

      setStats({
        totalUsers,
        totalAgents,
        totalProperties,
        totalInquiries,
        totalViews,
        totalSales,
        estimatedMarketValue,
        diasporaPercentage,
        averageTimeToSale: Math.round(avgTimeToSale),
        inquiryRate: Math.round(inquiryRate * 100) / 100,
        viewToInquiryRate: Math.round(viewToInquiryRate * 100) / 100,
        activeUsers7d,
        activeUsers30d,
        mostActivePropertyType,
      });

      // Buyer Journey Tracking
      const estimatedDirectCalls = Math.round(totalInquiries * 0.3); // Estimate 30% of inquiries lead to direct calls
      setBuyerJourney({
        views: totalViews,
        inquiries: totalInquiries,
        estimatedDirectCalls,
      });

      // Top Performing Properties
      const topPerformers = (properties || [])
        .map((p) => ({
          ...p,
          performanceScore: (p.views_count || 0) + (p.inquiries_count || 0) * 2, // Weight inquiries more
        }))
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 10);
      setTopPerformingProperties(topPerformers);

      // Properties Needing Attention (no views in 30 days)
      const needsAttention = (properties || [])
        .filter((p) => {
          if ((p.views_count || 0) === 0) return true;
          const lastView = allPropertyViews?.filter((v: any) => v.property_id === p.id)
            .sort((a: any, b: any) => new Date(b.viewed_at || 0).getTime() - new Date(a.viewed_at || 0).getTime())[0];
          if (!lastView || !lastView.viewed_at) return true;
          return new Date(lastView.viewed_at) < thirtyDaysAgo;
        })
        .slice(0, 10);
      setNeedsAttentionProperties(needsAttention);

      // Real-Time Activity (last 24 hours)
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentActivity = [
        ...(properties || []).filter((p) => new Date(p.created_at) >= last24Hours).map((p) => ({
          type: 'property_listed',
          description: `New property: ${p.title}`,
          timestamp: p.created_at,
          user: 'Agent/Owner',
        })),
        ...(inquiries || []).filter((i: any) => new Date(i.created_at) >= last24Hours).map((i: any) => ({
          type: 'inquiry',
          description: `New inquiry for ${i.properties?.title || 'property'}`,
          timestamp: i.created_at,
          user: 'Buyer',
        })),
        ...(profiles || []).filter((p) => new Date(p.created_at) >= last24Hours).map((p) => ({
          type: 'user_signup',
          description: `New user: ${p.full_name || p.email}`,
          timestamp: p.created_at,
          user: p.full_name || p.email,
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
      setRealTimeActivity(recentActivity);

      // System Health Check
      const healthStartTime = performance.now();
      try {
        const { error: healthCheckError } = await supabase.from('profiles').select('id').limit(1);
        const healthEndTime = performance.now();
        setSystemHealth({
          apiResponseTime: Math.round(healthEndTime - healthStartTime),
          databaseConnected: !healthCheckError,
          errorRate: 0, // Could calculate from error logs if available
        });
      } catch (error) {
        setSystemHealth({
          apiResponseTime: 0,
          databaseConnected: false,
          errorRate: 100,
        });
      }

      // Load Admin Activity Log
      const { data: activityLog } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setAdminActivityLog(activityLog || []);

      // Load Traffic Sources Analytics
      const { data: traffic } = await supabase
        .from('traffic_sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      const sourceCounts = (traffic || []).reduce((acc: any, t) => {
        const key = t.source || 'direct';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      
      const trafficAnalytics = Object.entries(sourceCounts)
        .map(([source, count]: [string, any]) => ({
          source,
          count,
          percentage: ((count / (traffic?.length || 1)) * 100).toFixed(1),
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);
      setTrafficSources(trafficAnalytics);

      // Inquiry Conversion Funnel
      const estimatedVisits = Math.round(totalInquiries * 0.2); // Estimate 20% of inquiries lead to visits
      const estimatedSales = totalSales;
      setInquiryFunnel({
        views: totalViews,
        inquiries: totalInquiries,
        visits: estimatedVisits,
        sales: estimatedSales,
      });

      // Performance Trends (last 12 weeks)
      const weeklyTrends: any = {};
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000);
      
      (properties || []).filter((p) => new Date(p.created_at) >= twelveWeeksAgo).forEach((p) => {
        const weekStart = new Date(p.created_at);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyTrends[weekKey]) {
          weeklyTrends[weekKey] = { properties: 0, inquiries: 0, sales: 0, views: 0 };
        }
        weeklyTrends[weekKey].properties++;
        weeklyTrends[weekKey].views += p.views_count || 0;
        weeklyTrends[weekKey].inquiries += p.inquiries_count || 0;
        if (p.status === 'sold') weeklyTrends[weekKey].sales++;
      });

      const weeklyPerformanceTrends = Object.entries(weeklyTrends)
        .map(([week, data]: [string, any]) => ({
          week,
          properties: data.properties,
          inquiries: data.inquiries,
          sales: data.sales,
          views: data.views,
        }))
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-12);
      setPerformanceTrends(weeklyPerformanceTrends);

      // Recent Properties
      const recentProps = (properties || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setRecentProperties(recentProps);

      // Recent Inquiries
      const recentInq = (inquiries || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setRecentInquiries(recentInq);

      // Recent Users
      const recentUsr = (profiles || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
      setRecentUsers(recentUsr);

      // Pending Verifications
      const pendingAgents = (agents || [])
        .filter((a) => a.verification_status === 'pending');
      setPendingVerifications(pendingAgents);

      // District Analytics (including sales data)
      const districtCounts = properties?.reduce((acc: any, p) => {
        if (!acc[p.district]) {
          acc[p.district] = {
            listings: 0,
            sold: 0,
            totalSaleValue: 0,
            avgSalePrice: 0,
            localBuyers: 0,
            diasporaBuyers: 0,
          };
        }
        acc[p.district].listings++;
        if (p.status === 'sold') {
          acc[p.district].sold++;
          if (p.sale_price) {
            acc[p.district].totalSaleValue += Number(p.sale_price);
          }
          if (p.buyer_type === 'local') acc[p.district].localBuyers++;
          if (p.buyer_type === 'diaspora') acc[p.district].diasporaBuyers++;
        }
        return acc;
      }, {}) || {};

      const districtAnalytics = Object.entries(districtCounts)
        .map(([district, data]: [string, any]) => ({
          district,
          count: data.listings,
          listings: data.listings,
          sold: data.sold,
          totalSaleValue: data.totalSaleValue,
          avgSalePrice: data.sold > 0 && data.totalSaleValue > 0 
            ? Math.round(data.totalSaleValue / data.sold) 
            : 0,
          localBuyers: data.localBuyers,
          diasporaBuyers: data.diasporaBuyers,
          salesRate: data.listings > 0 ? Math.round((data.sold / data.listings) * 100) : 0,
          views: propertyViews?.filter((v: any) => v.properties?.district === district).length || 0,
          inquiries: inquiries?.filter((i: any) => i.properties?.district === district).length || 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setDistrictData(districtAnalytics);

      // Property Type Analytics
      const typeCounts = properties?.reduce((acc: any, p) => {
        acc[p.property_type] = (acc[p.property_type] || 0) + 1;
        return acc;
      }, {}) || {};

      const typeAnalytics = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type,
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count);

      setPropertyTypeData(typeAnalytics);

      // Diaspora Analytics
      const diasporaLocations = inquiries?.reduce((acc: any, i: any) => {
        if (i.profiles?.is_diaspora && i.profiles?.current_location) {
          const loc = i.profiles.current_location;
          acc[loc] = (acc[loc] || 0) + 1;
        }
        return acc;
      }, {}) || {};

      const diasporaAnalytics = Object.entries(diasporaLocations)
        .map(([location, count]) => ({
          location,
          count: count as number,
        }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);

      setDiasporaData(diasporaAnalytics);

      // Plot Intelligence Data
      const landProperties = properties?.filter((p) => p.property_type === 'land' && p.plot_size && p.plot_size > 0) || [];
      setHasLandProperties(landProperties.length > 0);

      // Helper function to categorize plot size
      const categorizePlotSize = (sqm: number) => {
        if (sqm < 400) return 'Small (<400sqm)';
        if (sqm >= 400 && sqm <= 500) return 'Standard (400-500sqm)';
        if (sqm > 500 && sqm <= 700) return 'Medium (500-700sqm)';
        if (sqm > 700 && sqm <= 1000) return 'Large (700-1000sqm)';
        return 'Extra Large (>1000sqm)';
      };

      // 1. Average Price Per Plot by District & Plot Size Category
      const priceByDistrictAndCategory: any = {};
      landProperties.forEach((p: any) => {
        const category = categorizePlotSize(p.plot_size);
        const key = `${p.district}|${category}`;
        if (!priceByDistrictAndCategory[key]) {
          priceByDistrictAndCategory[key] = {
            district: p.district,
            category,
            prices: [],
            plotSizes: [],
            views: [],
            inquiries: [],
          };
        }
        priceByDistrictAndCategory[key].prices.push(p.price);
        priceByDistrictAndCategory[key].plotSizes.push(p.plot_size);
        priceByDistrictAndCategory[key].views.push(p.views_count);
        priceByDistrictAndCategory[key].inquiries.push(p.inquiries_count);
      });

      const plotPriceAnalytics = Object.values(priceByDistrictAndCategory).map((item: any) => ({
        district: item.district,
        category: item.category,
        avgPrice: Math.round(item.prices.reduce((a: number, b: number) => a + b, 0) / item.prices.length),
        plotCount: item.prices.length,
        avgSize: Math.round(item.plotSizes.reduce((a: number, b: number) => a + b, 0) / item.plotSizes.length),
        totalViews: item.views.reduce((a: number, b: number) => a + b, 0),
        totalInquiries: item.inquiries.reduce((a: number, b: number) => a + b, 0),
      })).sort((a, b) => b.avgPrice - a.avgPrice);
      setPlotPriceData(plotPriceAnalytics);

      // 2. Most Common Plot Sizes per District
      const plotSizesByDistrict: any = {};
      landProperties.forEach((p: any) => {
        if (!plotSizesByDistrict[p.district]) {
          plotSizesByDistrict[p.district] = {};
        }
        const size = Math.round(p.plot_size);
        plotSizesByDistrict[p.district][size] = (plotSizesByDistrict[p.district][size] || 0) + 1;
      });

      const commonSizes = Object.entries(plotSizesByDistrict).map(([district, sizes]: [string, any]) => {
        const entries = Object.entries(sizes).map(([size, count]) => ({
          size: parseInt(size),
          count: count as number,
        })).sort((a, b) => b.count - a.count);

        const mostCommon = entries[0];
        const totalPlots = entries.reduce((sum, e) => sum + e.count, 0);
        const avgPrice = landProperties
          .filter((p: any) => p.district === district && Math.round(p.plot_size) === mostCommon.size)
          .reduce((sum: number, p: any) => sum + p.price, 0) / mostCommon.count;

        return {
          district,
          mostCommonSize: mostCommon.size,
          frequency: mostCommon.count,
          totalPlots,
          avgPrice: Math.round(avgPrice),
          percentage: Math.round((mostCommon.count / totalPlots) * 100),
        };
      }).sort((a, b) => b.frequency - a.frequency);
      setCommonPlotSizes(commonSizes);

      // 3. Plot Size Distribution
      const distribution: any = {
        'Small (<400sqm)': 0,
        'Standard (400-500sqm)': 0,
        'Medium (500-700sqm)': 0,
        'Large (700-1000sqm)': 0,
        'Extra Large (>1000sqm)': 0,
      };
      landProperties.forEach((p: any) => {
        const category = categorizePlotSize(p.plot_size);
        distribution[category] = (distribution[category] || 0) + 1;
      });
      setPlotSizeDistribution(Object.entries(distribution).map(([category, count]) => ({
        category,
        count: count as number,
      })));

      // 4. Diaspora Plot Preferences
      const diasporaPreferences: any = {};
      inquiries?.forEach((inq: any) => {
        if (inq.profiles?.is_diaspora && inq.profiles?.current_location) {
          const location = inq.profiles.current_location;
          const property = properties?.find((p: any) => p.id === inq.property_id);
          if (property && property.property_type === 'land' && property.plot_size) {
            const category = categorizePlotSize(property.plot_size);
            const key = `${location}|${category}`;
            if (!diasporaPreferences[key]) {
              diasporaPreferences[key] = {
                location,
                category,
                count: 0,
                avgPrice: 0,
                prices: [],
              };
            }
            diasporaPreferences[key].count++;
            diasporaPreferences[key].prices.push(property.price);
          }
        }
      });

      const diasporaPlotData = Object.values(diasporaPreferences).map((item: any) => ({
        location: item.location,
        category: item.category,
        inquiryCount: item.count,
        avgPrice: Math.round(item.prices.reduce((a: number, b: number) => a + b, 0) / item.prices.length),
      })).sort((a, b) => b.inquiryCount - a.inquiryCount);

      // Group by location to show preferred size
      const locationPreferences: any = {};
      diasporaPlotData.forEach((item: any) => {
        if (!locationPreferences[item.location]) {
          locationPreferences[item.location] = [];
        }
        locationPreferences[item.location].push(item);
      });

      const topPreferences = Object.entries(locationPreferences).map(([location, items]: [string, any]) => {
        const top = items.sort((a: any, b: any) => b.inquiryCount - a.inquiryCount)[0];
        const total = items.reduce((sum: number, item: any) => sum + item.inquiryCount, 0);
        return {
          location,
          preferredCategory: top.category,
          preferredSize: top.category.includes('Small') ? '<400sqm' : 
                        top.category.includes('Standard') ? '400-500sqm' :
                        top.category.includes('Medium') ? '500-700sqm' :
                        top.category.includes('Large') ? '700-1000sqm' : '>1000sqm',
          inquiryCount: top.inquiryCount,
          totalInquiries: total,
          percentage: Math.round((top.inquiryCount / total) * 100),
        };
      }).sort((a, b) => b.totalInquiries - a.totalInquiries);
      setDiasporaPlotPreferences(topPreferences);

      // 5. Price Per Plot Trends Over Time
      const monthlyTrends: any = {};
      landProperties.forEach((p: any) => {
        const month = new Date(p.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyTrends[month]) {
          monthlyTrends[month] = { prices: [], count: 0 };
        }
        monthlyTrends[month].prices.push(p.price);
        monthlyTrends[month].count++;
      });

      const trends = Object.entries(monthlyTrends)
        .map(([month, data]: [string, any]) => ({
          month,
          avgPrice: Math.round(data.prices.reduce((a: number, b: number) => a + b, 0) / data.prices.length),
          plotCount: data.count,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12); // Last 12 months
      setPlotPriceTrends(trends);

      // 6. Plot Size vs Demand
      const demandBySize: any = {};
      landProperties.forEach((p: any) => {
        const category = categorizePlotSize(p.plot_size);
        if (!demandBySize[category]) {
          demandBySize[category] = {
            category,
            listings: 0,
            totalViews: 0,
            totalInquiries: 0,
            sold: 0,
            prices: [],
          };
        }
        demandBySize[category].listings++;
        demandBySize[category].totalViews += p.views_count || 0;
        demandBySize[category].totalInquiries += p.inquiries_count || 0;
        if (p.status === 'sold') {
          demandBySize[category].sold++;
          demandBySize[category].prices.push(p.price);
        }
      });

      const demandData = Object.values(demandBySize).map((item: any) => ({
        category: item.category,
        listings: item.listings,
        avgViews: Math.round(item.totalViews / item.listings),
        avgInquiries: Math.round((item.totalInquiries / item.listings) * 100) / 100,
        conversionRate: Math.round((item.sold / item.listings) * 100),
        avgSoldPrice: item.prices.length > 0 
          ? Math.round(item.prices.reduce((a: number, b: number) => a + b, 0) / item.prices.length)
          : 0,
        inquiryRate: Math.round((item.totalInquiries / Math.max(item.totalViews, 1)) * 100 * 100) / 100,
      })).sort((a, b) => b.avgInquiries - a.avgInquiries);
      setPlotSizeDemand(demandData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type: string) => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'properties':
          const { data: props } = await supabase.from('properties').select('*');
          data = props || [];
          filename = `properties_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'inquiries':
          const { data: inq } = await supabase.from('inquiries').select('*, profiles(*), properties(*)');
          data = inq || [];
          filename = `inquiries_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'users':
          const { data: usr } = await supabase.from('profiles').select('*');
          data = usr || [];
          filename = `users_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'analytics':
          data = {
            stats: stats,
            districts: districtData,
            propertyTypes: propertyTypeData,
            diaspora: diasporaData,
            exportedAt: new Date().toISOString(),
          } as any;
          filename = `analytics_${new Date().toISOString().split('T')[0]}.json`;
          break;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <Shield className="text-blue-600 w-7 h-7 sm:w-9 sm:h-9" size={28} />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Comprehensive data monitoring and analytics</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={loadDashboardData}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]"
            >
              <RefreshCw size={18} />
              <span>Refresh</span>
            </button>
            <div className="relative group">
              <button className="w-full sm:w-auto px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base min-h-[44px]">
                <Download size={18} />
                <span>Export Data</span>
              </button>
              <div className="absolute right-0 sm:right-0 mt-2 w-full sm:w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => exportData('properties')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 rounded-t-lg text-sm min-h-[44px]"
                >
                  Export Properties
                </button>
                <button
                  onClick={() => exportData('inquiries')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm min-h-[44px]"
                >
                  Export Inquiries
                </button>
                <button
                  onClick={() => exportData('users')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 text-sm min-h-[44px]"
                >
                  Export Users
                </button>
                <button
                  onClick={() => exportData('analytics')}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-50 rounded-b-lg text-sm min-h-[44px]"
                >
                  Export Analytics
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Users</span>
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalAgents} agents, {stats.totalUsers - stats.totalAgents} buyers/owners
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Properties</span>
              <Building2 className="text-green-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalProperties}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalSales} sold ({stats.totalProperties > 0 ? ((stats.totalSales / stats.totalProperties) * 100).toFixed(1) : '0'}%)
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Total Views</span>
              <Eye className="text-purple-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalInquiries} inquiries
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Market Value</span>
              <DollarSign className="text-orange-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              MWK {(stats.estimatedMarketValue / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalProperties} active listings
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Diaspora</span>
              <Globe className="text-indigo-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.diasporaPercentage.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              of inquiries
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <span className="text-gray-700 font-medium text-sm sm:text-base">Time Period:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base sm:text-sm min-h-[44px] flex-1 sm:flex-initial"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Buyer Journey Tracking */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8 border border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="text-purple-600" size={24} />
            Buyer Journey Tracking
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-900">{buyerJourney.views.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mt-1">Property Views</div>
            </div>
            <div className="text-center text-gray-400 text-2xl flex items-center justify-center">
              ↓ {((buyerJourney.inquiries / buyerJourney.views) * 100).toFixed(1)}%
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-900">{buyerJourney.inquiries}</div>
              <div className="text-sm text-gray-600 mt-1">Inquiries Sent</div>
            </div>
            <div className="text-center text-gray-400 text-2xl flex items-center justify-center">
              ↓ ~30%
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-900">~{buyerJourney.estimatedDirectCalls}</div>
              <div className="text-sm text-gray-600 mt-1">Estimated Direct Calls</div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="text-blue-600" size={24} />
              <span className="text-gray-700 font-semibold">Inquiry Rate</span>
            </div>
            <div className="text-4xl font-bold text-blue-900">{stats.inquiryRate.toFixed(1)}%</div>
            <div className="text-sm text-blue-700 mt-2">
              {stats.totalInquiries} inquiries / {stats.totalProperties} listings
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-green-600" size={24} />
              <span className="text-gray-700 font-semibold">Avg Time to Sale</span>
            </div>
            <div className="text-4xl font-bold text-green-900">
              {stats.averageTimeToSale || 'N/A'}
            </div>
            <div className="text-sm text-green-700 mt-2">days</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="text-purple-600" size={24} />
              <span className="text-gray-700 font-semibold">View/Inquiry Ratio</span>
            </div>
            <div className="text-4xl font-bold text-purple-900">
              {(stats.totalViews / Math.max(stats.totalInquiries, 1)).toFixed(1)}
            </div>
            <div className="text-sm text-purple-700 mt-2">views per inquiry</div>
          </div>
        </div>

        {/* Pending Verifications */}
        {pendingVerifications.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-yellow-600" size={24} />
              <h2 className="text-xl font-bold text-yellow-900">Pending Verifications</h2>
              <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                {pendingVerifications.length}
              </span>
            </div>
            <div className="text-yellow-800">
              {pendingVerifications.length} agent verification(s) pending review
            </div>
          </div>
        )}

        {/* User Engagement & Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Active Users (7d)</span>
              <Users className="text-blue-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.activeUsers7d}</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.activeUsers30d} active in last 30 days
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">View → Inquiry Rate</span>
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.viewToInquiryRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.totalInquiries} inquiries / {stats.totalViews} views
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 text-sm font-medium">Most Active Type</span>
              <Building2 className="text-purple-600" size={24} />
            </div>
            <div className="text-2xl font-bold text-gray-900 capitalize">{stats.mostActivePropertyType}</div>
            <div className="text-xs text-gray-500 mt-1">
              Most listed property type
            </div>
          </div>
        </div>

        {/* Real-Time Activity Feed */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-green-600" size={24} />
              Real-Time Activity (Last 24 Hours)
            </h2>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-500">Live</span>
            </span>
          </div>
          {realTimeActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-600 mb-2">No activity in the last 24 hours</p>
              <p className="text-sm text-gray-500">Activity will appear here as users interact with the platform</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {realTimeActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
                  <div className={`p-2 rounded-full ${
                    activity.type === 'property_listed' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'inquiry' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {activity.type === 'property_listed' ? <Building2 size={16} /> :
                     activity.type === 'inquiry' ? <MessageSquare size={16} /> :
                     <Users size={16} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Property Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performing Properties */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              Top Performing Properties
            </h2>
            {topPerformingProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600 mb-2">No properties yet</p>
                <p className="text-sm text-gray-500">Top performers will appear here once properties get views and inquiries</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {topPerformingProperties.map((property, index) => (
                  <div key={property.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 font-bold">#{index + 1}</span>
                          <span className="font-semibold text-gray-900 text-sm line-clamp-1">{property.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{property.district}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                      <span>👁️ {property.views_count || 0} views</span>
                      <span>💬 {property.inquiries_count || 0} inquiries</span>
                      <span className="text-green-600 font-semibold">Score: {property.performanceScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Properties Needing Attention */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="text-orange-600" size={24} />
              Properties Needing Attention
            </h2>
            {needsAttentionProperties.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-300 mb-3" size={48} />
                <p className="text-gray-600 mb-2">All properties are performing well!</p>
                <p className="text-sm text-gray-500">No properties need attention at this time</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {needsAttentionProperties.map((property) => (
                  <div key={property.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900 text-sm line-clamp-1">{property.title}</span>
                        <div className="text-xs text-gray-500 mt-1">{property.district}</div>
                      </div>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-semibold">
                        Needs Help
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      {property.views_count === 0 ? 'No views yet' : 'No views in last 30 days'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Districts with Sales Analytics */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="text-blue-600" size={24} />
              Top Districts by Activity & Sales
            </h2>
            {districtData.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600">No district data yet</p>
                <p className="text-sm text-gray-500 mt-1">District analytics will appear as properties are added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {districtData.map((district: any, index) => (
                <div key={district.district} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                      <span className="font-semibold text-gray-900">{district.district}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-600 font-bold">{district.listings} listings</span>
                      {district.sold > 0 && (
                        <span className="block text-green-600 font-semibold text-sm">{district.sold} sold</span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${(district.listings / Math.max(stats.totalProperties, 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 flex-wrap">
                    <span>{district.views} views</span>
                    <span>•</span>
                    <span>{district.inquiries} inquiries</span>
                    {district.sold > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-semibold">{district.sold} sales ({district.salesRate}%)</span>
                        {district.avgSalePrice > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-700 font-semibold">Avg: {district.avgSalePrice.toLocaleString()} MWK</span>
                          </>
                        )}
                        {(district.localBuyers > 0 || district.diasporaBuyers > 0) && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              {district.localBuyers > 0 && `${district.localBuyers} local`}
                              {district.localBuyers > 0 && district.diasporaBuyers > 0 && ' • '}
                              {district.diasporaBuyers > 0 && `${district.diasporaBuyers} diaspora`}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Property Type Distribution */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <PieChart className="text-green-600" size={24} />
              Property Type Distribution
            </h2>
            {propertyTypeData.length === 0 ? (
              <div className="text-center py-8">
                <PieChart className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600">No property type data yet</p>
                <p className="text-sm text-gray-500 mt-1">Property type distribution will appear as listings are added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {propertyTypeData.map((type) => (
                <div key={type.type}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 capitalize">{type.type}</span>
                    <span className="text-gray-600 font-bold">{type.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${(type.count / Math.max(stats.totalProperties, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* Buyer Segment Comparison */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            Buyer Segment Intelligence
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Diaspora Segment */}
            <div className="border border-indigo-200 rounded-lg p-6 bg-indigo-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-indigo-900">Diaspora Buyers</h3>
                <span className="text-2xl font-bold text-indigo-700">
                  {buyerSegmentComparison.diaspora.count}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-bold ml-2 text-indigo-900">
                    {stats.totalInquiries > 0 ? ((buyerSegmentComparison.diaspora.count / stats.totalInquiries) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                {buyerSegmentComparison.diaspora.avgBudget > 0 && (
                  <div>
                    <span className="text-gray-600">Avg Budget:</span>
                    <span className="font-bold ml-2 text-indigo-900">
                      MK {buyerSegmentComparison.diaspora.avgBudget}M
                    </span>
                  </div>
                )}
                {buyerSegmentComparison.diaspora.topDistricts.length > 0 && (
                  <div>
                    <span className="text-gray-600 font-medium">Top Districts:</span>
                    <div className="mt-2 space-y-1">
                      {buyerSegmentComparison.diaspora.topDistricts.map((item: any) => (
                        <div key={item.district} className="flex justify-between text-xs">
                          <span>{item.district}</span>
                          <span className="font-semibold">{item.count} inquiries</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Local Segment */}
            <div className="border border-green-200 rounded-lg p-6 bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-green-900">Local Buyers</h3>
                <span className="text-2xl font-bold text-green-700">
                  {buyerSegmentComparison.local.count}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Percentage:</span>
                  <span className="font-bold ml-2 text-green-900">
                    {stats.totalInquiries > 0 ? ((buyerSegmentComparison.local.count / stats.totalInquiries) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                {buyerSegmentComparison.local.avgBudget > 0 && (
                  <div>
                    <span className="text-gray-600">Avg Budget:</span>
                    <span className="font-bold ml-2 text-green-900">
                      MK {buyerSegmentComparison.local.avgBudget}M
                    </span>
                  </div>
                )}
                {buyerSegmentComparison.local.topCities.length > 0 && (
                  <div>
                    <span className="text-gray-600 font-medium">Top Cities:</span>
                    <div className="mt-2 space-y-1">
                      {buyerSegmentComparison.local.topCities.map((item: any) => (
                        <div key={item.city} className="flex justify-between text-xs">
                          <span>{item.city}</span>
                          <span className="font-semibold">{item.count} buyers</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {buyerSegmentComparison.local.topDistricts.length > 0 && (
                  <div>
                    <span className="text-gray-600 font-medium">Top Districts:</span>
                    <div className="mt-2 space-y-1">
                      {buyerSegmentComparison.local.topDistricts.map((item: any) => (
                        <div key={item.district} className="flex justify-between text-xs">
                          <span>{item.district}</span>
                          <span className="font-semibold">{item.count} inquiries</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Diaspora Analytics */}
        {diasporaData.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Globe className="text-indigo-600" size={24} />
              Diaspora Buyer Locations
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {diasporaData.map((item: any) => (
                <div key={item.location} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{item.count}</div>
                  <div className="text-sm text-gray-600">{item.location}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plot Intelligence Section */}
        {hasLandProperties && (
          <div className="space-y-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-blue-600" size={28} />
              Plot Intelligence 🇲🇼
            </h2>

            {/* Plot Size Distribution */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <PieChart className="text-blue-600" size={20} />
                Plot Size Distribution
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {plotSizeDistribution.map((item) => {
                  const total = plotSizeDistribution.reduce((sum, i) => sum + i.count, 0);
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  return (
                    <div key={item.category} className="border border-gray-200 rounded-lg p-4 text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">{item.count}</div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">{item.category}</div>
                      <div className="text-xs text-gray-500">{percentage}% of total</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Most Common Plot Sizes per District */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="text-green-600" size={20} />
                Most Common Plot Sizes by District
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {commonPlotSizes.slice(0, 10).map((item, index) => (
                  <div key={item.district} className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-bold">#{index + 1}</span>
                        <span className="font-semibold text-gray-900">{item.district}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{item.mostCommonSize} sqm</div>
                        <div className="text-xs text-gray-500">{item.frequency} plots ({item.percentage}%)</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg Price: {item.avgPrice.toLocaleString()} MWK
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Average Price Per Plot by District & Category */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <DollarSign className="text-orange-600" size={20} />
                Average Price Per Plot (by District & Category)
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {plotPriceData.slice(0, 15).map((item, index) => (
                  <div key={`${item.district}-${item.category}`} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-semibold text-gray-900">{item.district}</span>
                        <span className="text-sm text-gray-600 ml-2">• {item.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {item.avgPrice.toLocaleString()} MWK
                        </div>
                        <div className="text-xs text-gray-500">Avg: {item.avgSize} sqm</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{item.plotCount} plots</span>
                      <span>•</span>
                      <span>{item.totalViews} views</span>
                      <span>•</span>
                      <span>{item.totalInquiries} inquiries</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plot Size vs Demand */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp className="text-purple-600" size={20} />
                Plot Size vs Demand
              </h3>
              <div className="space-y-4">
                {plotSizeDemand.map((item) => {
                  const maxInquiries = Math.max(...plotSizeDemand.map((i) => i.avgInquiries), 1);
                  return (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-gray-900">{item.category}</span>
                          <span className="text-sm text-gray-600 ml-2">• {item.listings} listings</span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-purple-900">{item.avgInquiries.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">inquiries per listing</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-purple-600 h-3 rounded-full transition-all"
                          style={{
                            width: `${(item.avgInquiries / maxInquiries) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                        <span>Conversion: {item.conversionRate}%</span>
                        <span>•</span>
                        <span>Avg views: {item.avgViews}</span>
                        <span>•</span>
                          {item.avgSoldPrice > 0 && (
                            <span>Avg sold: {item.avgSoldPrice.toLocaleString()} MWK</span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diaspora Plot Preferences */}
            {diasporaPlotPreferences.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Globe className="text-indigo-600" size={20} />
                  Diaspora Plot Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {diasporaPlotPreferences.map((item) => (
                    <div key={item.location} className="border border-indigo-200 rounded-lg p-4 bg-indigo-50">
                      <div className="font-semibold text-gray-900 mb-1">{item.location}</div>
                      <div className="text-sm text-gray-700 mb-2">Prefers: <strong>{item.preferredCategory}</strong></div>
                      <div className="text-xs text-gray-600">
                        {item.inquiryCount} inquiries ({item.percentage}% of {item.totalInquiries} total)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Per Plot Trends */}
            {plotPriceTrends.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Activity className="text-blue-600" size={20} />
                  Price Per Plot Trends (Last 12 Months)
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {plotPriceTrends.map((item) => {
                    const maxPrice = Math.max(...plotPriceTrends.map((i) => i.avgPrice), 1);
                    return (
                      <div key={item.month}>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">
                              {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">• {item.plotCount} plots</span>
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {item.avgPrice.toLocaleString()} MWK
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${(item.avgPrice / maxPrice) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Properties */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Properties</h2>
            {recentProperties.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600 mb-2">No properties yet</p>
                <p className="text-sm text-gray-500">Approve pending listings to see them here</p>
                <a href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Marketplace →
                </a>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentProperties.map((property) => (
                <div key={property.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="font-semibold text-gray-900 text-sm line-clamp-1">{property.title}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {property.district} • {property.property_type}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(property.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Recent Inquiries */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Inquiries</h2>
            {recentInquiries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600 mb-2">No inquiries yet</p>
                <p className="text-sm text-gray-500">Check marketing campaigns to drive more inquiries</p>
                <a href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Marketplace →
                </a>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentInquiries.map((inquiry: any) => (
                <div key={inquiry.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="font-semibold text-gray-900 text-sm line-clamp-1">
                    {(inquiry.properties as any)?.title || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(inquiry.profiles as any)?.current_location || 'Unknown'} • {inquiry.status}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Users</h2>
            {recentUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600 mb-2">No users yet</p>
                <p className="text-sm text-gray-500">Users will appear here as they sign up</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentUsers.map((user) => (
                <div key={user.id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="font-semibold text-gray-900 text-sm">{user.full_name || user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {user.user_type} • {user.is_diaspora ? 'Diaspora' : 'Local'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>

        {/* Inquiry Conversion Funnel */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="text-purple-600" size={24} />
            Inquiry Conversion Funnel
          </h2>
          <div className="space-y-4">
            {/* Funnel Stages */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-full bg-blue-100 rounded-lg p-4 text-center border-2 border-blue-300">
                <div className="text-2xl font-bold text-blue-900">{inquiryFunnel.views.toLocaleString()}</div>
                <div className="text-sm text-blue-700">Property Views</div>
              </div>
              <div className="text-gray-500 text-sm">↓ {inquiryFunnel.views > 0 ? ((inquiryFunnel.inquiries / inquiryFunnel.views) * 100).toFixed(1) : 0}%</div>
              
              <div className="w-[90%] bg-purple-100 rounded-lg p-4 text-center border-2 border-purple-300">
                <div className="text-2xl font-bold text-purple-900">{inquiryFunnel.inquiries.toLocaleString()}</div>
                <div className="text-sm text-purple-700">Inquiries Sent</div>
              </div>
              <div className="text-gray-500 text-sm">↓ {inquiryFunnel.inquiries > 0 ? ((inquiryFunnel.visits / inquiryFunnel.inquiries) * 100).toFixed(1) : 0}%</div>
              
              <div className="w-[70%] bg-green-100 rounded-lg p-4 text-center border-2 border-green-300">
                <div className="text-2xl font-bold text-green-900">{inquiryFunnel.visits.toLocaleString()}</div>
                <div className="text-sm text-green-700">Property Visits (Estimated)</div>
              </div>
              <div className="text-gray-500 text-sm">↓ {inquiryFunnel.visits > 0 ? ((inquiryFunnel.sales / inquiryFunnel.visits) * 100).toFixed(1) : 0}%</div>
              
              <div className="w-[50%] bg-orange-100 rounded-lg p-4 text-center border-2 border-orange-300">
                <div className="text-2xl font-bold text-orange-900">{inquiryFunnel.sales.toLocaleString()}</div>
                <div className="text-sm text-orange-700">Sales</div>
              </div>
            </div>
          </div>
        </div>

        {/* System Health & Marketing Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Health */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="text-green-600" size={24} />
              System Health
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Zap className="text-blue-600" size={20} />
                  <span className="text-gray-700 font-medium">API Response Time</span>
                </div>
                <span className={`font-bold ${systemHealth.apiResponseTime < 200 ? 'text-green-600' : systemHealth.apiResponseTime < 500 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {systemHealth.apiResponseTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <HardDrive className="text-green-600" size={20} />
                  <span className="text-gray-700 font-medium">Database</span>
                </div>
                <span className={`flex items-center gap-2 font-bold ${systemHealth.databaseConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {systemHealth.databaseConnected ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  {systemHealth.databaseConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={20} />
                  <span className="text-gray-700 font-medium">Error Rate</span>
                </div>
                <span className={`font-bold ${systemHealth.errorRate === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {systemHealth.errorRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Marketing Analytics - Traffic Sources */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ExternalLink className="text-blue-600" size={24} />
              Traffic Sources
            </h2>
            {trafficSources.length === 0 ? (
              <div className="text-center py-8">
                <ExternalLink className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600">No traffic data yet</p>
                <p className="text-sm text-gray-500 mt-1">Traffic sources will appear as visitors come to the platform</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trafficSources.map((source: any) => (
                  <div key={source.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 capitalize">{source.source || 'Direct'}</span>
                      <span className="text-gray-600 font-bold">{source.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${source.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{source.percentage}% of traffic</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance Trends & Admin Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trends */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="text-green-600" size={24} />
              Performance Trends (12 Weeks)
            </h2>
            {performanceTrends.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600">No trend data yet</p>
                <p className="text-sm text-gray-500 mt-1">Trends will appear as data accumulates over time</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {performanceTrends.map((trend: any) => (
                  <div key={trend.week} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(trend.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Properties:</span>
                        <span className="font-bold ml-1">{trend.properties}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <span className="font-bold ml-1">{trend.views}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Inquiries:</span>
                        <span className="font-bold ml-1">{trend.inquiries}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Sales:</span>
                        <span className="font-bold ml-1 text-green-600">{trend.sales}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Activity Log */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="text-purple-600" size={24} />
              Admin Activity Log
            </h2>
            {adminActivityLog.length === 0 ? (
              <div className="text-center py-8">
                <History className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-600">No admin activity yet</p>
                <p className="text-sm text-gray-500 mt-1">Admin actions will be logged here automatically</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminActivityLog.map((log: any) => (
                  <div key={log.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 capitalize">{log.action_type?.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{log.description}</p>
                    {log.resource_type && (
                      <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {log.resource_type}: {log.resource_id?.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

