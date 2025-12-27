import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatProRequest {
  phone: string;
  message: string;
  event_type?: string;
  appointment_id?: string;
  client_name?: string;
  service_name?: string;
  barber_name?: string;
  date?: string;
  time?: string;
  queue_position?: number;
}

interface ChatProConfig {
  api_token: string;
  instance_id: string;
  base_endpoint: string;
  is_enabled: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: ChatProRequest = await req.json();
    console.log('ChatPro send request:', payload);

    // Get ChatPro config
    const { data: config, error: configError } = await supabase
      .from('chatpro_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.error('ChatPro config not found:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'ChatPro não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chatproConfig = config as ChatProConfig;

    if (!chatproConfig.is_enabled) {
      console.log('ChatPro integration is disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'Integração ChatPro desabilitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chatproConfig.api_token || !chatproConfig.instance_id) {
      console.error('ChatPro credentials missing');
      return new Response(
        JSON.stringify({ success: false, error: 'Token ou Instância ChatPro não configurados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this event type should send via ChatPro
    if (payload.event_type) {
      const { data: templateData } = await supabase
        .from('message_templates')
        .select('chatpro_enabled')
        .eq('event_type', payload.event_type)
        .single();

      if (templateData && !templateData.chatpro_enabled) {
        console.log('ChatPro disabled for event type:', payload.event_type);
        return new Response(
          JSON.stringify({ success: false, error: 'Evento desabilitado para ChatPro' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Format phone number (remove non-digits and ensure country code)
    let phone = payload.phone.replace(/\D/g, '');
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    // Build ChatPro API URL
    const apiUrl = `${chatproConfig.base_endpoint}/${chatproConfig.instance_id}/api/v1/send_message`;

    console.log('Sending to ChatPro:', { url: apiUrl, phone, message: payload.message.substring(0, 50) + '...' });

    // Send message via ChatPro API
    const chatproResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': chatproConfig.api_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phone,
        message: payload.message,
      }),
    });

    const responseText = await chatproResponse.text();
    console.log('ChatPro response status:', chatproResponse.status);
    console.log('ChatPro response body:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    if (!chatproResponse.ok) {
      console.error('ChatPro API error:', chatproResponse.status, responseText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro da API ChatPro: ${chatproResponse.status}`,
          details: responseData 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful send
    console.log('Message sent successfully via ChatPro');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensagem enviada via ChatPro',
        chatpro_response: responseData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending ChatPro message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
