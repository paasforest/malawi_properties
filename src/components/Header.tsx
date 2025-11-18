 'use client';

import { Building2, User, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/supabase';
import { AuthModal } from './AuthModal';

export function Header() {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      (async () => {
        await checkUser();
      })();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      setUser(profileData);
      setProfile(profileData);
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Building2 size={24} className="sm:w-7 sm:h-7" />
              <span className="hidden sm:inline">Malawi Properties</span>
              <span className="sm:hidden">Malawi</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                  pathname === '/' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Marketplace
              </Link>

              {profile && profile.user_type === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    pathname === '/admin'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </Link>
              )}

              {profile && profile.user_type === 'buyer' && (
                <Link
                  href="/buyer"
                  className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                    pathname === '/buyer'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Dashboard
                </Link>
              )}

              {profile && (profile.user_type === 'agent' || profile.user_type === 'owner') && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                      pathname === '/dashboard'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/analytics"
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                      pathname === '/analytics'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/intelligence"
                    className={`px-4 py-2 rounded-lg transition-colors text-sm ${
                      pathname === '/intelligence'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Intelligence
                  </Link>
                </>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                    <User size={18} />
                    <span className="text-sm font-medium hidden xl:inline">{user.full_name || user.email}</span>
                    <span className="text-sm font-medium xl:hidden">{user.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    title="Sign out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
                >
                  Sign In
                </button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                  <User size={18} />
                  <span className="text-xs font-medium max-w-[80px] truncate">{user.full_name?.split(' ')[0] || user.email?.split('@')[0]}</span>
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden border-t border-gray-200 py-4 space-y-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                  pathname === '/' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Marketplace
              </Link>

              {profile && profile.user_type === 'admin' && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                    pathname === '/admin'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Admin
                </Link>
              )}

              {profile && profile.user_type === 'buyer' && (
                <Link
                  href="/buyer"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                    pathname === '/buyer'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  My Dashboard
                </Link>
              )}

              {profile && (profile.user_type === 'agent' || profile.user_type === 'owner') && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                      pathname === '/dashboard'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                      pathname === '/analytics'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/intelligence"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors text-base font-medium ${
                      pathname === '/intelligence'
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Intelligence
                  </Link>
                </>
              )}

              {!user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowAuthModal(true);
                  }}
                  className="w-full text-left px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base min-h-[44px]"
                >
                  Sign In
                </button>
              )}

              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-base min-h-[44px] flex items-center gap-2"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              )}
            </nav>
          )}
        </div>
      </header>

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            checkUser();
          }}
        />
      )}
    </>
  );
}
