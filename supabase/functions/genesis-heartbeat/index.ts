import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-instance-token",
};

// Limite de inatividade: 180 segundos (3 minutos) - igual ao whatsapp-heartbeat
const STALE_THRESHOLD_SECONDS = 180;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { instanceId, status, phoneNumber, metrics } = await req.json();
    const instanceToken = req.headers.get("x-instance-token") || "";

    if (!instanceId) {
      return new Response(
        JSON.stringify({ error: "instanceId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get instance and user info
    const { data: instance, error: instanceError } = await supabase
      .from("genesis_instances")
      .select("id, user_id, status, effective_status, backend_token")
      .eq("id", instanceId)
      .single();

    if (instanceError || !instance) {
      console.error("Instance not found:", instanceError);
      return new Response(
        JSON.stringify({ error: "Instance not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar token se fornecido - aceita backend_token da instância
    // Se não há token configurado, aceita qualquer heartbeat (backwards compatibility)
    const expectedBackendToken = (instance as Record<string, unknown>).backend_token as string | null;
    
    if (expectedBackendToken && instanceToken) {
      if (expectedBackendToken !== instanceToken) {
        console.warn("genesis-heartbeat invalid token", {
          instanceId,
          tokenPrefix: String(instanceToken).slice(0, 8),
          expectedPrefix: String(expectedBackendToken).slice(0, 8),
        });
        return new Response(
          JSON.stringify({ error: "Invalid token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const now = new Date().toISOString();
    const effectiveStatus = status === "connected" ? "connected" : (status || instance.effective_status);

    // Update instance heartbeat
    const { error: updateError } = await supabase
      .from("genesis_instances")
      .update({
        last_heartbeat: now,
        effective_status: effectiveStatus,
        status: effectiveStatus,
        phone_number: phoneNumber || undefined,
        updated_at: now,
      })
      .eq("id", instanceId);

    if (updateError) {
      console.error("Error updating instance:", updateError);
    }

    // Log heartbeat event (apenas a cada 60s para não sobrecarregar)
    const shouldLogHeartbeat = Math.random() < 0.017; // ~1 log a cada 60 heartbeats
    if (shouldLogHeartbeat) {
      await supabase.from("genesis_event_logs").insert({
        instance_id: instanceId,
        user_id: instance.user_id,
        event_type: "heartbeat",
        severity: "info",
        message: `Heartbeat received - Status: ${effectiveStatus}`,
        details: { status: effectiveStatus, phoneNumber, metrics, timestamp: now },
      });
    }

    // Check for status change and trigger webhooks
    if (instance.effective_status !== effectiveStatus) {
      const eventType = effectiveStatus === "connected" ? "connected" : "disconnected";
      
      // Log status change event
      await supabase.from("genesis_event_logs").insert({
        instance_id: instanceId,
        user_id: instance.user_id,
        event_type: eventType,
        severity: eventType === "connected" ? "info" : "warning",
        message: `Instance ${eventType}`,
        details: { previousStatus: instance.effective_status, newStatus: effectiveStatus },
      });

      // Trigger webhooks for status change
      const { data: webhooks } = await supabase
        .from("genesis_webhooks")
        .select("*")
        .eq("user_id", instance.user_id)
        .eq("is_active", true)
        .contains("events", [eventType]);

      if (webhooks && webhooks.length > 0) {
        for (const webhook of webhooks) {
          try {
            const payload = {
              event: eventType,
              instanceId,
              status: effectiveStatus,
              phoneNumber,
              timestamp: now,
            };

            const response = await fetch(webhook.url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(webhook.secret_key && { "X-Webhook-Secret": webhook.secret_key }),
              },
              body: JSON.stringify(payload),
            });

            // Update webhook status
            await supabase
              .from("genesis_webhooks")
              .update({
                last_triggered_at: now,
                failure_count: response.ok ? 0 : (webhook.failure_count || 0) + 1,
              })
              .eq("id", webhook.id);

            // Log webhook trigger
            await supabase.from("genesis_event_logs").insert({
              instance_id: instanceId,
              user_id: instance.user_id,
              event_type: "webhook_triggered",
              severity: response.ok ? "info" : "warning",
              message: `Webhook ${webhook.name} triggered - ${response.ok ? "Success" : "Failed"}`,
              details: { webhookId: webhook.id, webhookUrl: webhook.url, status: response.status },
            });
          } catch (webhookError) {
            console.error("Webhook error:", webhookError);
            await supabase
              .from("genesis_webhooks")
              .update({ failure_count: (webhook.failure_count || 0) + 1 })
              .eq("id", webhook.id);
          }
        }
      }
    }

    // Consume daily credits for active instance
    const today = new Date().toISOString().split("T")[0];
    const { data: existingUsage } = await supabase
      .from("genesis_credit_usage")
      .select("id")
      .eq("instance_id", instanceId)
      .eq("usage_type", "instance_daily")
      .eq("usage_date", today)
      .single();

    if (!existingUsage && effectiveStatus === "connected") {
      // Charge 15 credits per day per active instance
      await supabase.from("genesis_credit_usage").insert({
        user_id: instance.user_id,
        instance_id: instanceId,
        credits_used: 15,
        usage_type: "instance_daily",
        description: "Consumo diário de instância ativa",
        usage_date: today,
      });

      // Deduct from user credits
      await supabase.rpc("deduct_genesis_credits", {
        p_user_id: instance.user_id,
        p_amount: 15,
      });

      console.log(`Deducted 15 credits for instance ${instanceId}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: effectiveStatus,
        heartbeat: now,
        staleThreshold: STALE_THRESHOLD_SECONDS,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Genesis heartbeat error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
