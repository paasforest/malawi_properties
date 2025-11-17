-- Auto-create profile when user signs up
-- This bypasses RLS issues and email validation problems

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_type_val user_type;
  is_diaspora_val boolean;
BEGIN
  -- Safely extract user_type from metadata
  BEGIN
    user_type_val := (NEW.raw_user_meta_data->>'user_type')::user_type;
  EXCEPTION WHEN OTHERS THEN
    user_type_val := 'buyer';
  END;

  -- Safely extract is_diaspora from metadata
  BEGIN
    is_diaspora_val := COALESCE((NEW.raw_user_meta_data->>'is_diaspora')::boolean, false);
  EXCEPTION WHEN OTHERS THEN
    is_diaspora_val := false;
  END;

  -- Insert profile with error handling
  INSERT INTO public.profiles (id, email, full_name, user_type, is_diaspora)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    user_type_val,
    is_diaspora_val
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the user creation
  RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';

