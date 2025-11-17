'use client';

import { Home, Landmark, Building2, Briefcase, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  bgColor: string;
}

const categories: Category[] = [
  {
    id: 'land',
    name: 'Land',
    icon: <MapPin size={32} />,
    description: 'Plots and vacant land',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'house',
    name: 'Houses',
    icon: <Home size={32} />,
    description: 'Residential homes',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'commercial',
    name: 'Commercial',
    icon: <Briefcase size={32} />,
    description: 'Business properties',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    id: 'rental',
    name: 'Rentals',
    icon: <Building2 size={32} />,
    description: 'Houses for rent',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
  {
    id: 'mixed',
    name: 'Mixed Use',
    icon: <Landmark size={32} />,
    description: 'Multi-purpose properties',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
  },
];

export function PropertyCategories() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect property type for your needs
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/?propertyType=${category.id}`}
              className={`${category.bgColor} rounded-xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg border border-gray-100`}
            >
              <div className={`${category.color} mb-3 flex justify-center`}>
                {category.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


