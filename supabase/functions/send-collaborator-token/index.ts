import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTokenRequest {
  whatsapp: string;
  name: string;
  token: string;
  companyName: string;
}

serve(async (req) => {
  console.log("=== SEND COLLABORATOR TOKEN STARTED ===");

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

    const { whatsapp, name, token, companyName }: SendTokenRequest = await req.json();
    console.log("Sending collaborator token to:", whatsapp, "Name:", name);

    if (!whatsapp || !token) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get template from database (optional)
    const { data: templateData } = await supabaseAdmin
      .from("whatsapp_automation_templates")
      .select("*")
      .eq("template_type", "collaborator_token")
      .eq("is_active", true)
      .maybeSingle();

    // Get WhatsApp Automation settings (required)
    const { data: waSettings } = await supabaseAdmin
      .from("owner_settings")
      .select("*")
      .eq("setting_key", "whatsapp_automation")
      .maybeSingle();

    // Format phone number
    let formattedPhone = whatsapp.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    // Build access link
    const accessLink = `${supabaseUrl?.replace('.supabase.co', '.lovable.dev')}/crm/token`;

    // Use template or fallback to default message
    let message: string;
    if (templateData?.message_template) {
      message = templateData.message_template
        .replace(/\{\{empresa\}\}/g, companyName)
        .replace(/\{\{nome\}\}/g, name)
        .replace(/\{\{token\}\}/g, token)
        .replace(/\{\{link\}\}/g, accessLink);
    } else {
      // Fallback default message
      message = `🔐 *Acesso CRM - ${companyName}*

Olá, *${name}*! 👋

Você foi adicionado como colaborador no CRM da empresa *${companyName}*.

🔑 *Seu token de acesso:*
\`\`\`
${token}
\`\`\`

📲 *Para acessar o sistema:*
1. Acesse: ${accessLink}
2. Cole o token acima
3. Pronto! Você terá acesso ao CRM

⚠️ *Importante:*
- Este token é pessoal e intransferível
- Válido por 7 dias
- Use apenas uma vez

Em caso de dúvidas, entre em contato com a empresa.`;
    }

    // Send ONLY via WhatsApp Automation
    const waConfig = (waSettings?.setting_value || null) as
      | {
          mode?: string;
          endpoint?: string;
          token?: string;
          is_connected?: boolean;
        }
      | null;

    if (!waConfig?.is_connected || !waConfig.endpoint || !waConfig.token) {
      console.log("WhatsApp Automation not configured or not connected");
      return new Response(
        JSON.stringify({
          success: false,
          message:
            "WhatsApp Automação não configurado/conectado. Verifique no Painel Owner > WhatsApp Automação.",
          token,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Pick a connected instance
    const { data: instance } = await supabaseAdmin
      .from("whatsapp_instances")
      .select("id")
      .eq("status", "connected")
      .order("last_seen", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!instance?.id) {
      console.log("No connected WhatsApp instance available");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Nenhuma instância WhatsApp conectada para enviar o token.",
          token,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Normalize endpoint - remove trailing slash and avoid double /api/instance
    let baseEndpoint = waConfig.endpoint.replace(/\/+$/, '');
    // If endpoint already contains /api/instance, use it directly
    const sendUrl = baseEndpoint.includes('/api/instance')
      ? `${baseEndpoint}/${instance.id}/send`
      : `${baseEndpoint}/api/instance/${instance.id}/send`;

    try {
      console.log("Sending collaborator token via WhatsApp Automation:", sendUrl);

      const waResponse = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${waConfig.token}`,
        },
        body: JSON.stringify({
          phone: formattedPhone,
          message,
        }),
      });

      const responseText = await waResponse.text();

      if (waResponse.ok) {
        await supabaseAdmin.from("whatsapp_message_logs").insert({
          instance_id: instance.id,
          direction: "outgoing",
          phone_to: formattedPhone,
          message,
          status: "sent",
        });

        console.log("Token sent successfully via WhatsApp Automation!");
        return new Response(
          JSON.stringify({ success: true, message: "Token enviado via WhatsApp Automação" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }

      await supabaseAdmin.from("whatsapp_message_logs").insert({
        instance_id: instance.id,
        direction: "outgoing",
        phone_to: formattedPhone,
        message,
        status: "failed",
        error_message: responseText || "Falha ao enviar",
      });

      console.error("WhatsApp Automation failed:", responseText);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Falha ao enviar via WhatsApp Automação",
          error: responseText,
          token,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    } catch (waError) {
      const errMsg = waError instanceof Error ? waError.message : "Erro desconhecido";

      await supabaseAdmin.from("whatsapp_message_logs").insert({
        instance_id: instance.id,
        direction: "outgoing",
        phone_to: formattedPhone,
        message,
        status: "failed",
        error_message: errMsg,
      });

      console.error("WhatsApp Automation error:", waError);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Erro de conexão com WhatsApp Automação",
          error: errMsg,
          token,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

  } catch (error: unknown) {
    console.error("Error sending collaborator token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
