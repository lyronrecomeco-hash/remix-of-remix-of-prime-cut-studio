import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  email: string;
  templateType: string;
}

serve(async (req) => {
  console.log("=== SEND TEST EMAIL STARTED ===");

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

    const { email, templateType }: TestEmailRequest = await req.json();
    console.log("Sending test email to:", email, "Template:", templateType);

    // Get template from database
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", templateType)
      .eq("is_active", true)
      .single();

    if (templateError) {
      console.log("Template not found:", templateError.message);
      throw new Error("Template não encontrado");
    }

    // Example values for preview
    const exampleValues: Record<string, string> = {
      confirmation_url: "https://exemplo.com/confirmar?token=abc123",
      reset_url: "https://exemplo.com/redefinir?token=xyz789",
      magic_link_url: "https://exemplo.com/magic?token=magic123",
      invite_url: "https://exemplo.com/convite?token=invite456",
      email: email,
      name: "Usuário Teste",
    };

    let htmlContent = template.html_content;
    Object.entries(exampleValues).forEach(([key, value]) => {
      htmlContent = htmlContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    // Send email via Resend
    console.log("Sending test email via Resend...");
    const emailResponse = await resend.emails.send({
      from: "Barber Studio <onboarding@resend.dev>",
      to: [email],
      subject: `[TESTE] ${template.subject}`,
      html: htmlContent,
    });

    console.log("Test email sent successfully:", emailResponse);

    // Log the email
    await supabaseAdmin.from("email_logs").insert({
      template_type: templateType,
      recipient_email: email,
      recipient_name: "Teste",
      subject: `[TESTE] ${template.subject}`,
      status: "sent",
      metadata: { test: true },
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending test email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
