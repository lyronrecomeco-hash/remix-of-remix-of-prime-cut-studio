import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ProxyRequestBody = {
  instanceId: string;
  path: string;
  method: "GET" | "POST";
  body?: unknown;
};

const isAllowedPath = (path: string) => {
  if (!path.startsWith("/")) return false;
  if (path === "/health") return true;
  if (path.startsWith("/api/instance/")) return true;
  if (path.startsWith("/api/instances")) return true;
  if (path.startsWith("/api/qrcode")) return true;
  if (path === "/api/send" || path === "/send") return true;
  return false;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("genesis-backend-proxy request", {
    method: req.method,
    hasAuth: Boolean(req.headers.get("Authorization")),
  });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identify caller (uses anon + caller JWT)
    const supabaseAuthed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAuthed.auth.getUser();

    if (userError || !user) {
      console.warn("genesis-backend-proxy invalid caller jwt", {
        hasUser: Boolean(user),
        error: userError?.message,
      });

      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client (service role)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const requestBody = (await req.json().catch(() => null)) as ProxyRequestBody | null;
    const instanceId = requestBody?.instanceId;
    const path = requestBody?.path;
    const method = requestBody?.method;

    if (!instanceId || !path || !method) {
      return new Response(JSON.stringify({ error: "Payload inválido (instanceId, path, method obrigatórios)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isAllowedPath(path)) {
      return new Response(JSON.stringify({ error: "Path não permitido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get genesis user from auth user
    const { data: genesisUser, error: genesisUserError } = await supabaseAdmin
      .from("genesis_users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (genesisUserError || !genesisUser) {
      return new Response(JSON.stringify({ error: "Usuário Genesis não encontrado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the instance and verify ownership
    const { data: instance, error: instanceError } = await supabaseAdmin
      .from("genesis_instances")
      .select("id, user_id, backend_url, backend_token")
      .eq("id", instanceId)
      .single();

    if (instanceError || !instance) {
      return new Response(JSON.stringify({ error: "Instância não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ownership
    if (instance.user_id !== genesisUser.id) {
      return new Response(JSON.stringify({ error: "Acesso negado a esta instância" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get backend config - first try from instance, then fallback to global whatsapp_backend_config
    let backendUrl = instance.backend_url;
    let backendToken = instance.backend_token;

    if (!backendUrl || !backendToken) {
      // Fallback to global config (Owner's VPS)
      const { data: globalConfig } = await supabaseAdmin
        .from("whatsapp_backend_config")
        .select("backend_url, master_token, is_connected")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (globalConfig?.backend_url && globalConfig?.master_token) {
        backendUrl = globalConfig.backend_url;
        backendToken = globalConfig.master_token;

        // Save to instance for future use
        await supabaseAdmin
          .from("genesis_instances")
          .update({ 
            backend_url: backendUrl, 
            backend_token: backendToken,
            updated_at: new Date().toISOString()
          })
          .eq("id", instanceId);
      }
    }

    if (!backendUrl || !backendToken) {
      return new Response(
        JSON.stringify({
          error: "Backend VPS não configurado. Entre em contato com o suporte.",
          needsConfig: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanBackendUrl = String(backendUrl).replace(/\/$/, "");
    const targetUrl = cleanBackendUrl + path;

    console.log("genesis-backend-proxy forwarding", {
      instanceId,
      path,
      method,
      targetUrl,
      hasBody: Boolean(requestBody?.body),
    });

    const headers: Record<string, string> = {
      Authorization: `Bearer ${backendToken}`,
    };

    let fetchBody: string | undefined;
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(requestBody?.body ?? {});
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const upstream = await fetch(targetUrl, {
        method,
        headers,
        body: fetchBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await upstream.text();
      let parsed: unknown = text;

      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        // keep as text
      }

      return new Response(
        JSON.stringify({ ok: upstream.ok, status: upstream.status, data: parsed }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const isAbort = fetchError instanceof Error && fetchError.name === 'AbortError';
      return new Response(
        JSON.stringify({ 
          error: isAbort ? "Timeout ao conectar com o backend" : "Backend não está respondendo",
          ok: false,
          status: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("genesis-backend-proxy error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
