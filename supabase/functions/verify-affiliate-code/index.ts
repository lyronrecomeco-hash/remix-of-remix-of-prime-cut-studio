import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate unique affiliate code
const generateAffiliateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

Deno.serve(async (req) => {
  console.log('=== VERIFY AFFILIATE CODE STARTED ===');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Telefone e código são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCode = code.trim();

    console.log('Verifying code for phone:', cleanPhone);

    // Find the verification record
    const { data: verification, error: findError } = await supabaseAdmin
      .from('affiliate_verification_codes')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('code', cleanCode)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error finding verification:', findError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar código' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!verification) {
      console.log('No valid verification found');
      return new Response(
        JSON.stringify({ error: 'Código inválido ou expirado. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(verification.expires_at) < new Date()) {
      console.log('Code expired');
      return new Response(
        JSON.stringify({ error: 'Código expirado. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts
    if (verification.attempts >= 5) {
      console.log('Too many attempts');
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas incorretas. Solicite um novo código.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment attempts first
    await supabaseAdmin
      .from('affiliate_verification_codes')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id);

    console.log('Code verified successfully, creating affiliate account...');

    // Create auth user
    const tempPassword = crypto.randomUUID().substring(0, 16) + 'A1!';
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: verification.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: verification.name,
        phone: verification.phone,
        role: 'affiliate'
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      if (authError.message?.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este e-mail já está cadastrado. Faça login.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authUser?.user) {
      console.error('No user returned from auth creation');
      return new Response(
        JSON.stringify({ error: 'Erro ao criar conta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique affiliate code
    let affiliateCode = generateAffiliateCode();
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affiliateCode)
        .maybeSingle();

      if (!existing) {
        codeExists = false;
      } else {
        affiliateCode = generateAffiliateCode();
        attempts++;
      }
    }

    // Create affiliate record
    const { error: affiliateError } = await supabaseAdmin
      .from('affiliates')
      .insert({
        user_id: authUser.user.id,
        name: verification.name,
        email: verification.email,
        whatsapp: verification.phone,
        affiliate_code: affiliateCode,
        password_hash: verification.password_hash,
        status: 'pending', // Pending admin approval
        commission_rate_monthly: 30,
        commission_rate_lifetime: 25
      });

    if (affiliateError) {
      console.error('Error creating affiliate record:', affiliateError);
      // Cleanup auth user if affiliate creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ error: 'Erro ao finalizar cadastro' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark verification as used
    await supabaseAdmin
      .from('affiliate_verification_codes')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id);

    // Log the event
    await supabaseAdmin.from('system_logs').insert({
      log_type: 'affiliate_registration',
      source: 'verify-affiliate-code',
      message: `Novo afiliado registrado: ${verification.name} (${verification.email})`,
      severity: 'info',
      user_id: authUser.user.id,
      details: { 
        affiliate_code: affiliateCode,
        phone: verification.phone,
        email: verification.email
      }
    });

    console.log('Affiliate created successfully:', affiliateCode);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conta criada com sucesso! Aguarde aprovação do administrador.',
        affiliateCode: affiliateCode
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
