'use client';

import { Shield, CheckCircle, Users, Award, Lock, Globe } from 'lucide-react';

interface TrustFeature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const trustFeatures: TrustFeature[] = [
  {
    icon: <Shield size={24} />,
    title: 'Verified Listings',
    description: 'All properties are verified for authenticity and documentation',
  },
  {
    icon: <Users size={24} />,
    title: 'Trusted Agents',
    description: 'Work with verified, licensed real estate agents',
  },
  {
    icon: <Lock size={24} />,
    title: 'Free & Direct',
    description: 'Free listings for all. Contact owners directly. No commissions or fees.',
  },
  {
    icon: <Globe size={24} />,
    title: 'Diaspora Focus',
    description: 'Designed specifically for the Malawian diaspora community',
  },
  {
    icon: <Award size={24} />,
    title: 'Quality Assured',
    description: 'We maintain high standards for all listed properties',
  },
  {
    icon: <CheckCircle size={24} />,
    title: 'Documentation Verified',
    description: 'Title deeds and legal documents are verified before listing',
  },
];

export function TrustSection() {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Trust Us?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built for the diaspora community. Free listings, verified data, direct connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {trustFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200 group"
            >
              <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform inline-block">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

