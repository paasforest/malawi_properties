'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Shield, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export default function AdminSetupPage() {
  const [email, setEmail] = useState('admin@malawiproperties.com');
  const [password, setPassword] = useState('Admin123!@#');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkIfAdminExists();
  }, []);

  const checkIfAdminExists = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, user_type')
        .eq('user_type', 'admin')
        .limit(1);

      if (profiles && profiles.length > 0) {
        setStatus('Admin user already exists! You can login at /admin/login');
        setStep(3);
      }
    } catch (err) {
      console.error('Error checking admin:', err);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      setStatus('Step 1: Creating authentication user...');
      setStep(1);

      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/admin/login',
        }
      });

      if (authError) {
        // If user already exists, try to sign in
        if (authError.message.includes('already registered')) {
          setStatus('User already exists. Attempting to sign in and create profile...');
          
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) {
            throw new Error('User exists but password is incorrect. Please use the correct password.');
          }

          if (!signInData.user) {
            throw new Error('Failed to authenticate existing user.');
          }

          // Use existing user
          await createAdminProfile(signInData.user.id);
          return;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user. Please check your email for confirmation link.');
      }

      setStatus('Step 2: Creating admin profile...');
      setStep(2);

      // Step 2: Create admin profile
      await createAdminProfile(authData.user.id);

      setStatus('✅ Admin user created successfully! Redirecting to login...');
      setStep(3);

      // Wait a bit then redirect
      setTimeout(() => {
        router.push('/admin/login');
      }, 2000);

    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to create admin user. Please try again.');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const createAdminProfile = async (userId: string) => {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      // Update existing profile to admin
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'admin',
          is_verified: true,
          email: email,
        })
        .eq('id', userId);

      if (updateError) {
        // If update fails due to RLS, try insert with ON CONFLICT
        throw new Error('Failed to update profile. You may need to create it manually in Supabase SQL Editor.');
      }
    } else {
      // Create new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: 'Admin User',
          user_type: 'admin',
          is_verified: true,
          is_diaspora: false,
        });

      if (insertError) {
        // If insert fails, provide SQL to run manually
        console.error('Insert error:', insertError);
        throw new Error(
          `Failed to create profile automatically. Please run this SQL in Supabase:\n\n` +
          `INSERT INTO profiles (id, email, full_name, user_type, is_verified, is_diaspora)\n` +
          `VALUES ('${userId}', '${email}', 'Admin User', 'admin', true, false)\n` +
          `ON CONFLICT (id) DO UPDATE SET user_type = 'admin', is_verified = true;`
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Setup</h1>
          <p className="text-gray-600">Create your admin user</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1 whitespace-pre-wrap">{error}</p>
                </div>
              </div>
            </div>
          )}

          {status && !error && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                {step === 3 ? (
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                ) : (
                  <Loader className="text-blue-600 flex-shrink-0 mt-0.5 animate-spin" size={20} />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Status</p>
                  <p className="text-sm text-blue-700 mt-1">{status}</p>
                </div>
              </div>
            </div>
          )}

          {step < 3 && (
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="admin@malawiproperties.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    <span>Creating Admin User...</span>
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    <span>Create Admin User</span>
                  </>
                )}
              </button>
            </form>
          )}

          {step === 3 && !loading && (
            <div className="text-center">
              <CheckCircle className="text-green-600 mx-auto mb-4" size={48} />
              <p className="text-lg font-semibold text-gray-900 mb-2">Success!</p>
              <p className="text-gray-600 mb-6">Admin user has been created.</p>
              <a
                href="/admin/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Go to Login
              </a>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> If automatic setup fails, you can manually create the admin user in Supabase Dashboard.
            </p>
          </div>
        </div>

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



