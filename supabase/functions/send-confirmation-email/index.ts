import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  email: string;
  name: string;
  confirmationUrl?: string;
}

serve(async (req) => {
  console.log("=== SEND CONFIRMATION EMAIL STARTED ===");

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

    const { email, name, confirmationUrl }: ConfirmationEmailRequest = await req.json();
    console.log("Sending confirmation to:", email);
    console.log("Confirmation URL:", confirmationUrl);

    // Get custom template from database
    let htmlContent = "";
    let subject = "Confirme seu email - Barber Studio";

    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", "auth_confirm")
      .eq("is_active", true)
      .single();

    if (templateError) {
      console.log("No custom template found, using default:", templateError.message);
    }

    if (template) {
      console.log("Using custom template:", template.name);
      subject = template.subject;
      htmlContent = template.html_content
        .replace(/\{\{confirmation_url\}\}/g, confirmationUrl || "#")
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{name\}\}/g, name);
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
      <div class="icon">✨</div>
      <h1>Barber Studio</h1>
    </div>
    <div class="content">
      <h2>Olá, ${name}!</h2>
      <p>Obrigado por se cadastrar! Clique no botão abaixo para confirmar seu email e ativar sua conta.</p>
      <div class="button-container">
        <a href="${confirmationUrl}" class="button">Confirmar Email</a>
      </div>
      <div class="divider"></div>
      <p style="font-size: 13px;">Ou copie e cole este link no seu navegador:</p>
      <div class="link-box">
        <p>${confirmationUrl}</p>
      </div>
      <p style="color: #c9a227; font-size: 13px;"><strong>⏱ Este link expira em 24 horas.</strong></p>
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
    console.log("Sending email via Resend...");
    const emailResponse = await resend.emails.send({
      from: "Barber Studio <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabaseAdmin.from("email_logs").insert({
      template_type: "auth_confirm",
      recipient_email: email,
      recipient_name: name,
      subject: subject,
      status: "sent",
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending confirmation email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
