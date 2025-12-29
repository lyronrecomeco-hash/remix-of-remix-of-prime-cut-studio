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

    const alreadyConfirmed = !!tokenData.confirmed_at;

    if (alreadyConfirmed) {
      console.log("Token already confirmed");
    } else {
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
    }

    console.log("Email confirmed successfully for:", tokenData.email);

    // Ensure user has initial admin role so they can access /admin
    try {
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", tokenData.user_id)
        .limit(1)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleInsertError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: tokenData.user_id, role: "admin" });

        if (roleInsertError) {
          console.log("Error creating user role:", roleInsertError.message);
        } else {
          console.log("Admin role assigned to user");
        }
      }
    } catch (roleError) {
      console.log("Role setup failed:", roleError);
    }

    // Get user data from auth (name and phone are in user_metadata)
    let userName = "Cliente";
    let userPhone = tokenData.phone; // First check if phone was stored in token
    
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(tokenData.user_id);
      userName = userData?.user?.user_metadata?.first_name || 
                 userData?.user?.user_metadata?.name || 
                 "Cliente";
      
      // If no phone in token, try to get from user_metadata (whatsapp field)
      if (!userPhone) {
        userPhone = userData?.user?.user_metadata?.whatsapp || null;
      }
    } catch (e) {
      console.log("Could not get user data:", e);
    }

    // Send welcome WhatsApp message if phone is available
    if (userPhone) {
      console.log("Sending welcome WhatsApp to:", userPhone);
      try {
        const whatsappResponse = await fetch(`${supabaseUrl}/functions/v1/send-welcome-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            phone: userPhone,
            name: userName,
            email: tokenData.email,
          }),
        });

        const whatsappResult = await whatsappResponse.json();
        console.log("WhatsApp result:", whatsappResult);
      } catch (whatsappError) {
        console.error("Error sending welcome WhatsApp:", whatsappError);
        // Don't fail the confirmation - WhatsApp is optional
      }
    } else {
      console.log("No phone in token, skipping WhatsApp");
    }

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
