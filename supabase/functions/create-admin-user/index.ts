import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the user making the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is super_admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (!roleData || roleData.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: 'Apenas super admins podem criar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, name, role, expiresAt } = await req.json();

    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;

    // Create user role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUserId,
        role: role,
      });

    if (roleError) {
      // Rollback - delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar role do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin user record
    const { error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        user_id: newUserId,
        email,
        name,
        expires_at: expiresAt || null,
        is_active: true,
        created_by: requestingUser.id,
      });

    if (adminError) {
      // Rollback
      await supabaseAdmin.from('user_roles').delete().eq('user_id', newUserId);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar registro de admin' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
