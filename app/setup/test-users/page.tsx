'use client';

import { useState } from 'react';
import { supabase } from '../../../src/lib/supabase';
import { CheckCircle, XCircle, User, Building2, Loader2 } from 'lucide-react';

interface TestUser {
  email: string;
  password: string;
  name: string;
  user_type: 'buyer' | 'agent' | 'owner';
  is_diaspora?: boolean;
  current_location?: string;
}

const TEST_USERS: TestUser[] = [
  {
    email: 'test.buyer@example.com',
    password: 'TestBuyer123!',
    name: 'Test Buyer',
    user_type: 'buyer',
    is_diaspora: false,
    current_location: 'Lilongwe, Malawi',
  },
  {
    email: 'test.buyer.diaspora@example.com',
    password: 'TestBuyer123!',
    name: 'Diaspora Buyer',
    user_type: 'buyer',
    is_diaspora: true,
    current_location: 'Johannesburg, South Africa',
  },
  {
    email: 'test.seller@example.com',
    password: 'TestSeller123!',
    name: 'Test Seller',
    user_type: 'owner',
    is_diaspora: false,
    current_location: 'Blantyre, Malawi',
  },
  {
    email: 'test.agent@example.com',
    password: 'TestAgent123!',
    name: 'Test Agent',
    user_type: 'agent',
    is_diaspora: false,
    current_location: 'Lilongwe, Malawi',
  },
];

export default function TestUsersSetupPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);

  const createTestUser = async (user: TestUser) => {
    try {
      let userId: string | undefined;

      // Step 1: Try to sign up (creates new user and authenticates)
      // Pass metadata so trigger can auto-create profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.name,
            user_type: user.user_type,
            is_diaspora: user.is_diaspora || false,
            current_location: user.current_location || null,
          }
        }
      });

      if (authError) {
        // If user already exists, try to sign in instead
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: user.password,
          });

          if (signInError) {
            throw new Error(`User exists but can't sign in: ${signInError.message}`);
          }

          userId = signInData.user.id;
        } else {
          // Log the full error for debugging
          console.error('Auth signup error:', {
            message: authError.message,
            status: authError.status,
            error: authError
          });
          throw new Error(`Signup failed: ${authError.message || 'Unknown error'}`);
        }
      } else {
        userId = authData.user?.id;
        if (!userId) {
          console.error('No user ID returned from signup:', authData);
          throw new Error('Signup succeeded but no user ID returned');
        }
      }

      if (!userId) {
        throw new Error('Failed to get user ID');
      }
      
      console.log('User created successfully, ID:', userId);

      // Wait a moment for trigger to potentially create profile
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Check if profile was auto-created by trigger, if not create it manually
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        // Profile wasn't auto-created, create it manually (while authenticated)
        const profileData: any = {
          id: userId,
          email: user.email,
          full_name: user.name,
          user_type: user.user_type,
          is_diaspora: user.is_diaspora || false,
          current_location: user.current_location || null,
        };

        // Only add these fields if columns exist (from migration 20251118000002)
        // Try to include them, but don't fail if columns don't exist
        try {
          profileData.buyer_origin_type = user.is_diaspora ? 'diaspora' : 'local';
          profileData.local_origin_city = !user.is_diaspora && user.current_location ? 'Lilongwe' : null;
        } catch (e) {
          // Columns might not exist, that's okay
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profileData, {
            onConflict: 'id',
          });

        if (profileError) {
          // If error is about missing columns, try without them
          if (profileError.message.includes('column') && profileError.message.includes('does not exist')) {
            const basicProfileData = {
              id: userId,
              email: user.email,
              full_name: user.name,
              user_type: user.user_type,
              is_diaspora: user.is_diaspora || false,
              current_location: user.current_location || null,
            };
            
            const { error: retryError } = await supabase
              .from('profiles')
              .upsert(basicProfileData, { onConflict: 'id' });
            
            if (retryError) {
              await supabase.auth.signOut();
              throw new Error(`Failed to create profile: ${retryError.message}`);
            }
          } else {
            await supabase.auth.signOut();
            throw new Error(`Failed to create profile: ${profileError.message}`);
          }
        }
      } else {
        // Profile exists, update it with our data
        const updateData: any = {
          email: user.email,
          full_name: user.name,
          user_type: user.user_type,
          is_diaspora: user.is_diaspora || false,
          current_location: user.current_location || null,
        };

        // Try to include optional fields
        try {
          updateData.buyer_origin_type = user.is_diaspora ? 'diaspora' : 'local';
          updateData.local_origin_city = !user.is_diaspora && user.current_location ? 'Lilongwe' : null;
        } catch (e) {
          // Columns might not exist
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          // If error is about missing columns, try without them
          if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
            const basicUpdateData = {
              email: user.email,
              full_name: user.name,
              user_type: user.user_type,
              is_diaspora: user.is_diaspora || false,
              current_location: user.current_location || null,
            };
            
            const { error: retryError } = await supabase
              .from('profiles')
              .update(basicUpdateData)
              .eq('id', userId);
            
            if (retryError) {
              await supabase.auth.signOut();
              throw new Error(`Failed to update profile: ${retryError.message}`);
            }
          } else {
            await supabase.auth.signOut();
            throw new Error(`Failed to update profile: ${updateError.message}`);
          }
        }
      }

      // Step 3: If agent, create agent profile
      if (user.user_type === 'agent') {
        const { error: agentError } = await supabase
          .from('agents')
          .upsert({
            user_id: userId,
            company_name: 'Test Real Estate Agency',
            license_number: 'TEST-LICENSE-001',
            districts_covered: ['Lilongwe', 'Blantyre'],
            verification_status: 'verified',
          }, {
            onConflict: 'user_id',
          });

        if (agentError && !agentError.message.includes('duplicate')) {
          await supabase.auth.signOut();
          throw agentError;
        }
      }

      // Step 4: Sign out after creating profile
      await supabase.auth.signOut();

      return { success: true, message: 'Created successfully' };
    } catch (error: any) {
      // Make sure we're signed out on error
      await supabase.auth.signOut();
      
      // Provide more detailed error message
      let errorMessage = 'Failed to create user';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString) {
        errorMessage = error.toString();
      }
      
      console.error('Error creating test user:', {
        error,
        message: errorMessage,
        stack: error?.stack,
        details: error
      });
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const handleCreateAll = async () => {
    setLoading(true);
    setResults({});
    setCreatedUsers([]);

    for (const user of TEST_USERS) {
      const result = await createTestUser(user);
      setResults((prev) => ({ ...prev, [user.email]: result }));
      
      if (result.success) {
        setCreatedUsers((prev) => [...prev, user.email]);
      }

      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
  };

  const handleCreateSingle = async (user: TestUser) => {
    setLoading(true);
    const result = await createTestUser(user);
    setResults((prev) => ({ ...prev, [user.email]: result }));
    
    if (result.success) {
      setCreatedUsers((prev) => [...prev, user.email]);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Test Users</h1>
            <p className="text-gray-600">
              Create test buyer and seller accounts to test the dashboards
            </p>
          </div>

          <div className="mb-6">
            <button
              onClick={handleCreateAll}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Creating Users...
                </>
              ) : (
                <>
                  <User size={20} />
                  Create All Test Users
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            {TEST_USERS.map((user) => {
              const result = results[user.email];
              const isCreated = createdUsers.includes(user.email);

              return (
                <div
                  key={user.email}
                  className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {user.user_type === 'buyer' ? (
                          <User className="text-blue-600" size={24} />
                        ) : (
                          <Building2 className="text-green-600" size={24} />
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 font-medium text-gray-900 capitalize">
                            {user.user_type}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Password:</span>
                          <span className="ml-2 font-mono text-gray-900">{user.password}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <span className="ml-2 text-gray-900">{user.current_location}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Diaspora:</span>
                          <span className="ml-2 text-gray-900">
                            {user.is_diaspora ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {result && (
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <>
                              <CheckCircle className="text-green-600" size={24} />
                              <span className="text-green-600 text-sm font-medium">Created</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="text-red-600" size={24} />
                              <span className="text-red-600 text-sm font-medium">Error</span>
                            </>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleCreateSingle(user)}
                        disabled={loading || isCreated}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCreated ? 'Created' : 'Create'}
                      </button>
                    </div>
                  </div>
                  {result && !result.success && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{result.message}</p>
                    </div>
                  )}
                  {result && result.success && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700 font-medium mb-2">✅ User created!</p>
                      <div className="text-xs text-green-600 space-y-1">
                        <p>📧 Email: {user.email}</p>
                        <p>🔑 Password: {user.password}</p>
                        <p>
                          📍 Dashboard:{' '}
                          {user.user_type === 'buyer' ? (
                            <a href="/buyer" className="underline">/buyer</a>
                          ) : (
                            <a href="/dashboard" className="underline">/dashboard</a>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {createdUsers.length > 0 && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-4">✅ Test Users Created!</h3>
              <div className="space-y-2 text-sm">
                <p className="text-blue-800 mb-3">
                  You can now log in with any of these accounts:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TEST_USERS.filter(u => createdUsers.includes(u.email)).map((user) => (
                    <div key={user.email} className="bg-white p-4 rounded-lg border border-blue-200">
                      <div className="font-semibold text-gray-900 mb-1">{user.name}</div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>📧 {user.email}</p>
                        <p>🔑 {user.password}</p>
                        <p>
                          🏠{' '}
                          <a
                            href={user.user_type === 'buyer' ? '/buyer' : '/dashboard'}
                            className="text-blue-600 hover:underline"
                          >
                            Go to Dashboard →
                          </a>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <a
                    href="/"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Go to Login Page →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

