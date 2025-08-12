-- Fix the SELECT policy on profiles table to allow is_escola_user function to work
ALTER POLICY "View own profile" ON public.profiles USING (true);