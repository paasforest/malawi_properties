 'use client';

import { Building2, User, LogOut } from 'lucide-react';
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

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
            >
              <Building2 size={28} />
              <span>Malawi Properties</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pathname === '/' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Marketplace
              </Link>

              {profile && profile.user_type === 'admin' && (
                <Link
                  href="/admin"
                  className={`px-4 py-2 rounded-lg transition-colors ${
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
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
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      pathname === '/dashboard'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/analytics"
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      pathname === '/analytics'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/intelligence"
                    className={`px-4 py-2 rounded-lg transition-colors ${
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
                    <span className="text-sm font-medium">{user.full_name || user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Sign In
                </button>
              )}
            </nav>
          </div>
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
