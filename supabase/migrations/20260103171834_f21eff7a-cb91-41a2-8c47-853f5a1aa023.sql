-- Fix RLS for whatsapp_automation_rules to allow Genesis users to create flows
CREATE POLICY "Users can insert their own automation rules"
ON public.whatsapp_automation_rules
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own automation rules"
ON public.whatsapp_automation_rules
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own automation rules"
ON public.whatsapp_automation_rules
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own automation rules"
ON public.whatsapp_automation_rules
FOR DELETE
USING (auth.uid() IS NOT NULL);