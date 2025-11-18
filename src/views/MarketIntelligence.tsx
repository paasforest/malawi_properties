'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, MapPin, Building2, Users, DollarSign, Clock, 
  Globe, BarChart3, Target, PieChart, Activity, Award
} from 'lucide-react';

interface DistrictIntelligence {
  district: string;
  totalListings: number;
  totalSales: number;
  averagePrice: number;
  averageTimeToSale: number;
  totalViews: number;
  totalInquiries: number;
  diasporaInquiryPercentage: number;
  hotnessScore: number;
}

interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  company_name: string | null;
  totalListings: number;
  totalSales: number;
  conversionRate: number;
  averageTimeToSale: number;
  totalInquiries: number;
  rating: number;
  districtsCovered: string[];
}

interface DiasporaPattern {
  location: string;
  inquiryCount: number;
  preferredDistricts: string[];
  averageBudget: string;
  preferredPropertyTypes: string[];
}

export function MarketIntelligence() {
  const [districtData, setDistrictData] = useState<DistrictIntelligence[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [diasporaPatterns, setDiasporaPatterns] = useState<DiasporaPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  useEffect(() => {
    loadMarketIntelligence();
  }, []);

  const loadMarketIntelligence = async () => {
    try {
      // Load all data
      const { data: properties } = await supabase.from('properties').select('*');
      const { data: inquiries } = await supabase
        .from('inquiries')
        .select('*, profiles(is_diaspora, current_location), properties(district, property_type, price)');
      const { data: views } = await supabase
        .from('property_views')
        .select('*, properties(district)');
      const { data: agents } = await supabase
        .from('agents')
        .select('*, profiles(full_name), properties(*)');

      // Calculate District Intelligence
      const districtMap = new Map<string, DistrictIntelligence>();

      properties?.forEach((prop) => {
        const district = prop.district;
        if (!districtMap.has(district)) {
          districtMap.set(district, {
            district,
            totalListings: 0,
            totalSales: 0,
            averagePrice: 0,
            averageTimeToSale: 0,
            totalViews: 0,
            totalInquiries: 0,
            diasporaInquiryPercentage: 0,
            hotnessScore: 0,
          });
        }

        const data = districtMap.get(district)!;
        data.totalListings++;
        if (prop.status === 'sold' && prop.sold_at) {
          data.totalSales++;
          const listDate = new Date(prop.listed_at);
          const soldDate = new Date(prop.sold_at);
          const days = Math.floor((soldDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
          data.averageTimeToSale = (data.averageTimeToSale * (data.totalSales - 1) + days) / data.totalSales;
        }
        data.averagePrice = (data.averagePrice * (data.totalListings - 1) + Number(prop.price)) / data.totalListings;
      });

      // Add views and inquiries per district
      views?.forEach((view) => {
        const district = (view.properties as any)?.district;
        if (district && districtMap.has(district)) {
          districtMap.get(district)!.totalViews++;
        }
      });

      inquiries?.forEach((inquiry) => {
        const district = (inquiry.properties as any)?.district;
        if (district && districtMap.has(district)) {
          const data = districtMap.get(district)!;
          data.totalInquiries++;
          if ((inquiry.profiles as any)?.is_diaspora) {
            data.diasporaInquiryPercentage = (data.diasporaInquiryPercentage * (data.totalInquiries - 1) + 100) / data.totalInquiries;
          } else {
            data.diasporaInquiryPercentage = (data.diasporaInquiryPercentage * (data.totalInquiries - 1)) / data.totalInquiries;
          }
        }
      });

      // Calculate hotness score (demand vs supply ratio)
      districtMap.forEach((data, district) => {
        const demandScore = data.totalInquiries * 2 + data.totalViews * 0.1;
        const supplyScore = data.totalListings;
        data.hotnessScore = supplyScore > 0 ? demandScore / supplyScore : 0;
      });

      const sortedDistricts = Array.from(districtMap.values())
        .sort((a, b) => b.hotnessScore - a.hotnessScore);

      setDistrictData(sortedDistricts);

      // Calculate Agent Performance
      const agentMap = new Map<string, AgentPerformance>();

      agents?.forEach((agent) => {
        const agentProps = (agent.properties || []) as any[];
        const agentName = (agent.profiles as any)?.full_name || 'Unknown';

        if (!agentMap.has(agent.id)) {
          agentMap.set(agent.id, {
            agent_id: agent.id,
            agent_name: agentName,
            company_name: agent.company_name,
            totalListings: agentProps.length,
            totalSales: 0,
            conversionRate: 0,
            averageTimeToSale: 0,
            totalInquiries: 0,
            rating: agent.rating || 0,
            districtsCovered: agent.districts_covered || [],
          });
        }

        const data = agentMap.get(agent.id)!;
        agentProps.forEach((prop: any) => {
          if (prop.status === 'sold' && prop.sold_at) {
            data.totalSales++;
          }
        });

        // Get inquiries for this agent's properties
        const agentPropertyIds = agentProps.map((p: any) => p.id);
        const agentInquiries = inquiries?.filter((i: any) => 
          agentPropertyIds.includes(i.property_id)
        ) || [];
        data.totalInquiries = agentInquiries.length;

        data.conversionRate = data.totalListings > 0 
          ? (data.totalSales / data.totalListings) * 100 
          : 0;

        const soldProps = agentProps.filter((p: any) => p.status === 'sold' && p.sold_at);
        if (soldProps.length > 0) {
          const totalDays = soldProps.reduce((sum: number, p: any) => {
            const listDate = new Date(p.listed_at);
            const soldDate = new Date(p.sold_at);
            return sum + Math.floor((soldDate.getTime() - listDate.getTime()) / (1000 * 60 * 60 * 24));
          }, 0);
          data.averageTimeToSale = totalDays / soldProps.length;
        }
      });

      const sortedAgents = Array.from(agentMap.values())
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10);

      setAgentPerformance(sortedAgents);

      // Calculate Diaspora Patterns
      const diasporaMap = new Map<string, DiasporaPattern>();

      inquiries?.forEach((inquiry) => {
        const profile = inquiry.profiles as any;
        if (profile?.is_diaspora && profile?.current_location) {
          const location = profile.current_location;
          if (!diasporaMap.has(location)) {
            diasporaMap.set(location, {
              location,
              inquiryCount: 0,
              preferredDistricts: [],
              averageBudget: '',
              preferredPropertyTypes: [],
            });
          }

          const data = diasporaMap.get(location)!;
          data.inquiryCount++;
          
          const prop = inquiry.properties as any;
          if (prop?.district) {
            data.preferredDistricts.push(prop.district);
          }
          if (prop?.property_type) {
            data.preferredPropertyTypes.push(prop.property_type);
          }
        }
      });

      // Process diaspora patterns
      const processedDiaspora: DiasporaPattern[] = Array.from(diasporaMap.values()).map((pattern) => {
        const districtCounts = pattern.preferredDistricts.reduce((acc: any, d) => {
          acc[d] = (acc[d] || 0) + 1;
          return acc;
        }, {});

        const typeCounts = pattern.preferredPropertyTypes.reduce((acc: any, t) => {
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});

        return {
          ...pattern,
          preferredDistricts: Object.entries(districtCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3)
            .map(([d]) => d),
          preferredPropertyTypes: Object.entries(typeCounts)
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 3)
            .map(([t]) => t),
        };
      }).sort((a, b) => b.inquiryCount - a.inquiryCount);

      setDiasporaPatterns(processedDiaspora);

    } catch (error) {
      console.error('Error loading market intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading market intelligence...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="text-blue-600" size={32} />
            Market Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-estate data intelligence: District heatmaps, agent performance, diaspora patterns
          </p>
        </div>

        {/* District Heatmap Intelligence */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="text-orange-600" size={24} />
            District Heatmap & Intelligence
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">District</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Hotness Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Listings</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Sales</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Avg Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Views</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Inquiries</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Diaspora %</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Time to Sale</th>
                </tr>
              </thead>
              <tbody>
                {districtData.map((district) => (
                  <tr 
                    key={district.district} 
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedDistrict === district.district ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedDistrict(district.district)}
                  >
                    <td className="py-3 px-4 font-medium">{district.district}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              district.hotnessScore > 5 ? 'bg-red-500' :
                              district.hotnessScore > 2 ? 'bg-orange-500' :
                              district.hotnessScore > 1 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(district.hotnessScore * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold">{district.hotnessScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{district.totalListings}</td>
                    <td className="py-3 px-4">{district.totalSales}</td>
                    <td className="py-3 px-4">
                      {district.averagePrice > 0 
                        ? `MWK ${Math.round(district.averagePrice).toLocaleString()}` 
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">{district.totalViews}</td>
                    <td className="py-3 px-4">{district.totalInquiries}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        district.diasporaInquiryPercentage > 60 ? 'bg-green-100 text-green-800' :
                        district.diasporaInquiryPercentage > 30 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {district.diasporaInquiryPercentage.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {district.averageTimeToSale > 0 
                        ? `${Math.round(district.averageTimeToSale)} days` 
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            💡 Hotness Score = (Inquiries × 2 + Views × 0.1) / Listings. Higher score = more demand vs supply.
          </p>
        </div>

        {/* Agent Performance Leaderboard */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Award className="text-yellow-600" size={24} />
            Top Performing Agents
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Agent</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Company</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Listings</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Sales</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Conversion Rate</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Inquiries</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Avg Time to Sale</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Rating</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent) => (
                  <tr key={agent.agent_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{agent.agent_name}</td>
                    <td className="py-3 px-4 text-gray-600">{agent.company_name || 'N/A'}</td>
                    <td className="py-3 px-4">{agent.totalListings}</td>
                    <td className="py-3 px-4">{agent.totalSales}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        agent.conversionRate > 30 ? 'bg-green-100 text-green-800' :
                        agent.conversionRate > 15 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {agent.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">{agent.totalInquiries}</td>
                    <td className="py-3 px-4">
                      {agent.averageTimeToSale > 0 
                        ? `${Math.round(agent.averageTimeToSale)} days` 
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{agent.rating.toFixed(1)}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Diaspora Buyer Patterns */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Globe className="text-purple-600" size={24} />
            Diaspora Buyer Patterns
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diasporaPatterns.slice(0, 12).map((pattern, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{pattern.location}</h3>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                    {pattern.inquiryCount} inquiries
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600 font-medium">Top Districts: </span>
                    <span className="text-gray-900">
                      {pattern.preferredDistricts.length > 0 
                        ? pattern.preferredDistricts.join(', ') 
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Property Types: </span>
                    <span className="text-gray-900 capitalize">
                      {pattern.preferredPropertyTypes.length > 0 
                        ? pattern.preferredPropertyTypes.join(', ') 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}


