import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  event: string;
  instanceId: string;
  userId: string;
  data: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event, instanceId, userId, data }: WebhookPayload = await req.json();

    if (!event || !instanceId || !userId) {
      return new Response(
        JSON.stringify({ error: "event, instanceId and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Dispatching webhook for event: ${event}, instance: ${instanceId}`);

    // Get user's webhooks for this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from("genesis_webhooks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .contains("events", [event]);

    if (webhooksError) {
      console.error("Error fetching webhooks:", webhooksError);
      throw webhooksError;
    }

    if (!webhooks || webhooks.length === 0) {
      console.log("No webhooks configured for this event");
      return new Response(
        JSON.stringify({ success: true, dispatched: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const results = [];

    for (const webhook of webhooks) {
      try {
        const payload = {
          event,
          instanceId,
          timestamp: now,
          data,
        };

        // Create signature if secret key exists
        let signature = "";
        if (webhook.secret_key) {
          const encoder = new TextEncoder();
          const keyData = encoder.encode(webhook.secret_key);
          const messageData = encoder.encode(JSON.stringify(payload));
          
          const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          
          const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
          signature = Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Genesis-Event": event,
          "X-Genesis-Timestamp": now,
        };

        if (signature) {
          headers["X-Genesis-Signature"] = signature;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(webhook.url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const success = response.ok;

        // Update webhook status
        await supabase
          .from("genesis_webhooks")
          .update({
            last_triggered_at: now,
            failure_count: success ? 0 : (webhook.failure_count || 0) + 1,
            updated_at: now,
          })
          .eq("id", webhook.id);

        // Log the event
        await supabase.from("genesis_event_logs").insert({
          instance_id: instanceId,
          user_id: userId,
          event_type: "webhook_dispatched",
          severity: success ? "info" : "warning",
          message: `Webhook "${webhook.name}" ${success ? "delivered" : "failed"}`,
          details: {
            webhookId: webhook.id,
            webhookUrl: webhook.url,
            event,
            statusCode: response.status,
            success,
          },
        });

        results.push({
          webhookId: webhook.id,
          success,
          statusCode: response.status,
        });

        // Disable webhook if too many failures
        if (!success && (webhook.failure_count || 0) + 1 >= 10) {
          await supabase
            .from("genesis_webhooks")
            .update({ is_active: false })
            .eq("id", webhook.id);

          await supabase.from("genesis_event_logs").insert({
            instance_id: instanceId,
            user_id: userId,
            event_type: "webhook_disabled",
            severity: "error",
            message: `Webhook "${webhook.name}" disabled due to repeated failures`,
            details: { webhookId: webhook.id, failureCount: webhook.failure_count + 1 },
          });
        }
      } catch (webhookError) {
        console.error(`Error dispatching to webhook ${webhook.id}:`, webhookError);
        const errMsg = webhookError instanceof Error ? webhookError.message : "Unknown error";
        
        await supabase
          .from("genesis_webhooks")
          .update({
            failure_count: (webhook.failure_count || 0) + 1,
            updated_at: now,
          })
          .eq("id", webhook.id);

        results.push({
          webhookId: webhook.id,
          success: false,
          error: errMsg,
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        dispatched: results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook dispatcher error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
