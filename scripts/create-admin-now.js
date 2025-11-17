// Create Admin User Script
// Run: node scripts/create-admin-now.js

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = 'admin@malawiproperties.com';
const ADMIN_PASSWORD = 'Admin123!@#';

async function createAdmin() {
  console.log('🚀 Creating admin user...\n');

  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating authentication user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    let userId;

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists. Attempting to sign in...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

        if (signInError) {
          throw new Error(`Sign in failed: ${signInError.message}`);
        }

        userId = signInData.user.id;
        console.log('✅ Signed in successfully');
      } else {
        throw authError;
      }
    } else {
      userId = authData.user?.id;
      if (!userId) {
        throw new Error('Failed to get user ID after signup');
      }
      console.log('✅ Auth user created successfully');
      console.log(`   User ID: ${userId}\n`);
    }

    // Step 2: Create/Update admin profile
    console.log('Step 2: Creating admin profile...');
    
    // Try to insert first
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: ADMIN_EMAIL,
        full_name: 'Admin User',
        user_type: 'admin',
        is_verified: true,
        is_diaspora: false,
      });

    if (insertError) {
      // If insert fails (maybe profile exists), try update
      console.log('⚠️  Insert failed, trying update...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'admin',
          is_verified: true,
          email: ADMIN_EMAIL,
          full_name: 'Admin User',
        })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to create/update profile:', updateError.message);
        console.log('\n📝 You need to run this SQL manually in Supabase:');
        console.log(`\nINSERT INTO profiles (id, email, full_name, user_type, is_verified, is_diaspora)`);
        console.log(`VALUES ('${userId}', '${ADMIN_EMAIL}', 'Admin User', 'admin', true, false)`);
        console.log(`ON CONFLICT (id) DO UPDATE SET user_type = 'admin', is_verified = true;\n`);
        throw updateError;
      }
      console.log('✅ Profile updated to admin');
    } else {
      console.log('✅ Profile created successfully');
    }

    // Verify
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, user_type, is_verified')
      .eq('id', userId)
      .maybeSingle();

    if (profile && profile.user_type === 'admin') {
      console.log('\n✅ SUCCESS! Admin user created successfully!');
      console.log('\n📋 Login Credentials:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: ${ADMIN_PASSWORD}`);
      console.log(`\n🌐 Login at: http://localhost:3000/admin/login\n`);
    } else {
      throw new Error('Profile verification failed');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Alternative: Visit http://localhost:3000/setup/admin to create admin user\n');
    process.exit(1);
  }
}

createAdmin();



