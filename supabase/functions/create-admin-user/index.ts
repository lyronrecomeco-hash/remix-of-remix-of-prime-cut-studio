import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== CREATE ADMIN USER FUNCTION STARTED ===');
  console.log('Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);
    console.log('Anon key exists:', !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the user making the request
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header exists:', !!authHeader);

    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Não autorizado - Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    console.log('Requesting user ID:', requestingUser?.id);
    console.log('User error:', userError?.message);

    if (userError || !requestingUser) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado - Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .maybeSingle();

    console.log('Role data:', roleData);
    console.log('Role error:', roleError?.message);

    if (roleError) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roleData || roleData.role !== 'super_admin') {
      console.error('User is not super_admin. Role:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Apenas super admins podem criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User is super_admin, proceeding with creation');

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log('Request body parsed:', { email: body.email, name: body.name, role: body.role });
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return new Response(
        JSON.stringify({ error: 'Dados da requisição inválidos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, name, role, expiresAt } = body;

    if (!email || !password || !name || !role) {
      console.error('Missing required fields:', { email: !!email, password: !!password, name: !!name, role: !!role });
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. Email, senha, nome e função são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['super_admin', 'admin', 'barber'];
    if (!validRoles.includes(role)) {
      console.error('Invalid role:', role);
      return new Response(
        JSON.stringify({ error: 'Função inválida. Use: admin ou barber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the auth user
    console.log('Creating auth user with email:', email);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      let errorMessage = authError.message;
      if (errorMessage.includes('already registered')) {
        errorMessage = 'Este email já está registrado no sistema';
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;
    console.log('Auth user created with ID:', newUserId);

    // Create user role
    console.log('Creating user role:', role);
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: role,
      });

    if (roleInsertError) {
      console.error('Role creation error:', roleInsertError);
      // Rollback - delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar role do usuário: ' + roleInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User role created successfully');

    // Create admin user record
    console.log('Creating admin user record');
    const { error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: newUserId,
        email,
        name,
        expires_at: expiresAt || null,
        is_active: true,
      });

    if (adminError) {
      console.error('Admin user creation error:', adminError);
      // Rollback
      await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro de admin: ' + adminError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== USER CREATED SUCCESSFULLY ===');
    console.log('User ID:', newUserId);

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== UNEXPECTED ERROR ===');
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
