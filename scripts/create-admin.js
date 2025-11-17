// Admin User Creation Script
// Run this in Node.js or Supabase SQL Editor

// This script creates an admin user in Supabase
// You need to run this in Supabase SQL Editor or use Supabase Admin API

const createAdminUser = `
-- Step 1: Create the auth user (do this in Supabase Dashboard > Authentication > Add User first)
-- Then run this SQL with the USER_ID from step 1:

-- Replace these values:
-- 'USER_ID_FROM_AUTH' - Get this from Supabase Dashboard > Authentication > Users after creating user
-- 'admin@malawiproperties.com' - Your admin email
-- 'Admin User' - Your admin name

INSERT INTO profiles (
  id,
  email,
  full_name,
  user_type,
  is_verified,
  is_diaspora
) VALUES (
  'USER_ID_FROM_AUTH',  -- Replace with actual user ID
  'admin@malawiproperties.com',  -- Replace with your email
  'Admin User',  -- Replace with your name
  'admin',
  true,
  false
)
ON CONFLICT (id) DO UPDATE
SET user_type = 'admin',
    is_verified = true;
`;

console.log('Admin User Creation SQL:');
console.log(createAdminUser);
console.log('\n---\n');
console.log('INSTRUCTIONS:');
console.log('1. Go to Supabase Dashboard > Authentication > Users');
console.log('2. Click "Add User" and create a user with:');
console.log('   - Email: admin@malawiproperties.com');
console.log('   - Password: YourSecurePassword123!');
console.log('   - Copy the User ID that gets generated');
console.log('3. Go to SQL Editor in Supabase');
console.log('4. Replace USER_ID_FROM_AUTH in the SQL above with the User ID');
console.log('5. Run the SQL query');
console.log('6. Login at http://localhost:3000/admin/login');

module.exports = createAdminUser;



