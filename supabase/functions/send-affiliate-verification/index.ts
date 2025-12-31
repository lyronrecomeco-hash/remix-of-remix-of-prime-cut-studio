import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate 6 digit code
const generateCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash password for storage (simple hash for temporary storage)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Rate limiting
const checkRateLimit = async (
  supabase: any,
  phone: string
): Promise<{ allowed: boolean; message?: string }> => {
  // Check how many codes were sent to this phone in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('affiliate_verification_codes')
    .select('*', { count: 'exact', head: true })
    .eq('phone', phone)
    .gte('created_at', oneHourAgo);

  if (count && count >= 5) {
    return { 
      allowed: false, 
      message: 'Muitas tentativas. Aguarde 1 hora para solicitar novamente.' 
    };
  }

  return { allowed: true };
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

    const { name, email, whatsapp, password } = await req.json();

    // Validate required fields
    if (!name || !email || !whatsapp || !password) {
      console.log('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number
    const cleanPhone = whatsapp.replace(/\D/g, '');
    const cleanEmail = email.toLowerCase().trim();

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(supabaseAdmin, cleanPhone);
    if (!rateLimitCheck.allowed) {
      console.log('Rate limit exceeded for:', cleanPhone);
      return new Response(
        JSON.stringify({ error: rateLimitCheck.message }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      u => u.email?.toLowerCase() === cleanEmail
    );

    if (emailExists) {
      console.log('Email already exists:', cleanEmail);
      return new Response(
        JSON.stringify({ error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in affiliates table
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingAffiliate) {
      console.log('Email already registered as affiliate:', cleanEmail);
      return new Response(
        JSON.stringify({ error: 'Este e-mail já está cadastrado como afiliado.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification code
    const code = generateCode();
    const passwordHash = await hashPassword(password);
    
    console.log('Generated code for:', cleanPhone, 'Code:', code);

    // Clean old unverified codes for this phone
    await supabaseAdmin
      .from('affiliate_verification_codes')
      .delete()
      .eq('phone', cleanPhone)
      .is('verified_at', null);

    // Save verification code
    const { error: insertError } = await supabaseAdmin
      .from('affiliate_verification_codes')
      .insert({
        phone: cleanPhone,
        email: cleanEmail,
        name: name.trim(),
        password_hash: passwordHash,
        code: code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
      });

    if (insertError) {
      console.error('Error saving verification code:', insertError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar código de verificação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get ChatPro config
    const { data: chatproConfig } = await supabaseAdmin
      .from('chatpro_config')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!chatproConfig?.is_enabled || !chatproConfig?.instance_id || !chatproConfig?.api_token) {
      console.log('ChatPro not configured');
      return new Response(
        JSON.stringify({ error: 'Sistema de WhatsApp não configurado. Contate o suporte.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    message = message
      .replace(/\{\{nome\}\}/g, name.trim())
      .replace(/\{\{codigo\}\}/g, code);

    // Format phone for ChatPro (Brazil)
    let formattedPhone = cleanPhone;
    if (!formattedPhone.startsWith('55')) {
      formattedPhone = '55' + formattedPhone;
    }

    // Build ChatPro URL
    let baseEndpoint = chatproConfig.base_endpoint || 'https://v2.chatpro.com.br';
    if (baseEndpoint.endsWith('/')) {
      baseEndpoint = baseEndpoint.slice(0, -1);
    }

    // Check if instance_id is already in the base_endpoint
    const instanceId = chatproConfig.instance_id;
    let chatproUrl: string;

    if (baseEndpoint.includes(instanceId)) {
      chatproUrl = `${baseEndpoint}/send_message`;
    } else {
      chatproUrl = `${baseEndpoint}/${instanceId}/api/v1/send_message`;
    }

    console.log('Sending WhatsApp to:', formattedPhone);
    console.log('ChatPro URL:', chatproUrl);

    // Send via ChatPro
    const chatproResponse = await fetch(chatproUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': chatproConfig.api_token,
      },
      body: JSON.stringify({
        number: formattedPhone,
        message: message,
      }),
    });

    // Check if response is JSON before parsing
    const contentType = chatproResponse.headers.get('content-type') || '';
    let chatproResult: any;
    
    if (contentType.includes('application/json')) {
      chatproResult = await chatproResponse.json();
    } else {
      const textResponse = await chatproResponse.text();
      console.error('ChatPro returned non-JSON response:', textResponse.substring(0, 200));
      chatproResult = { error: 'Resposta inválida do servidor', rawResponse: textResponse.substring(0, 100) };
    }
    
    console.log('ChatPro response status:', chatproResponse.status);
    console.log('ChatPro response:', JSON.stringify(chatproResult).substring(0, 200));

    if (!chatproResponse.ok || chatproResult.error) {
      console.error('ChatPro error:', chatproResult);
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar código via WhatsApp. Verifique a configuração do ChatPro.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the event
    await supabaseAdmin.from('system_logs').insert({
      log_type: 'affiliate_verification',
      source: 'send-affiliate-verification',
      message: `Código de verificação enviado para ${cleanPhone}`,
      severity: 'info',
      details: { phone: cleanPhone, email: cleanEmail }
    });

    console.log('Verification code sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado para seu WhatsApp',
        phone: cleanPhone.slice(-4) // Return last 4 digits for confirmation
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
