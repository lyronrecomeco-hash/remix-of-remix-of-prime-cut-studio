import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string, endpoint: string, maxRequests: number, windowMinutes: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  
  // Clean old entries and count recent requests
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, request_count, window_start')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .single();

  if (existing) {
    if (existing.request_count >= maxRequests) {
      return false; // Rate limited
    }
    // Increment counter
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new entry
    await supabase
      .from('rate_limits')
      .insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
  }

  return true;
}

// Validate email format strictly
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Validate phone format (Brazilian)
function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

// Sanitize string input
function sanitizeString(input: string, maxLength: number = 100): string {
  return input.trim().slice(0, maxLength).replace(/[<>\"'&]/g, '');
}

// Generate unique affiliate code
function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Rate limit: 5 registrations per IP per hour
    const canProceed = await checkRateLimit(supabaseAdmin, clientIP, 'affiliate-register', 5, 60);
    if (!canProceed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { name, email, whatsapp, password, confirmPassword } = body;

    // Validate required fields
    if (!name || !email || !whatsapp || !password || !confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'Todos os campos são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 100);
    const normalizedEmail = email.toLowerCase().trim();
    const sanitizedWhatsapp = whatsapp.replace(/\D/g, '');

    // Validate name
    if (sanitizedName.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Nome deve ter pelo menos 3 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email
    if (!isValidEmail(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'E-mail inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phone
    if (!isValidPhone(sanitizedWhatsapp)) {
      return new Response(
        JSON.stringify({ error: 'WhatsApp inválido. Use DDD + número.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter pelo menos 8 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check password has complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return new Response(
        JSON.stringify({ error: 'Senha deve conter letras maiúsculas, minúsculas e números' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Confirm password match
    if (password !== confirmPassword) {
      return new Response(
        JSON.stringify({ error: 'As senhas não coincidem' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists as affiliate
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingAffiliate) {
      return new Response(
        JSON.stringify({ error: 'Este e-mail já está cadastrado como afiliado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Note: WhatsApp uniqueness check removed - email uniqueness is sufficient
    // This allows users to update their WhatsApp later if needed

    // Generate unique affiliate code (check for collisions)
    let affiliateCode = generateAffiliateCode();
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      const { data: existingCode } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .maybeSingle();
      
      if (!existingCode) {
        codeExists = false;
      } else {
        affiliateCode = generateAffiliateCode();
        attempts++;
      }
    }

    // Create auth user with email confirmation
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true, // Auto-confirm for affiliates
      user_metadata: { 
        is_affiliate: true,
        name: sanitizedName
      }
    });

    if (createAuthError) {
      console.error('Auth creation error:', createAuthError);
      
      if (createAuthError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já possui uma conta no sistema.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta. Tente novamente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Falha ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create affiliate record with pending status (requires approval)
    const { error: affiliateError } = await supabaseAdmin.from('affiliates').insert({
      user_id: authData.user.id,
      name: sanitizedName,
      email: normalizedEmail,
      whatsapp: sanitizedWhatsapp,
      affiliate_code: affiliateCode,
      password_hash: '***SELF_REGISTERED***', // Don't store password, user knows it
      status: 'pending', // Requires admin approval
      commission_rate_monthly: 30,
      commission_rate_lifetime: 25
    });

    if (affiliateError) {
      console.error('Affiliate creation error:', affiliateError);
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro de afiliado. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the registration for audit
    await supabaseAdmin.from('system_logs').insert({
      log_type: 'affiliate_registration',
      source: 'register-affiliate',
      message: `Novo afiliado registrado: ${sanitizedName} (${normalizedEmail})`,
      severity: 'info',
      details: {
        affiliate_code: affiliateCode,
        ip_address: clientIP,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Affiliate registered successfully: ${normalizedEmail} - Code: ${affiliateCode}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
        affiliate_code: affiliateCode
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno. Tente novamente mais tarde.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
