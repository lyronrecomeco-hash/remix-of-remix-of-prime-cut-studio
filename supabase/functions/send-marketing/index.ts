import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketingRequest {
  campaign_id: string;
  test_mode?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { campaign_id, test_mode }: MarketingRequest = await req.json();
    console.log('Starting marketing campaign:', campaign_id, test_mode ? '(TEST MODE)' : '');

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign not found:', campaignError);
      return new Response(
        JSON.stringify({ success: false, error: 'Campanha não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get marketing settings
    const { data: settings } = await supabase
      .from('marketing_settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings?.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'Modo Marketing desativado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ChatPro config
    const { data: chatproConfig } = await supabase
      .from('chatpro_config')
      .select('*')
      .limit(1)
      .single();

    if (!chatproConfig?.is_enabled || !chatproConfig?.api_token || !chatproConfig?.instance_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ChatPro não configurado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pre-flight check: Verify ChatPro connection status
    let baseUrl = chatproConfig.base_endpoint.replace(/\/$/, '');
    const statusUrl = `${baseUrl}/api/v1/status`;
    
    try {
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': chatproConfig.api_token,
        },
      });
      
      const statusData = await statusResponse.json();
      console.log('ChatPro status:', JSON.stringify(statusData));
      
      // Check if WhatsApp is connected
      if (!statusResponse.ok || statusData?.connected === false || statusData?.status === 'disconnected') {
        console.error('ChatPro WhatsApp not connected');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'WhatsApp não está conectado no ChatPro. Acesse o painel do ChatPro e escaneie o QR Code.' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (statusError) {
      console.log('Could not check ChatPro status, proceeding anyway:', statusError);
      // Continue anyway - status check is optional
    }

    // Get pending contacts (limit to 1 in test mode)
    const query = supabase
      .from('marketing_contacts')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending');
    
    if (test_mode) {
      query.limit(1);
    }

    const { data: contacts, error: contactsError } = await query;

    if (contactsError || !contacts || contacts.length === 0) {
      console.log('No pending contacts');
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum contato pendente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update campaign status
    await supabase
      .from('marketing_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id);

    // Use baseUrl already defined from status check
    const apiUrl = `${baseUrl}/api/v1/send_message`;
    const imageApiUrl = `${baseUrl}/api/v1/send_message_file_from_url`; // Correct endpoint for images with caption
    const delayMs = (settings.delay_between_messages || 3) * 1000;
    
    let sentCount = campaign.sent_count || 0;
    let failedCount = 0;

    // Process contacts
    for (const contact of contacts) {
      try {
        // Format phone
        let phone = contact.phone.replace(/\D/g, '');
        if (!phone.startsWith('55')) {
          phone = '55' + phone;
        }

        // Replace variables in message
        let message = campaign.message_template;
        message = message.replace(/\{\{nome\}\}/g, contact.name || '');

        // Add button if configured
        if (campaign.button_text && campaign.button_url) {
          message += `\n\n━━━━━━━━━━━━━━━\n🔗 *${campaign.button_text}*\n👉 ${campaign.button_url}`;
        }

        console.log(`Sending to ${phone}`);

        let response;

        // Send image WITH message as caption if image exists
        if (campaign.image_url) {
          console.log(`Sending image with message to ${phone}`);
          response = await fetch(imageApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': chatproConfig.api_token,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: phone,
              url: campaign.image_url,
              caption: message, // Send message as caption with the image
            }),
          });
        } else {
          // Send text message only if no image
          response = await fetch(apiUrl, {
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
        }

        const responseText = await response.text();
        console.log(`Response for ${phone}:`, response.status, responseText);

        if (response.ok) {
          // Mark contact as sent
          await supabase
            .from('marketing_contacts')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', contact.id);
          
          sentCount++;
          
          // Update campaign progress
          await supabase
            .from('marketing_campaigns')
            .update({ sent_count: sentCount })
            .eq('id', campaign_id);
        } else {
          // Mark as failed
          await supabase
            .from('marketing_contacts')
            .update({ status: 'failed', error_message: responseText })
            .eq('id', contact.id);
          
          failedCount++;
        }

        // Delay between messages
        await new Promise(resolve => setTimeout(resolve, delayMs));

      } catch (err) {
        console.error(`Error sending to ${contact.phone}:`, err);
        await supabase
          .from('marketing_contacts')
          .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' })
          .eq('id', contact.id);
        failedCount++;
      }
    }

    // Determine final status based on results
    const allFailed = sentCount === 0 && failedCount > 0;
    const finalStatus = allFailed ? 'failed' : 'completed';
    
    // Update campaign status
    await supabase
      .from('marketing_campaigns')
      .update({ 
        status: finalStatus,
        completed_at: new Date().toISOString(),
        sent_count: sentCount,
      })
      .eq('id', campaign_id);

    console.log(`Campaign ${finalStatus}. Sent: ${sentCount}, Failed: ${failedCount}`);

    // Return appropriate response
    if (allFailed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Todas as mensagens falharam. Verifique se o WhatsApp está conectado no ChatPro.',
          sent: sentCount,
          failed: failedCount,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount,
        failed: failedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Marketing campaign error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
