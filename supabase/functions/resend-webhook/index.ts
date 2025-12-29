import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-signature, svix-timestamp, webhook-id, webhook-signature, webhook-timestamp",
};

serve(async (req) => {
  console.log("=== RESEND WEBHOOK RECEIVED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get raw body for signature verification
    const rawBody = await req.text();
    let payload: any;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        const wh = new Webhook(webhookSecret);
        const headers = Object.fromEntries(req.headers);
        payload = wh.verify(rawBody, headers);
        console.log("Webhook signature verified successfully");
      } catch (verifyError) {
        console.error("Webhook signature verification failed:", verifyError);
        // Still process the webhook but log the verification failure
        payload = JSON.parse(rawBody);
      }
    } else {
      console.log("No webhook secret configured, skipping signature verification");
      payload = JSON.parse(rawBody);
    }

    console.log("Webhook payload:", JSON.stringify(payload, null, 2));

    // Extract event data
    const eventType = payload.type || "unknown";
    const emailId = payload.data?.email_id || payload.email_id || null;
    const recipientEmail = payload.data?.to?.[0] || payload.to?.[0] || payload.data?.email || null;

    console.log("Event type:", eventType);
    console.log("Email ID:", emailId);
    console.log("Recipient:", recipientEmail);

    // Store the webhook event
    const { error: insertError } = await supabaseAdmin
      .from("email_webhook_events")
      .insert({
        event_type: eventType,
        email_id: emailId,
        recipient_email: recipientEmail,
        payload: payload,
      });

    if (insertError) {
      console.error("Error storing webhook event:", insertError.message);
    } else {
      console.log("Webhook event stored successfully");
    }

    // Handle specific event types
    switch (eventType) {
      case "email.delivered":
        console.log("Email delivered to:", recipientEmail);
        if (emailId) {
          await supabaseAdmin
            .from("email_logs")
            .update({ status: "delivered" })
            .eq("id", emailId);
        }
        break;

      case "email.bounced":
        console.log("Email bounced for:", recipientEmail);
        if (emailId) {
          await supabaseAdmin
            .from("email_logs")
            .update({ 
              status: "bounced",
              error_message: payload.data?.bounce_type || "Bounced"
            })
            .eq("id", emailId);
        }
        break;

      case "email.complained":
        console.log("Email complained by:", recipientEmail);
        break;

      case "email.opened":
        console.log("Email opened by:", recipientEmail);
        break;

      case "email.clicked":
        console.log("Email link clicked by:", recipientEmail);
        break;

      default:
        console.log("Unhandled event type:", eventType);
    }

    // Always return 200 OK to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent Resend from retrying
    return new Response(
      JSON.stringify({ received: true, error: "Processing error" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});