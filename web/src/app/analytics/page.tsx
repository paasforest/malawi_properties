'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Analytics } from '../../views/Analytics';

export default function AnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Temporarily disabled strict checking - allow any authenticated user
      // const { data: profile } = await supabase
      //   .from('profiles')
      //   .select('user_type')
      //   .eq('id', user.id)
      //   .maybeSingle();

      // // Allow access to admin, agent, and owner (not buyers)
      // if (!['admin', 'agent', 'owner'].includes(profile?.user_type)) {
      //   router.push('/admin/login');
      //   return;
      // }
    };

    checkAuth();
  }, [router]);

  return <Analytics />;
}

