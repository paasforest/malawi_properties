-- Temporarily disable the trigger to test if it's causing issues
-- Run this if user creation is failing

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- To re-enable later, run the trigger migration again

