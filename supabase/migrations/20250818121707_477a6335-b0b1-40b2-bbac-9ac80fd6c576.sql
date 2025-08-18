-- Add user-specific RLS policies for password_reset_tokens table
-- This ensures users can only access their own password reset tokens

-- Allow users to read only their own password reset tokens
CREATE POLICY "Users can view their own password reset tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (user_id = auth.uid());

-- Allow users to update only their own password reset tokens (for marking as used)
CREATE POLICY "Users can update their own password reset tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());