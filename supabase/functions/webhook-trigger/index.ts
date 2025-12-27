import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  event_type: string;
  appointment_id?: string;
  client_name?: string;
  client_phone?: string;
  service_name?: string;
  barber_name?: string;
  date?: string;
  time?: string;
  queue_position?: number;
  shop_name?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: WebhookPayload = await req.json();
    console.log('Webhook trigger received:', payload);

    // Get webhook config for this event type
    const { data: webhookConfig, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('event_type', payload.event_type)
      .single();

    if (configError || !webhookConfig) {
      console.log('No webhook config found for event:', payload.event_type);
      return new Response(
        JSON.stringify({ success: false, message: 'No webhook configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhookConfig.is_active || !webhookConfig.webhook_url) {
      console.log('Webhook not active or no URL configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Webhook not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get message template
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('event_type', payload.event_type)
      .single();

    // Get shop settings for name
    const { data: shopSettings } = await supabase
      .from('shop_settings')
      .select('name')
      .limit(1)
      .single();

    const shopName = shopSettings?.name || 'Barbearia';

    // Replace variables in template
    let message = template?.template || '';
    message = message.replace(/\{\{nome_cliente\}\}/g, payload.client_name || '');
    message = message.replace(/\{\{nome_barbearia\}\}/g, shopName);
    message = message.replace(/\{\{serviço\}\}/g, payload.service_name || '');
    message = message.replace(/\{\{data\}\}/g, payload.date || '');
    message = message.replace(/\{\{hora\}\}/g, payload.time || '');
    message = message.replace(/\{\{posição_fila\}\}/g, String(payload.queue_position || ''));

    // Prepare webhook data
    const webhookData = {
      event_type: payload.event_type,
      timestamp: new Date().toISOString(),
      appointment_id: payload.appointment_id,
      client: {
        name: payload.client_name,
        phone: payload.client_phone,
      },
      service: payload.service_name,
      barber: payload.barber_name,
      date: payload.date,
      time: payload.time,
      queue_position: payload.queue_position,
      shop_name: shopName,
      message: message,
      template_title: template?.title || '',
    };

    console.log('Sending webhook to:', webhookConfig.webhook_url);
    console.log('Webhook data:', webhookData);

    // Send webhook
    const webhookResponse = await fetch(webhookConfig.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    console.log('Webhook response status:', webhookResponse.status);

    // Update last triggered timestamp
    await supabase
      .from('webhook_configs')
      .update({ last_triggered_at: new Date().toISOString() })
      .eq('event_type', payload.event_type);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook triggered successfully',
        webhook_response_status: webhookResponse.status,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error triggering webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});