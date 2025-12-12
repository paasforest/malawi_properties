'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setData({ error: 'Not logged in', userError: userError?.message });
          setLoading(false);
          return;
        }

        // Get profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setData({
          user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
          },
          profile: profile,
          profileError: profileError?.message,
          hasAccess: ['admin', 'agent', 'owner'].includes(profile?.user_type),
        });
      } catch (e: any) {
        setData({ error: e.message });
      } finally {
        setLoading(false);
      }
    };

    checkProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Profile Debug Information</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-semibold mb-4">Current User Info</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>

        {data?.profile && (
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h2 className="text-xl font-semibold mb-4">Access Check</h2>
            <div className="space-y-2">
              <p><strong>User Type:</strong> <span className="font-mono bg-yellow-100 px-2 py-1 rounded">{data.profile.user_type || 'NOT SET'}</span></p>
              <p><strong>Has Access to Intelligence/Analytics:</strong> 
                <span className={`ml-2 px-3 py-1 rounded font-semibold ${data.hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {data.hasAccess ? '✅ YES' : '❌ NO'}
                </span>
              </p>
              <p><strong>Allowed Types:</strong> admin, agent, owner</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Take a screenshot of this page</li>
            <li>Share it with the developer</li>
            <li>This shows your exact user_type in the database</li>
          </ol>
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}

