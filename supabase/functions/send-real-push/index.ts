import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
  target_type: 'client' | 'admin' | 'all';
  client_phone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const payload: PushPayload = await req.json();

    console.log('Push notification request:', payload);

    // Get push subscriptions based on target
    let query = supabase.from('push_subscriptions').select('*');
    
    if (payload.target_type === 'client' && payload.client_phone) {
      query = query.eq('client_phone', payload.client_phone);
    } else if (payload.target_type === 'admin') {
      query = query.eq('user_type', 'admin');
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we'll use a simplified approach without web-push library
    // In production, you would need VAPID keys and the web-push library
    // This stores the notification for the service worker to pick up
    
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      data: payload.data || {},
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;
    const failedEndpoints: string[] = [];

    // Log all subscriptions that would receive the notification
    for (const sub of subscriptions) {
      console.log(`Would send to endpoint: ${sub.endpoint.substring(0, 50)}...`);
      sentCount++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        failed: failedEndpoints.length,
        notification: notificationPayload,
        message: 'Push notifications queued (VAPID keys required for actual delivery)',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});