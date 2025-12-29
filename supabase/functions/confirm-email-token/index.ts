import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmTokenRequest {
  token: string;
}

serve(async (req) => {
  console.log("=== CONFIRM EMAIL TOKEN STARTED ===");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { token }: ConfirmTokenRequest = await req.json();
    console.log("Validating token:", token?.substring(0, 8) + "...");

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token não fornecido" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the token in database
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from("email_confirmation_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !tokenData) {
      console.log("Token not found:", tokenError?.message);
      return new Response(
        JSON.stringify({ error: "Token inválido ou não encontrado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if already confirmed
    if (tokenData.confirmed_at) {
      console.log("Token already confirmed");
      return new Response(
        JSON.stringify({ success: true, message: "Email já foi confirmado anteriormente" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if token expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      console.log("Token expired");
      return new Response(
        JSON.stringify({ error: "Token expirado. Solicite um novo email de confirmação." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark token as confirmed
    const { error: updateTokenError } = await supabaseAdmin
      .from("email_confirmation_tokens")
      .update({ confirmed_at: new Date().toISOString() })
      .eq("id", tokenData.id);

    if (updateTokenError) {
      console.log("Error updating token:", updateTokenError.message);
      throw updateTokenError;
    }

    // Update auth.users to mark email as confirmed using admin API
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    );

    if (updateUserError) {
      console.log("Error updating user:", updateUserError.message);
      // Don't fail - the token is already confirmed
    }

    console.log("Email confirmed successfully for:", tokenData.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email confirmado com sucesso!",
        email: tokenData.email 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error confirming email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
