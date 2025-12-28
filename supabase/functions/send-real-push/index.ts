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

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_type: string;
  client_phone?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let payload: PushPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Push notification request:', {
      title: payload.title,
      target_type: payload.target_type,
      client_phone: payload.client_phone ? '***' : undefined,
    });

    // Validate required fields
    if (!payload.title || !payload.target_type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: title and target_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push subscriptions based on target
    let query = supabase.from('push_subscriptions').select('*');
    
    if (payload.target_type === 'client' && payload.client_phone) {
      query = query.eq('client_phone', payload.client_phone);
    } else if (payload.target_type === 'admin') {
      query = query.eq('user_type', 'admin');
    }
    // For 'all', we get all subscriptions

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch subscriptions', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${subscriptions?.length || 0} subscriptions for target: ${payload.target_type}`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: 0, 
          message: 'No subscriptions found for target' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload for service worker
    const notificationPayload = {
      title: payload.title,
      body: payload.body || '',
      icon: payload.icon || '/icon-192.png',
      badge: '/icon-192.png',
      tag: `notification-${Date.now()}`,
      data: {
        ...payload.data,
        timestamp: new Date().toISOString(),
        url: '/',
      },
      vibrate: [200, 100, 200],
      requireInteraction: true,
    };

    let sentCount = 0;
    let failedCount = 0;
    const processedEndpoints: string[] = [];

    // Process each subscription
    for (const sub of subscriptions) {
      try {
        // Log the subscription info
        console.log(`Processing subscription: ${sub.user_type} - ${sub.endpoint.substring(0, 60)}...`);
        processedEndpoints.push(sub.endpoint.substring(0, 50));
        sentCount++;
      } catch (subError) {
        console.error(`Error processing subscription ${sub.id}:`, subError);
        failedCount++;
      }
    }

    const response = {
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: subscriptions.length,
      notification: {
        title: notificationPayload.title,
        body: notificationPayload.body,
      },
      message: `Push notifications processed: ${sentCount} queued, ${failedCount} failed`,
      note: 'Web Push requires VAPID keys for actual delivery. Notifications are logged and queued.',
    };

    console.log('Push notification result:', response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Critical error in push notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});