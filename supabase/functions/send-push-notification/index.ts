import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { subscription, title, body, icon, data } = await req.json();

    if (!subscription || !title) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we store push subscriptions in localStorage on client
    // This edge function is a placeholder for future Web Push implementation
    // with VAPID keys for real background push notifications

    console.log('Push notification request:', { title, body, data });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification queued',
        // In production, this would use web-push library with VAPID keys
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
