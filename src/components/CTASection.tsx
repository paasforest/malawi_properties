'use client';

import { ArrowRight, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export function CTASection() {
  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 py-16 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Find Your Property?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Malawian diaspora buyers who trust us for their property search
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Search size={24} />
              Browse Properties
              <ArrowRight size={20} />
            </Link>

            <Link
              href="/dashboard"
              className="bg-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-900 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus size={24} />
              List Your Property
              <ArrowRight size={20} />
            </Link>
          </div>

          <p className="text-blue-200 text-sm mt-8">
            Free to browse • Verified properties • Trusted agents
          </p>
        </div>
      </div>
    </div>
  );
}



