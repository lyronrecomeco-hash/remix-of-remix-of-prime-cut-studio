import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Verify caller is owner (super_admin)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is super_admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (!roleData || roleData.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Owner only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, whatsapp } = await req.json();

    if (!name || !email || !whatsapp) {
      return new Response(
        JSON.stringify({ error: 'Name, email and whatsapp are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in affiliates table
    const { data: existingAffiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existingAffiliate) {
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado como afiliado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique affiliate code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // Generate random password
    const generatePassword = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
      let password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };

    const affiliateCode = generateCode();
    const password = generatePassword();
    const normalizedEmail = email.toLowerCase().trim();

    // Create auth user with admin API (bypasses email confirmation)
    const { data: authData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true,
      user_metadata: { 
        is_affiliate: true,
        name: name
      }
    });

    if (createAuthError) {
      console.error('Auth creation error:', createAuthError);
      
      if (createAuthError.message.includes('already been registered')) {
        return new Response(
          JSON.stringify({ error: 'Este email já possui uma conta no sistema. Use outro email.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createAuthError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Falha ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create affiliate record
    const { error: affiliateError } = await supabaseAdmin.from('affiliates').insert({
      user_id: authData.user.id,
      name: name,
      email: normalizedEmail,
      whatsapp: whatsapp,
      affiliate_code: affiliateCode,
      password_hash: password, // Store plain password for owner to share
      status: 'active',
      created_by: caller.id
    });

    if (affiliateError) {
      console.error('Affiliate creation error:', affiliateError);
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro de afiliado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        affiliate: {
          id: authData.user.id,
          name,
          email: normalizedEmail,
          affiliate_code: affiliateCode,
          password
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
