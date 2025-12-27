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

    // Get shop settings for name
    const { data: shopSettings } = await supabase
      .from('shop_settings')
      .select('name')
      .limit(1)
      .single();

    const shopName = shopSettings?.name || 'Barbearia';

    // Get message template
    const { data: template } = await supabase
      .from('message_templates')
      .select('*')
      .eq('event_type', payload.event_type)
      .single();

    // Replace variables in template
    let message = template?.template || '';
    message = message.replace(/\{\{nome_cliente\}\}/g, payload.client_name || '');
    message = message.replace(/\{\{nome_barbearia\}\}/g, shopName);
    message = message.replace(/\{\{serviço\}\}/g, payload.service_name || '');
    message = message.replace(/\{\{data\}\}/g, payload.date || '');
    message = message.replace(/\{\{hora\}\}/g, payload.time || '');
    message = message.replace(/\{\{posição_fila\}\}/g, String(payload.queue_position || ''));

    // Check ChatPro integration
    const { data: chatproConfig } = await supabase
      .from('chatpro_config')
      .select('*')
      .limit(1)
      .single();

    let chatproResult = null;
    
    // Send via ChatPro if enabled and configured
    if (chatproConfig?.is_enabled && chatproConfig?.api_token && chatproConfig?.instance_id && payload.client_phone) {
      // Check if this event should send via ChatPro
      const shouldSendChatPro = template?.chatpro_enabled !== false;
      
      if (shouldSendChatPro) {
        try {
          // Format phone number
          let phone = payload.client_phone.replace(/\D/g, '');
          if (!phone.startsWith('55')) {
            phone = '55' + phone;
          }

          const apiUrl = `${chatproConfig.base_endpoint}/${chatproConfig.instance_id}/api/v1/send_message`;
          
          console.log('Sending via ChatPro to:', phone);
          
          const chatproResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': chatproConfig.api_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: phone,
              message: message,
            }),
          });

          const responseText = await chatproResponse.text();
          console.log('ChatPro response:', chatproResponse.status, responseText);
          
          chatproResult = {
            success: chatproResponse.ok,
            status: chatproResponse.status,
            response: responseText,
          };
        } catch (chatproError) {
          console.error('ChatPro error:', chatproError);
          chatproResult = {
            success: false,
            error: chatproError instanceof Error ? chatproError.message : 'Unknown error',
          };
        }
      }
    }

    // Get webhook config for this event type (n8n webhooks)
    const { data: webhookConfig } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('event_type', payload.event_type)
      .single();

    let webhookResult = null;

    // Send to webhook if configured and active
    if (webhookConfig?.is_active && webhookConfig?.webhook_url) {
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

      try {
        const webhookResponse = await fetch(webhookConfig.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData),
        });

        console.log('Webhook response status:', webhookResponse.status);

        // Update last triggered timestamp
        await supabase
          .from('webhook_configs')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('event_type', payload.event_type);

        webhookResult = {
          success: webhookResponse.ok,
          status: webhookResponse.status,
        };
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        webhookResult = {
          success: false,
          error: webhookError instanceof Error ? webhookError.message : 'Unknown error',
        };
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed',
        chatpro: chatproResult,
        webhook: webhookResult,
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