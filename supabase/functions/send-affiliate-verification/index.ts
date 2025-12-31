import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate 6-digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

Deno.serve(async (req) => {
  console.log('=== SEND AFFILIATE VERIFICATION STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { name, email, phone, password_hash } = await req.json();

    if (!name || !email || !phone || !password_hash) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let cleanPhone = phone.replace(/\D/g, '');
    // Accept phone with country code and normalize to DDD+number (11 digits)
    if (cleanPhone.startsWith('55') && cleanPhone.length === 13) {
      cleanPhone = cleanPhone.slice(2);
    }

    if (cleanPhone.length !== 11) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp deve ter 11 dígitos (DDD + número)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingAffiliate) {
      console.log('Email already exists:', email);
      return new Response(
        JSON.stringify({ error: 'Este e-mail já está cadastrado. Faça login.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('whatsapp', cleanPhone)
      .maybeSingle();

    if (existingPhone) {
      console.log('Phone already exists:', cleanPhone);
      return new Response(
        JSON.stringify({ error: 'Este WhatsApp já está cadastrado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit - max 3 codes per phone in 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentCodes } = await supabaseAdmin
      .from('affiliate_verification_codes')
      .select('id')
      .eq('phone', cleanPhone)
      .gte('created_at', tenMinutesAgo);

    if (recentCodes && recentCodes.length >= 3) {
      console.log('Rate limit exceeded for phone:', cleanPhone);
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Aguarde 10 minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification code
    const code = generateCode();
    console.log('Generated code for:', cleanPhone, 'Code:', code);

    // Save code to database
    const { error: insertError } = await supabaseAdmin
      .from('affiliate_verification_codes')
      .insert({
        phone: cleanPhone,
        email: email,
        name: name,
        code: code,
        password_hash: password_hash,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (insertError) {
      console.error('Error saving verification code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar código. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Owner ChatPro config from owner_settings
    const { data: ownerSettings, error: settingsError } = await supabaseAdmin
      .from('owner_settings')
      .select('setting_value')
      .eq('setting_key', 'affiliate_chatpro_config')
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching owner settings:', settingsError);
    }

    const chatproConfig = ownerSettings?.setting_value as {
      base_endpoint?: string;
      instance_id?: string;
      api_token?: string;
      is_enabled?: boolean;
    } | null;

    if (!chatproConfig?.is_enabled || !chatproConfig?.instance_id || !chatproConfig?.api_token) {
      console.log('ChatPro not configured for affiliates');
      // Still return success so the code is saved, but log the issue
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Código gerado (ChatPro não configurado - verifique o painel Owner)',
          code_saved: true 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get verification template
    const { data: template } = await supabaseAdmin
      .from('whatsapp_templates')
      .select('*')
      .eq('template_type', 'affiliate_verification')
      .eq('is_active', true)
      .maybeSingle();

    // Build message
    let message = template?.message_template || 
      `🔐 *Genesis Hub - Programa de Parceiros*\n\nOlá {{nome}}! 👋\n\nSeu código de verificação é: *{{codigo}}*\n\n⏱️ Este código expira em 10 minutos.\n🔒 Não compartilhe com ninguém.`;

    // Replace variables
    message = message
      .replace(/\{\{nome\}\}/g, name.split(' ')[0])
      .replace(/\{\{codigo\}\}/g, code);

    // Format phone for WhatsApp
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Build correct ChatPro URL - clean the base endpoint first
    let baseEndpoint = (chatproConfig.base_endpoint || 'https://v2.chatpro.com.br').replace(/\/$/, '');
    const instanceId = chatproConfig.instance_id!.trim();
    
    // Remove instance_id from endpoint if user pasted full URL
    if (baseEndpoint.includes(instanceId)) {
      baseEndpoint = baseEndpoint.replace(new RegExp(`/${instanceId}.*$`), '');
    }
    
    const chatproUrl = `${baseEndpoint}/${instanceId}/api/v1/send_message`;
    
    console.log('ChatPro Base Endpoint:', baseEndpoint);
    console.log('ChatPro Instance ID:', instanceId);
    console.log('ChatPro Full URL:', chatproUrl);
    console.log('Sending WhatsApp to:', formattedPhone);

    // Build request body
    const requestBody: Record<string, any> = {
      number: formattedPhone,
      message: message
    };

    // Add image if template has one
    if (template?.image_url) {
      requestBody.mediaUrl = template.image_url;
      requestBody.mediaType = 'image';
    }

    // Add button if template has one
    if (template?.button_text && template?.button_url) {
      requestBody.buttons = [{
        type: 'url',
        text: template.button_text,
        url: template.button_url
      }];
    }

    try {
      const chatproResponse = await fetch(chatproUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': chatproConfig.api_token
        },
        body: JSON.stringify(requestBody)
      });

      console.log('ChatPro response status:', chatproResponse.status);

      const contentType = chatproResponse.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const textResponse = await chatproResponse.text();
        console.error('ChatPro returned non-JSON response:', textResponse);

        await supabaseAdmin.from('system_logs').insert({
          log_type: 'chatpro_error',
          source: 'send-affiliate-verification',
          message: 'ChatPro retornou resposta inválida (não-JSON)',
          severity: 'error',
          details: {
            status: chatproResponse.status,
            response: textResponse.substring(0, 500),
            url: chatproUrl
          }
        });

        return new Response(
          JSON.stringify({
            error: 'Falha ao enviar o código no WhatsApp. Verifique a configuração do ChatPro.',
            code_saved: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const chatproData = await chatproResponse.json();
      console.log('ChatPro response:', JSON.stringify(chatproData));

      const hasStatusCodeError = typeof chatproData?.statusCode === 'number' && chatproData.statusCode >= 400;
      const hasErrorField = Boolean(chatproData?.error);
      const isError = !chatproResponse.ok || hasStatusCodeError || hasErrorField;

      if (isError) {
        const rawMessage = typeof chatproData?.message === 'string' ? chatproData.message : '';

        let userMessage = 'Não foi possível enviar o código no WhatsApp. Verifique o número e tente novamente.';
        if (rawMessage.includes('getUserJid') && rawMessage.includes('não está cadastrado no WhatsApp')) {
          userMessage = 'O número informado não está cadastrado no WhatsApp. Verifique o número e tente novamente.';
        } else if (rawMessage) {
          userMessage = rawMessage;
        }

        console.error('ChatPro error:', chatproData);
        await supabaseAdmin.from('system_logs').insert({
          log_type: 'chatpro_error',
          source: 'send-affiliate-verification',
          message: 'Erro ao enviar código de verificação',
          severity: 'error',
          details: { error: chatproData, phone: formattedPhone, url: chatproUrl }
        });

        return new Response(
          JSON.stringify({
            error: userMessage,
            code_saved: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log success only when ChatPro accepted the request
      await supabaseAdmin.from('system_logs').insert({
        log_type: 'affiliate_verification',
        source: 'send-affiliate-verification',
        message: `Código de verificação enviado para ${cleanPhone}`,
        severity: 'info',
        details: { phone: cleanPhone, email: email }
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Código enviado para seu WhatsApp!',
          phone: cleanPhone
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (chatproError: any) {
      console.error('ChatPro request failed:', chatproError);
      await supabaseAdmin.from('system_logs').insert({
        log_type: 'chatpro_error',
        source: 'send-affiliate-verification',
        message: 'Falha na requisição ao ChatPro',
        severity: 'error',
        details: { error: chatproError.message, url: chatproUrl }
      });

      return new Response(
        JSON.stringify({
          error: 'Falha ao enviar o código no WhatsApp. Tente novamente em instantes.',
          code_saved: true
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});