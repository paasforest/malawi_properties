'use client';

import { Phone, Mail, Building2 } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={24} />
              <span className="text-xl font-bold">Malawi Properties</span>
            </div>
            <p className="text-gray-400 text-sm">
              Your trusted marketplace for Malawian real estate. Connecting diaspora buyers with verified properties.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Agent Dashboard
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-gray-400 hover:text-white transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3 text-sm">
              <a
                href="tel:+27679518124"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Phone size={18} />
                <span>+27 67 951 8124</span>
              </a>
              <a
                href="https://wa.me/27679518124"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <Phone size={18} />
                <span>WhatsApp: +27 67 951 8124</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Malawi Properties. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


