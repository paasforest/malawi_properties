'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { AdminDashboard } from '../../src/pages/AdminDashboard';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.user_type !== 'admin') {
        router.push('/admin/login');
        return;
      }
    };

    checkAuth();
  }, [router]);

  return <AdminDashboard />;
}

