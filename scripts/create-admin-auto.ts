/**
 * Automatic Admin User Creation Script
 * 
 * This script automatically creates an admin user in Supabase.
 * 
 * Usage:
 * 1. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * 2. Run: npx tsx scripts/create-admin-auto.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure .env.local exists with:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = 'admin@malawiproperties.com';
const ADMIN_PASSWORD = 'Admin123!@#';
const ADMIN_NAME = 'Admin User';

async function createAdminUser() {
  console.log('🚀 Starting admin user creation...\n');

  try {
    // Step 1: Create auth user
    console.log('Step 1: Creating authentication user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User already exists. Attempting to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });

        if (signInError) {
          throw new Error(`Failed to sign in: ${signInError.message}`);
        }

        if (!signInData.user) {
          throw new Error('Failed to authenticate user');
        }

        console.log('✅ Signed in successfully');
        await createAdminProfile(signInData.user.id);
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Failed to create user. Check email confirmation.');
    }

    console.log('✅ Auth user created successfully');
    console.log(`   User ID: ${authData.user.id}\n`);

    // Step 2: Create admin profile
    console.log('Step 2: Creating admin profile...');
    await createAdminProfile(authData.user.id);

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n🌐 Login at: http://localhost:3000/admin/login\n`);

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('profiles')) {
      console.error('\n⚠️  Profile creation failed. You need to run this SQL manually in Supabase:');
      console.error('\n--- SQL START ---');
      console.error(`INSERT INTO profiles (id, email, full_name, user_type, is_verified, is_diaspora)`);
      console.error(`VALUES ('GET_USER_ID_FROM_SUPABASE', '${ADMIN_EMAIL}', '${ADMIN_NAME}', 'admin', true, false);`);
      console.error('--- SQL END ---\n');
      console.error('Steps:');
      console.error('1. Go to Supabase Dashboard > Authentication > Users');
      console.error('2. Find the user you just created');
      console.error('3. Copy the User ID');
      console.error('4. Replace GET_USER_ID_FROM_SUPABASE in the SQL above');
      console.error('5. Run the SQL in Supabase SQL Editor\n');
    }
    
    process.exit(1);
  }
}

async function createAdminProfile(userId: string) {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, user_type')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile) {
    // Update to admin
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        is_verified: true,
        email: ADMIN_EMAIL,
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}. You may need admin access to update.`);
    }
    console.log('✅ Profile updated to admin');
  } else {
    // Create new profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: ADMIN_EMAIL,
        full_name: ADMIN_NAME,
        user_type: 'admin',
        is_verified: true,
        is_diaspora: false,
      });

    if (insertError) {
      throw new Error(`Failed to create profile: ${insertError.message}`);
    }
    console.log('✅ Profile created successfully');
  }

  // Verify
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, user_type, is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || profile.user_type !== 'admin') {
    throw new Error('Profile verification failed. Admin user may not have been created correctly.');
  }

  console.log('✅ Admin profile verified');
}

// Run the script
createAdminUser();



