'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Test Supabase connection first
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Debug: Log environment variables (first few chars only for security)
      console.log('🔍 Environment Check:', {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING',
      });

      if (!supabaseUrl || !supabaseKey) {
        const errorMsg = `Missing environment variables. URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables and redeploy.`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Test Supabase URL accessibility
      try {
        const testUrl = `${supabaseUrl}/rest/v1/`;
        console.log('🧪 Testing Supabase connection to:', testUrl);
        const testResponse = await fetch(testUrl, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
          },
        });
        console.log('✅ Supabase connection test:', testResponse.status, testResponse.statusText);
      } catch (testError: any) {
        console.error('❌ Supabase connection test failed:', testError);
        throw new Error(`Cannot connect to Supabase. Check URL: ${supabaseUrl}. Error: ${testError.message}`);
      }

      console.log('🔐 Attempting login with:', { email, supabaseUrl });

      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        
        // Better error messages
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address first.');
        } else if (authError.message.includes('Failed to fetch')) {
          throw new Error('Connection failed. Please check your internet connection and Supabase URL.');
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Login failed. Please check your credentials.');
      }

      console.log('Auth successful, checking admin status...');

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, user_type, is_verified')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
        console.error('Error details:', JSON.stringify(profileError, null, 2));
        throw new Error(`Failed to check user permissions: ${profileError.message}. Make sure the profile exists in Supabase.`);
      }

      if (!profile) {
        await supabase.auth.signOut();
        console.error('No profile found for user:', authData.user.id);
        throw new Error('User profile not found. Please create the admin profile in Supabase first. See CREATE_ADMIN_NOW.md');
      }

      console.log('Profile found:', { user_type: profile.user_type, is_verified: profile.is_verified });

      if (profile.user_type !== 'admin') {
        await supabase.auth.signOut();
        throw new Error(`Access denied. Admin privileges required. Current user type: ${profile.user_type}. Update profile in Supabase.`);
      }

      console.log('Admin access granted, redirecting...');

      // Redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || err.error_description || 'Login failed. Please try again.';
      setError(errorMessage);
      
      // Show detailed error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Full error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-600">Access the admin dashboard</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="text-gray-400" size={20} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <Shield size={20} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Only users with admin privileges can access this page.
              If you need admin access, contact your system administrator.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Marketplace
          </a>
        </div>
      </div>
    </div>
  );
}

