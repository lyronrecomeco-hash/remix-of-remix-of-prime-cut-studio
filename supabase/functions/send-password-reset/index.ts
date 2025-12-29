import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

serve(async (req) => {
  console.log("=== SEND PASSWORD RESET EMAIL STARTED ===");

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

    const { email }: PasswordResetRequest = await req.json();
    console.log("Password reset requested for:", email);

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      // Don't reveal if user exists or not for security
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userExists = userData.users.find(u => u.email === email);
    
    if (!userExists) {
      console.log("User not found, but returning success for security");
      // Don't reveal if user exists or not
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Generate a unique reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    const { error: tokenError } = await supabaseAdmin
      .from("email_confirmation_tokens")
      .insert({
        user_id: userExists.id,
        email: email,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Error storing reset token:", tokenError);
      throw new Error("Failed to create reset token");
    }

    // Build reset URL
    const origin = req.headers.get("origin") || "https://wvnszzrvrrueuycrpgyc.lovable.app";
    const resetUrl = `${origin}/redefinir-senha?token=${resetToken}`;
    console.log("Reset URL:", resetUrl);

    // Get custom template from database
    let htmlContent = "";
    let subject = "Redefinir sua senha - Barber Studio";

    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", "auth_reset")
      .eq("is_active", true)
      .single();

    if (templateError) {
      console.log("No custom template found, using default:", templateError.message);
    }

    const userName = userExists.user_metadata?.name || userExists.email?.split('@')[0] || 'Usuário';

    if (template) {
      console.log("Using custom template:", template.name);
      subject = template.subject;
      htmlContent = template.html_content
        .replace(/\{\{reset_url\}\}/g, resetUrl)
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{name\}\}/g, userName);
    } else {
      // Default template
      console.log("Using default template");
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
    .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #c9a227 0%, #d4af37 50%, #c9a227 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; font-weight: bold; }
    .header .icon { font-size: 48px; margin-bottom: 15px; }
    .content { padding: 40px 30px; }
    .content h2 { color: #ffffff; margin-top: 0; font-size: 22px; }
    .content p { color: #a0a0a0; line-height: 1.8; font-size: 15px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #d4af37 100%); color: #1a1a1a; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(201, 162, 39, 0.3); }
    .link-box { background-color: #252525; border-radius: 8px; padding: 15px; margin: 20px 0; word-break: break-all; }
    .link-box p { color: #666; font-size: 11px; margin: 0; }
    .footer { background-color: #0f0f0f; color: #666; padding: 25px; text-align: center; font-size: 12px; }
    .footer p { margin: 5px 0; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, #333, transparent); margin: 25px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🔐</div>
      <h1>Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Olá, ${userName}!</h2>
      <p>Recebemos sua solicitação de redefinição de senha. Clique no botão abaixo para criar uma nova senha segura.</p>
      <div class="button-container">
        <a href="${resetUrl}" class="button">Redefinir Senha</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 13px;">Ou copie e cole este link no seu navegador:</p>
      <div class="link-box">
        <p>${resetUrl}</p>
      </div>
      <p style="color: #c9a227; font-size: 13px;"><strong>⏱ Este link expira em 1 hora.</strong></p>
    </div>
    <div class="footer">
      <p><strong>Barber Studio</strong> - Tradição e Estilo</p>
      <p>Se você não solicitou este email, pode ignorá-lo.</p>
      <p>© ${new Date().getFullYear()} Todos os direitos reservados</p>
    </div>
  </div>
</body>
</html>`;
    }

    // Send email via Resend
    console.log("Sending password reset email via Resend...");
    const emailResponse = await resend.emails.send({
      from: "Barber Studio <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabaseAdmin.from("email_logs").insert({
      template_type: "auth_reset",
      recipient_email: email,
      recipient_name: userName,
      subject: subject,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending password reset email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
