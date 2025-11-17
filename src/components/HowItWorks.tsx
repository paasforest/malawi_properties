'use client';

import { Search, MessageSquare, Shield, CheckCircle } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Browse Properties',
    description: 'Explore verified listings across all districts in Malawi. Filter by type, price, and location.',
    icon: <Search size={32} />,
  },
  {
    number: '02',
    title: 'Contact Owner',
    description: 'Found a property you like? Contact the agent or property owner directly using the provided contact details.',
    icon: <MessageSquare size={32} />,
  },
  {
    number: '03',
    title: 'Complete Off-Platform',
    description: 'Connect with trusted agents, verify documentation, and complete your purchase directly. All transactions happen off-platform.',
    icon: <Shield size={32} />,
  },
];

export function HowItWorks() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Free listings, direct contact, trusted agents. Designed for the diaspora community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector Line (hidden on mobile, shown on desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-transparent z-0" style={{ width: 'calc(100% - 4rem)' }} />
              )}

              <div className="relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-blue-500 transition-all duration-300 hover:shadow-xl group">
                {/* Step Number */}
                <div className="absolute -top-6 -left-6 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg group-hover:bg-blue-700 transition-colors">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>

                {/* Check Circle Decoration */}
                <div className="absolute -bottom-4 -right-4 text-blue-100 opacity-50 group-hover:opacity-75 transition-opacity">
                  <CheckCircle size={64} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

