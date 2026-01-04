import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type ProxyRequestBody = {
  path: string;
  method: "GET" | "POST";
  body?: unknown;
};

const isAllowedPath = (path: string) => {
  if (!path.startsWith("/")) return false;
  if (path.startsWith("/health")) return true;
  if (path.startsWith("/api/instance/")) return true;
  return false;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("whatsapp-backend-proxy request", {
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
      console.warn("whatsapp-backend-proxy invalid caller jwt", {
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

    // Only allow super_admin to use this proxy (Owner panel)
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as ProxyRequestBody | null;
    const path = body?.path;
    const method = body?.method;

    if (!path || !method) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
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

    // Load current backend config (single-tenant config)
    const { data: config, error: configError } = await supabaseAdmin
      .from("whatsapp_backend_config")
      .select("backend_url, master_token")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (configError || !config?.backend_url || !config?.master_token) {
      return new Response(
        JSON.stringify({
          error: "Backend VPS não configurado. Salve a URL e o Token primeiro.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const backendUrl = String(config.backend_url).replace(/\/$/, "");
    const targetUrl = backendUrl + path;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.master_token}`,
    };

    let fetchBody: string | undefined;
    if (method === "POST") {
      headers["Content-Type"] = "application/json";
      fetchBody = JSON.stringify(body?.body ?? {});
    }

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body: fetchBody,
    });

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
