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

interface ProtectionSettings {
  min_delay_seconds: number;
  max_delay_seconds: number;
  daily_limit: number;
  warmup_enabled: boolean;
  warmup_day: number;
  pause_every_n_messages: number;
  pause_duration_seconds: number;
  allowed_start_hour: number;
  allowed_end_hour: number;
  messages_sent_today: number;
  last_reset_date: string;
  consecutive_errors: number;
  max_consecutive_errors: number;
}

// Calculate daily limit based on warmup day
function getWarmupLimit(day: number, baseLimit: number): number {
  const warmupLimits: Record<number, number> = {
    1: 20,
    2: 35,
    3: 50,
    4: 75,
    5: 100,
  };
  return Math.min(warmupLimits[day] || baseLimit, baseLimit);
}

// Get random delay between min and max
function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
}

// Check if current hour is within allowed hours
function isWithinAllowedHours(startHour: number, endHour: number): boolean {
  const now = new Date();
  // Use Brazil timezone (UTC-3)
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const currentHour = brazilTime.getHours();
  return currentHour >= startHour && currentHour < endHour;
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

    // Get marketing settings with protection fields
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

    // Cast settings to include protection fields
    const protection: ProtectionSettings = {
      min_delay_seconds: settings.min_delay_seconds ?? 8,
      max_delay_seconds: settings.max_delay_seconds ?? 20,
      daily_limit: settings.daily_limit ?? 50,
      warmup_enabled: settings.warmup_enabled ?? true,
      warmup_day: settings.warmup_day ?? 1,
      pause_every_n_messages: settings.pause_every_n_messages ?? 10,
      pause_duration_seconds: settings.pause_duration_seconds ?? 30,
      allowed_start_hour: settings.allowed_start_hour ?? 8,
      allowed_end_hour: settings.allowed_end_hour ?? 20,
      messages_sent_today: settings.messages_sent_today ?? 0,
      last_reset_date: settings.last_reset_date ?? new Date().toISOString().split('T')[0],
      consecutive_errors: settings.consecutive_errors ?? 0,
      max_consecutive_errors: settings.max_consecutive_errors ?? 3,
    };

    // Reset daily counter if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (protection.last_reset_date !== today) {
      console.log('Resetting daily counter for new day');
      protection.messages_sent_today = 0;
      protection.consecutive_errors = 0;
      
      // Increment warmup day if warmup is enabled
      if (protection.warmup_enabled && protection.warmup_day < 5) {
        protection.warmup_day++;
      }
      
      await supabase
        .from('marketing_settings')
        .update({ 
          messages_sent_today: 0, 
          last_reset_date: today,
          consecutive_errors: 0,
          warmup_day: protection.warmup_day,
        })
        .eq('id', settings.id);
    }

    // Check business hours (skip in test mode)
    if (!test_mode && !isWithinAllowedHours(protection.allowed_start_hour, protection.allowed_end_hour)) {
      console.log('Outside allowed hours');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Envio permitido apenas entre ${protection.allowed_start_hour}h e ${protection.allowed_end_hour}h. Aguarde o horário comercial para proteção do seu número.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate effective daily limit (considering warmup)
    const effectiveLimit = protection.warmup_enabled 
      ? getWarmupLimit(protection.warmup_day, protection.daily_limit)
      : protection.daily_limit;
    
    console.log(`Protection settings: Day ${protection.warmup_day}, Limit ${effectiveLimit}, Sent today: ${protection.messages_sent_today}`);

    // Check daily limit (skip in test mode)
    if (!test_mode && protection.messages_sent_today >= effectiveLimit) {
      console.log('Daily limit reached');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Limite diário atingido (${effectiveLimit} mensagens). Aguarde amanhã para continuar. Dia de aquecimento: ${protection.warmup_day}/5.` 
        }),
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
    }

    // Calculate how many messages we can send today
    const remainingToday = effectiveLimit - protection.messages_sent_today;
    
    // Get pending contacts (respect daily limit)
    const query = supabase
      .from('marketing_contacts')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('status', 'pending');
    
    if (test_mode) {
      query.limit(1);
    } else {
      query.limit(remainingToday);
    }

    const { data: contacts, error: contactsError } = await query;

    if (contactsError || !contacts || contacts.length === 0) {
      console.log('No pending contacts');
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum contato pendente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${contacts.length} contacts (max ${remainingToday} remaining today)`);

    // Update campaign status
    await supabase
      .from('marketing_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign_id);

    const apiUrl = `${baseUrl}/api/v1/send_message`;
    const imageApiUrl = `${baseUrl}/api/v1/send_message_file_from_url`;
    
    let sentCount = campaign.sent_count || 0;
    let failedCount = 0;
    let consecutiveErrors = protection.consecutive_errors;
    let messagesSentThisSession = 0;
    let pausedDueToErrors = false;

    // Process contacts with intelligent delays
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // Check for consecutive errors threshold
      if (consecutiveErrors >= protection.max_consecutive_errors) {
        console.log(`Pausing campaign: ${consecutiveErrors} consecutive errors detected`);
        pausedDueToErrors = true;
        
        // Update settings with error count
        await supabase
          .from('marketing_settings')
          .update({ consecutive_errors: consecutiveErrors })
          .eq('id', settings.id);
        
        break;
      }

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

        console.log(`Sending to ${phone} (${i + 1}/${contacts.length})`);

        let response;

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
              caption: message,
            }),
          });
        } else {
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
          // Success - reset consecutive errors
          consecutiveErrors = 0;
          
          await supabase
            .from('marketing_contacts')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', contact.id);
          
          sentCount++;
          messagesSentThisSession++;
          
          await supabase
            .from('marketing_campaigns')
            .update({ sent_count: sentCount })
            .eq('id', campaign_id);
        } else {
          // Failed - increment consecutive errors
          consecutiveErrors++;
          
          await supabase
            .from('marketing_contacts')
            .update({ status: 'failed', error_message: responseText })
            .eq('id', contact.id);
          
          failedCount++;
        }

        // Update daily counter
        await supabase
          .from('marketing_settings')
          .update({ 
            messages_sent_today: protection.messages_sent_today + messagesSentThisSession,
            consecutive_errors: consecutiveErrors,
          })
          .eq('id', settings.id);

        // Apply intelligent delay between messages (not after last message)
        if (i < contacts.length - 1) {
          // Random delay between min and max
          const delay = getRandomDelay(protection.min_delay_seconds, protection.max_delay_seconds);
          console.log(`Waiting ${delay / 1000}s before next message`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Additional pause every N messages
          if ((i + 1) % protection.pause_every_n_messages === 0) {
            const pauseTime = protection.pause_duration_seconds * 1000;
            console.log(`Taking a ${protection.pause_duration_seconds}s break after ${i + 1} messages`);
            await new Promise(resolve => setTimeout(resolve, pauseTime));
          }
        }

      } catch (err) {
        console.error(`Error sending to ${contact.phone}:`, err);
        consecutiveErrors++;
        
        await supabase
          .from('marketing_contacts')
          .update({ status: 'failed', error_message: err instanceof Error ? err.message : 'Unknown error' })
          .eq('id', contact.id);
        failedCount++;
      }
    }

    // Determine final status
    let finalStatus = 'completed';
    let statusMessage = '';
    
    if (pausedDueToErrors) {
      finalStatus = 'paused';
      statusMessage = `Campanha pausada: ${protection.max_consecutive_errors} erros consecutivos detectados. Verifique a conexão do WhatsApp.`;
    } else if (sentCount === 0 && failedCount > 0) {
      finalStatus = 'failed';
      statusMessage = 'Todas as mensagens falharam. Verifique se o WhatsApp está conectado.';
    } else {
      // Check if there are more pending contacts (for partial completion)
      const { count } = await supabase
        .from('marketing_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign_id)
        .eq('status', 'pending');
      
      if (count && count > 0) {
        finalStatus = 'paused';
        statusMessage = `Limite diário atingido. ${count} contatos pendentes serão enviados amanhã.`;
      }
    }

    // Update campaign status
    await supabase
      .from('marketing_campaigns')
      .update({ 
        status: finalStatus,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        sent_count: sentCount,
      })
      .eq('id', campaign_id);

    console.log(`Campaign ${finalStatus}. Sent: ${sentCount}, Failed: ${failedCount}`);

    if (finalStatus === 'failed' || finalStatus === 'paused') {
      return new Response(
        JSON.stringify({ 
          success: finalStatus !== 'failed',
          status: finalStatus,
          message: statusMessage,
          sent: sentCount,
          failed: failedCount,
        }),
        { status: finalStatus === 'failed' ? 400 : 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: finalStatus,
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
