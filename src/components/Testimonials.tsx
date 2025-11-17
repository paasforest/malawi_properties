'use client';

import { Quote, Star, MapPin } from 'lucide-react';

interface Testimonial {
  name: string;
  location: string;
  role: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Mwale',
    location: 'South Africa',
    role: 'Property Buyer',
    content: 'Found my perfect plot in Lilongwe through this platform. The verification process gave me confidence, and the agent was very professional. Highly recommend!',
    rating: 5,
  },
  {
    name: 'James Phiri',
    location: 'United Kingdom',
    role: 'Diaspora Investor',
    content: 'As someone living abroad, it was challenging to find reliable property listings. This platform made it so easy, and I was able to secure a great investment property.',
    rating: 5,
  },
  {
    name: 'Grace Banda',
    location: 'United States',
    role: 'First-time Buyer',
    content: 'The detailed property information and verified documentation made buying property from abroad stress-free. The agents are trustworthy and responsive.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <div className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Buyers Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Real experiences from the Malawian diaspora community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-2xl p-8 border border-gray-200 hover:shadow-lg transition-all duration-300 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-blue-100">
                <Quote size={48} />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 fill-yellow-400" size={20} />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="border-t border-gray-200 pt-6">
                <div className="font-semibold text-gray-900 mb-1">{testimonial.name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={14} />
                  <span>{testimonial.location}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


