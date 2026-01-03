-- Add UPDATE policy for genesis_credits so users can receive their welcome bonus
CREATE POLICY "Users can update own credits for welcome bonus"
ON public.genesis_credits
FOR UPDATE
USING (user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM public.genesis_users WHERE auth_user_id = auth.uid()));