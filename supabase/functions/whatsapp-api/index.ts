import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-instance-token',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected path: /whatsapp-api/{instanceId}/{action}
    // e.g., /whatsapp-api/abc123/send
    const instanceId = pathParts[1];
    const action = pathParts[2] || 'status';
    
    if (!instanceId) {
      return new Response(
        JSON.stringify({ error: 'Instance ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get instance token from header
    const instanceToken = req.headers.get('x-instance-token');
    
    if (!instanceToken) {
      return new Response(
        JSON.stringify({ error: 'Instance token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate instance and token
    const { data: instance, error: instanceError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('id', instanceId)
      .eq('instance_token', instanceToken)
      .maybeSingle();

    if (instanceError || !instance) {
      console.log('Instance validation failed:', instanceError);
      return new Response(
        JSON.stringify({ error: 'Invalid instance ID or token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get backend config
    const { data: backendConfig, error: configError } = await supabase
      .from('whatsapp_backend_config')
      .select('*')
      .maybeSingle();

    if (configError) {
      console.log('Config fetch error:', configError);
    }

    const backendUrl = backendConfig?.backend_url;
    const masterToken = backendConfig?.master_token;

    // If no backend configured, return appropriate response
    if (!backendUrl || !backendConfig?.is_connected) {
      console.log('Backend not configured or not connected');
      
      // Return mock/prepared response based on action
      switch (action) {
        case 'status':
          return new Response(
            JSON.stringify({
              success: true,
              instance_id: instanceId,
              name: instance.name,
              status: instance.status,
              phone_number: instance.phone_number,
              last_seen: instance.last_seen,
              auto_reply_enabled: instance.auto_reply_enabled,
              backend_connected: false,
              message: 'Backend not configured. Actions are disabled.',
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        case 'send':
          // Log the attempted send
          const body = await req.json().catch(() => ({}));
          
          await supabase
            .from('whatsapp_message_logs')
            .insert({
              instance_id: instanceId,
              direction: 'outgoing',
              phone_to: body.phone || 'unknown',
              message: body.message || '',
              status: 'failed',
              error_message: 'Backend not configured',
            });
          
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Backend not configured. Message queued for when backend is online.',
              instance_id: instanceId,
            }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        case 'qrcode':
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Backend not configured. Cannot generate QR code.',
              instance_id: instanceId,
            }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        case 'connect':
        case 'disconnect':
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Backend not configured. Cannot perform connection actions.',
              instance_id: instanceId,
            }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          
        default:
          return new Response(
            JSON.stringify({ error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    // Backend is configured - proxy the request
    console.log(`Proxying ${action} request to backend: ${backendUrl}`);
    
    const backendEndpoint = `${backendUrl}/api/instance/${instanceId}/${action}`;
    
    try {
      const proxyResponse = await fetch(backendEndpoint, {
        method: req.method,
        headers: {
          'Authorization': `Bearer ${masterToken}`,
          'Content-Type': 'application/json',
          'X-Instance-Token': instanceToken,
        },
        body: req.method !== 'GET' ? await req.text() : undefined,
      });

      const responseData = await proxyResponse.text();
      
      // If it's a send action and successful, log it
      if (action === 'send' && proxyResponse.ok) {
        try {
          const sendData = JSON.parse(responseData);
          const originalBody = await req.clone().json().catch(() => ({}));
          
          await supabase
            .from('whatsapp_message_logs')
            .insert({
              instance_id: instanceId,
              direction: 'outgoing',
              phone_to: originalBody.phone || 'unknown',
              message: originalBody.message || '',
              status: 'sent',
            });
        } catch (logError) {
          console.error('Error logging message:', logError);
        }
      }

      return new Response(responseData, {
        status: proxyResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    } catch (proxyError: unknown) {
      console.error('Backend proxy error:', proxyError);
      
      // Mark backend as disconnected
      await supabase
        .from('whatsapp_backend_config')
        .update({ is_connected: false })
        .eq('id', backendConfig.id);
      
      const errorMessage = proxyError instanceof Error ? proxyError.message : 'Unknown error';
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Backend is unreachable. Please check your server.',
          details: errorMessage,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: unknown) {
    console.error('WhatsApp API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});