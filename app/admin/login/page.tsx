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
  const [success, setSuccess] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // VERY VISIBLE DEBUGGING - These should always show
    console.warn('🚀🚀🚀 LOGIN STARTED 🚀🚀🚀');
    console.warn('📧 Email:', email);
    console.warn('🔑 Password length:', password.length);
    console.error('🔍 DEBUG: Form submitted, handleLogin called!');
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Step 1: Test Supabase connection first
      console.warn('📋 STEP 1: Checking environment variables...');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // Debug: Log environment variables (first few chars only for security)
      console.warn('🔍 Environment Check:', {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING',
        keyLength: supabaseKey?.length || 0,
      });

      if (!supabaseUrl || !supabaseKey) {
        const errorMsg = `Missing environment variables. URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables and redeploy.`;
        console.error('❌', errorMsg);
        throw new Error(errorMsg);
      }

      // Step 2: Test Supabase URL accessibility
      console.warn('📋 STEP 2: Testing Supabase connection...');
      try {
        const testUrl = `${supabaseUrl}/rest/v1/`;
        console.warn('🧪 Testing Supabase connection to:', testUrl);
        const testResponse = await fetch(testUrl, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
          },
        });
        console.warn('✅ Supabase connection test:', testResponse.status, testResponse.statusText);
      } catch (testError: any) {
        console.error('❌ Supabase connection test failed:', testError);
        throw new Error(`Cannot connect to Supabase. Check URL: ${supabaseUrl}. Error: ${testError.message}`);
      }

      // Step 3: Sign in with Supabase
      console.warn('📋 STEP 3: Attempting authentication...');
      console.warn('🔐 Signing in with email:', email);
      console.error('⏳ CALLING supabase.auth.signInWithPassword NOW...');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.error('📦 Auth response received:', {
        hasData: !!authData,
        hasUser: !!authData?.user,
        hasError: !!authError,
        userId: authData?.user?.id,
        userEmail: authData?.user?.email,
      });

      if (authError) {
        console.error('❌ Auth error occurred:', {
          message: authError.message,
          status: authError.status,
          error: authError,
        });
        
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

      if (!authData || !authData.user) {
        console.error('❌ No user data in auth response:', authData);
        throw new Error('Login failed. Please check your credentials.');
      }

      console.error('✅✅✅ STEP 3 SUCCESS: Authentication successful ✅✅✅');
      console.warn('👤 User authenticated:', {
        id: authData.user.id,
        email: authData.user.email,
        createdAt: authData.user.created_at,
      });

      // Step 4: Check if user is admin
      console.warn('📋 STEP 4: Checking user profile and admin status...');
      console.warn('🔍 Querying profiles table for user ID:', authData.user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, user_type, is_verified')
        .eq('id', authData.user.id)
        .maybeSingle();

      console.error('📦 Profile query response:', {
        hasData: !!profile,
        hasError: !!profileError,
        profile: profile,
        error: profileError,
      });

      if (profileError) {
        console.error('❌ Profile query error:', {
          message: profileError.message,
          details: profileError,
          code: profileError.code,
          hint: profileError.hint,
        });
        console.error('Error details (JSON):', JSON.stringify(profileError, null, 2));
        throw new Error(`Failed to check user permissions: ${profileError.message}. Make sure the profile exists in Supabase.`);
      }

      if (!profile) {
        console.error('❌ No profile found for user:', {
          userId: authData.user.id,
          userEmail: authData.user.email,
        });
        console.log('🔓 Signing out user due to missing profile...');
        await supabase.auth.signOut();
        throw new Error('User profile not found. Please create the admin profile in Supabase first. See CREATE_ADMIN_NOW.md');
      }

      console.error('✅ STEP 4 SUCCESS: Profile found');
      console.warn('👤 Profile details:', {
        id: profile.id,
        email: profile.email,
        user_type: profile.user_type,
        is_verified: profile.is_verified,
      });

      if (profile.user_type !== 'admin') {
        console.error('❌❌❌ User is not admin:', {
          required: 'admin',
          actual: profile.user_type,
        });
        console.warn('🔓 Signing out user due to insufficient privileges...');
        await supabase.auth.signOut();
        throw new Error(`Access denied. Admin privileges required. Current user type: ${profile.user_type}. Update profile in Supabase.`);
      }

      console.error('✅✅✅ STEP 4 SUCCESS: User is admin ✅✅✅');
      console.warn('📋 STEP 5: Redirecting to admin dashboard...');

      // Step 5: Redirect to admin dashboard
      setSuccess(true);
      console.error('🔄🔄🔄 Calling router.push("/admin")...');
      
      try {
        router.push('/admin');
        console.error('✅ router.push() called successfully');
        
        console.warn('🔄 Calling router.refresh()...');
        router.refresh();
        console.error('✅ router.refresh() called successfully');
        
        console.warn('⏳ Waiting 2 seconds to check if redirect worked...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.error('📍📍📍 Current location after redirect attempt:', window.location.href);
        
      } catch (redirectError: any) {
        console.error('❌❌❌ Redirect error:', redirectError);
        throw new Error(`Redirect failed: ${redirectError.message}`);
      }

      console.error('✅✅✅ LOGIN COMPLETE - All steps successful ✅✅✅');

    } catch (err: any) {
      console.error('❌ LOGIN FAILED - Error caught:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        error: err,
      });
      
      const errorMessage = err.message || err.error_description || 'Login failed. Please try again.';
      setError(errorMessage);
      
      // Always show full error in console
      console.error('Full error object:', err);
      
    } finally {
      console.error('🏁🏁🏁 Login process finished, setting loading to false 🏁🏁🏁');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (resetError) throw resetError;

      setResetEmailSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
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
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">✅ Login Successful!</p>
                <p className="text-sm text-green-700 mt-1">Redirecting to admin dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <p className="text-xs text-red-600 mt-2">Check browser console (F12) for detailed logs.</p>
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
                  className="block w-full pl-10 pr-3 py-3.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base min-h-[44px]"
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                {!showResetPassword && (
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="text-gray-400" size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!showResetPassword}
                  disabled={showResetPassword}
                  className="block w-full pl-10 pr-3 py-3.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-base min-h-[44px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Submit Button or Reset Password */}
            {showResetPassword ? (
              <>
                {resetEmailSent ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 font-medium mb-2">
                      ✅ Password reset email sent!
                    </p>
                    <p className="text-sm text-green-700">
                      Check your email ({email}) for a password reset link. Click the link to reset your password.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetEmailSent(false);
                      }}
                      className="mt-4 text-sm text-red-600 hover:underline"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={loading || !email}
                      className="w-full bg-red-600 text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base min-h-[44px]"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={20} />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(false)}
                      className="w-full mt-3 border border-gray-300 text-gray-700 py-3.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base min-h-[44px]"
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
            )}
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

