import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-instance-token",
};

// Threshold para considerar instância stale (180 segundos)
const STALE_THRESHOLD_SECONDS = 180;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // POST /whatsapp-heartbeat/:instanceId - Recebe heartbeat do backend
    // Nota: precisa ignorar a rota /cleanup para não capturar no handler errado.
    if (req.method === "POST" && pathParts.length >= 2 && pathParts[1] !== "cleanup") {
      const instanceId = pathParts[1];
      const instanceToken = req.headers.get("x-instance-token");

      if (!instanceToken) {
        return new Response(
          JSON.stringify({ error: "Missing instance token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate instance
      const { data: instance, error: instanceError } = await supabase
        .from("whatsapp_instances")
        .select("id, instance_token, backend_token, status")
        .eq("id", instanceId)
        .single();

      if (instanceError || !instance) {
        console.error("Instance not found:", instanceId);
        return new Response(
          JSON.stringify({ error: "Instance not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Também aceita o MASTER_TOKEN atual do backend (VPS v6 envia ele no x-instance-token)
      const { data: backendCfg } = await supabase
        .from("whatsapp_backend_config")
        .select("master_token")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const expectedInstanceToken = instance.instance_token;
      const expectedBackendToken = (instance as Record<string, unknown>).backend_token as string | null;
      const expectedMasterToken = (backendCfg as Record<string, unknown> | null)?.master_token as string | null;

      const isValidToken =
        (expectedInstanceToken && expectedInstanceToken === instanceToken) ||
        (expectedBackendToken && expectedBackendToken === instanceToken) ||
        (expectedMasterToken && expectedMasterToken === instanceToken);

      if (!isValidToken) {
        console.warn("whatsapp-heartbeat invalid token", {
          instanceId,
          tokenPrefix: String(instanceToken).slice(0, 8),
          hasMasterToken: Boolean(expectedMasterToken),
          masterPrefix: expectedMasterToken ? String(expectedMasterToken).slice(0, 8) : null,
        });
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse body
      const body = await req.json().catch(() => ({}));
      const { status, phone_number, uptime_seconds, heartbeat_count, version } = body;

      // Update instance with heartbeat
      const nowIso = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        last_heartbeat_at: nowIso,
        last_heartbeat: nowIso,
        last_seen: nowIso,
      };

      if (status) updateData.status = status;
      if (phone_number) updateData.phone_number = phone_number;
      if (uptime_seconds !== undefined) updateData.uptime_seconds = uptime_seconds;

      const { error: updateError } = await supabase
        .from("whatsapp_instances")
        .update(updateData)
        .eq("id", instanceId);

      if (updateError) {
        console.error("Error updating instance:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log health check
      await supabase.from("whatsapp_health_checks").insert({
        instance_id: instanceId,
        is_healthy: status === "connected",
        latency_ms: 0,
        details: { source: "heartbeat", status, version: version || "unknown", heartbeat_count },
      });

      console.log(`Heartbeat OK: instance=${instanceId}, status=${status}, version=${version}, #${heartbeat_count}`);

      return new Response(
        JSON.stringify({ success: true, timestamp: nowIso }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /whatsapp-heartbeat/status/:instanceId - Check instance status
    if (req.method === "GET" && pathParts.length >= 3 && pathParts[1] === "status") {
      const instanceId = pathParts[2];

      const { data: instance, error } = await supabase
        .from("whatsapp_instances")
        .select("id, name, status, phone_number, last_heartbeat_at, uptime_seconds, last_seen")
        .eq("id", instanceId)
        .single();

      if (error || !instance) {
        return new Response(
          JSON.stringify({ error: "Instance not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lastHeartbeat = instance.last_heartbeat_at ? new Date(instance.last_heartbeat_at) : null;
      const ageSeconds = lastHeartbeat ? Math.floor((Date.now() - lastHeartbeat.getTime()) / 1000) : Infinity;
      const isStale = ageSeconds > STALE_THRESHOLD_SECONDS;

      // Se está stale e status é connected, marca como disconnected automaticamente
      let effectiveStatus = instance.status;
      if (isStale && instance.status === "connected") {
        effectiveStatus = "disconnected";
        // Atualiza no banco para refletir o status real
        await supabase
          .from("whatsapp_instances")
          .update({ status: "disconnected" })
          .eq("id", instanceId);
      }

      return new Response(
        JSON.stringify({
          ...instance,
          heartbeat_age_seconds: ageSeconds,
          is_stale: isStale,
          effective_status: effectiveStatus,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /whatsapp-heartbeat/all - Get all instances with cleanup
    if (req.method === "GET" && pathParts.length >= 2 && pathParts[1] === "all") {
      const { data: instances, error } = await supabase
        .from("whatsapp_instances")
        .select("id, name, status, phone_number, last_heartbeat_at, uptime_seconds, last_seen")
        .order("created_at", { ascending: false });

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch instances" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const now = Date.now();
      const staleIds: string[] = [];
      
      const enrichedInstances = (instances || []).map(inst => {
        const lastHeartbeat = inst.last_heartbeat_at ? new Date(inst.last_heartbeat_at) : null;
        const ageSeconds = lastHeartbeat ? Math.floor((now - lastHeartbeat.getTime()) / 1000) : Infinity;
        const isStale = ageSeconds > STALE_THRESHOLD_SECONDS;
        
        // Marca para cleanup se stale e connected
        if (isStale && inst.status === "connected") {
          staleIds.push(inst.id);
        }
        
        return {
          ...inst,
          heartbeat_age_seconds: ageSeconds,
          is_stale: isStale,
          effective_status: isStale && inst.status === "connected" ? "disconnected" : inst.status,
        };
      });

      // Cleanup: marca instâncias stale como disconnected
      if (staleIds.length > 0) {
        await supabase
          .from("whatsapp_instances")
          .update({ status: "disconnected" })
          .in("id", staleIds);
        console.log(`Cleanup: marked ${staleIds.length} stale instances as disconnected`);
      }

      return new Response(
        JSON.stringify({ instances: enrichedInstances }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /whatsapp-heartbeat/cleanup - Force cleanup of stale instances
    if (req.method === "POST" && pathParts.length >= 2 && pathParts[1] === "cleanup") {
      const thresholdDate = new Date(Date.now() - STALE_THRESHOLD_SECONDS * 1000).toISOString();
      
      const { data: staleInstances, error: fetchError } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("status", "connected")
        .lt("last_heartbeat_at", thresholdDate);

      if (fetchError) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch stale instances" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const staleIds = (staleInstances || []).map(i => i.id);
      
      if (staleIds.length > 0) {
        await supabase
          .from("whatsapp_instances")
          .update({ status: "disconnected" })
          .in("id", staleIds);
      }

      console.log(`Cleanup forced: ${staleIds.length} instances marked as disconnected`);

      return new Response(
        JSON.stringify({ success: true, cleaned: staleIds.length, ids: staleIds }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Heartbeat error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
