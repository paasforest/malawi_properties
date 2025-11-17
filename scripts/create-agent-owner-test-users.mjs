import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_USERS = [
  {
    role: 'agent',
    profile: {
      email: 'agent.testing@malawiproperties.com',
      password: 'AgentDemo123!',
      full_name: 'Demo Agent',
      phone: '+265999000111',
      current_location: 'Lilongwe, Malawi',
      is_diaspora: false,
      user_type: 'agent',
    },
    agentProfile: {
      company_name: 'Demo Real Estate',
      license_number: 'AGENT-DEMO-001',
      districts_covered: ['Lilongwe', 'Blantyre'],
      verification_status: 'verified',
    },
  },
  {
    role: 'owner',
    profile: {
      email: 'owner.testing@malawiproperties.com',
      password: 'OwnerDemo123!',
      full_name: 'Demo Property Owner',
      phone: '+265888111222',
      current_location: 'Blantyre, Malawi',
      is_diaspora: false,
      user_type: 'owner',
    },
  },
];

async function ensureProfile(userId, data) {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      user_type: data.user_type,
      current_location: data.current_location,
      is_diaspora: data.is_diaspora,
    }, { onConflict: 'id' });

  if (error) throw error;
}

async function ensureAgent(userId, agentData) {
  const { data: existing } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('agents')
    .insert({
      user_id: userId,
      ...agentData,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function createUser(testUser) {
  const { profile, agentProfile } = testUser;
  console.log(`\n➡️  Creating ${testUser.role} user: ${profile.email}`);

  let authUserId;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: profile.email,
    password: profile.password,
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('   ⚠️  User already exists, signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: profile.password,
      });
      if (signInError) throw signInError;
      authUserId = signInData.user?.id;
    } else {
      throw signUpError;
    }
  } else {
    authUserId = signUpData.user?.id;
  }

  if (!authUserId) throw new Error('Failed to resolve auth user ID');

  await ensureProfile(authUserId, profile);
  console.log('   ✅ Profile ensured');

  if (testUser.role === 'agent' && agentProfile) {
    await ensureAgent(authUserId, agentProfile);
    console.log('   ✅ Agent profile ensured');
  }

  await supabase.auth.signOut();
  console.log('   ✅ Auth session cleared');
}

(async () => {
  try {
    for (const user of TEST_USERS) {
      await createUser(user);
    }
    console.log('\n🎉 Test agent & owner users are ready!');
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
    process.exit(1);
  }
})();
