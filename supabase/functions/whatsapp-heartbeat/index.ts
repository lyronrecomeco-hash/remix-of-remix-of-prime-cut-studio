import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-instance-token",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // POST /whatsapp-heartbeat/:instanceId
    if (req.method === "POST" && pathParts.length >= 2) {
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
        .select("id, instance_token, status")
        .eq("id", instanceId)
        .single();

      if (instanceError || !instance) {
        console.error("Instance not found:", instanceId);
        return new Response(
          JSON.stringify({ error: "Instance not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (instance.instance_token !== instanceToken) {
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Parse body
      const body = await req.json().catch(() => ({}));
      const { status, phone_number, uptime_seconds } = body;

      // Update instance with heartbeat
      const updateData: Record<string, unknown> = {
        last_heartbeat_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
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
        details: { source: "heartbeat", status },
      });

      console.log(`Heartbeat received for instance ${instanceId}, status: ${status}`);

      return new Response(
        JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /whatsapp-heartbeat/status/:instanceId - Check instance status from DB
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

      // Check if heartbeat is stale (> 2 minutes = likely disconnected)
      const lastHeartbeat = instance.last_heartbeat_at ? new Date(instance.last_heartbeat_at) : null;
      const isStale = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) > 120000 : true;

      return new Response(
        JSON.stringify({
          ...instance,
          is_stale: isStale,
          effective_status: isStale && instance.status === "connected" ? "disconnected" : instance.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /whatsapp-heartbeat/all - Get all instances status
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

      // Add stale check to each instance
      const enrichedInstances = (instances || []).map(inst => {
        const lastHeartbeat = inst.last_heartbeat_at ? new Date(inst.last_heartbeat_at) : null;
        const isStale = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) > 120000 : true;
        return {
          ...inst,
          is_stale: isStale,
          effective_status: isStale && inst.status === "connected" ? "disconnected" : inst.status,
        };
      });

      return new Response(
        JSON.stringify({ instances: enrichedInstances }),
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
