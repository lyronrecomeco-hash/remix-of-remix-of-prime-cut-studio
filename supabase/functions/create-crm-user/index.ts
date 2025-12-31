import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== CREATE CRM USER FUNCTION STARTED ===');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração do servidor inválida' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get authorization from header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token and decode it to get user ID
    const token = authHeader.replace('Bearer ', '');
    let requestingUserId: string;
    
    try {
      const [_header, payload, _signature] = decode(token);
      const jwtPayload = payload as { sub?: string; exp?: number };
      
      if (!jwtPayload.sub) {
        throw new Error('No user ID in token');
      }
      
      if (jwtPayload.exp && jwtPayload.exp * 1000 < Date.now()) {
        return new Response(
          JSON.stringify({ error: 'Token expirado, faça login novamente' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      requestingUserId = jwtPayload.sub;
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is super_admin (Owner)
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'super_admin') {
      console.error('Not super_admin. Role:', roleData?.role);
      return new Response(
        JSON.stringify({ error: 'Apenas o Owner pode criar logins CRM' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, name, tenantId } = await req.json();
    console.log('Request data:', { email, name, tenantId });

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the auth user with admin privileges
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        user_type: 'crm',
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      let errorMessage = authError.message;
      if (errorMessage.includes('already registered')) {
        errorMessage = 'Este email já está cadastrado';
      }
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;
    console.log('Auth user created:', newUserId);

    let finalTenantId = tenantId;
    let tenantData = null;

    // If no tenantId provided, create a new tenant
    if (!finalTenantId) {
      console.log('Creating new CRM tenant...');
      const { data: newTenant, error: tenantError } = await supabaseAdmin
        .from('crm_tenants')
        .insert({
          name: `Empresa de ${name}`,
          owner_user_id: newUserId,
          onboarding_completed: false,
        })
        .select()
        .single();

      if (tenantError) {
        console.error('Tenant creation error:', tenantError);
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar empresa' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      finalTenantId = newTenant.id;
      tenantData = newTenant;
      console.log('Tenant created:', finalTenantId);
    }

    // Create CRM user linked to the tenant
    console.log('Creating CRM user...');
    const { data: crmUserData, error: crmError } = await supabaseAdmin
      .from('crm_users')
      .insert({
        crm_tenant_id: finalTenantId,
        auth_user_id: newUserId,
        name,
        email,
        role: tenantId ? 'collaborator' : 'admin', // Admin if new tenant, collaborator if existing
        is_active: true,
      })
      .select()
      .single();

    if (crmError) {
      console.error('CRM user creation error:', crmError);
      // Rollback
      if (!tenantId) {
        await supabaseAdmin.from('crm_tenants').delete().eq('id', finalTenantId);
      }
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar usuário CRM' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('=== CRM USER CREATED SUCCESSFULLY ===');
    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUserId,
        crmUser: crmUserData,
        tenant: tenantData,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
