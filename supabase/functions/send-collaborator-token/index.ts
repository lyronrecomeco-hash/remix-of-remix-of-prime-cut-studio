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

    // Check for owner settings for WhatsApp automation endpoint
    const { data: waSettings } = await supabaseAdmin
      .from("owner_settings")
      .select("*")
      .eq("setting_key", "whatsapp_automation")
      .single();

    // Format phone number
    let formattedPhone = whatsapp.replace(/\D/g, "");
    if (!formattedPhone.startsWith("55")) {
      formattedPhone = "55" + formattedPhone;
    }

    // Build message
    const message = `🔐 *Acesso CRM - ${companyName}*

Olá, *${name}*! 👋

Você foi adicionado como colaborador no CRM da empresa *${companyName}*.

🔑 *Seu token de acesso:*
\`\`\`
${token}
\`\`\`

📲 *Para acessar o sistema:*
1. Acesse: ${supabaseUrl?.replace('supabase', 'lovable').replace('.co', '.dev')}/crm/token
2. Digite o token acima
3. Pronto! Você terá acesso ao CRM

⚠️ *Importante:*
- Este token é pessoal e intransferível
- Válido por 7 dias
- Use apenas uma vez

Em caso de dúvidas, entre em contato com a empresa.`;

    // Try to send via WhatsApp automation if configured
    if (waSettings?.setting_value) {
      const waConfig = waSettings.setting_value as { 
        mode: string; 
        endpoint?: string; 
        token?: string;
        is_connected?: boolean;
      };

      if (waConfig.is_connected && waConfig.endpoint) {
        try {
          console.log("Sending via WhatsApp Automation:", waConfig.endpoint);
          
          const waResponse = await fetch(`${waConfig.endpoint}/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${waConfig.token || ''}`,
            },
            body: JSON.stringify({
              number: formattedPhone,
              message: message,
            }),
          });

          if (waResponse.ok) {
            console.log("Token sent successfully via WhatsApp Automation!");
            return new Response(
              JSON.stringify({ success: true, message: "Token sent via WhatsApp Automation" }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          } else {
            console.error("WhatsApp Automation failed:", await waResponse.text());
          }
        } catch (waError) {
          console.error("WhatsApp Automation error:", waError);
        }
      }
    }

    // Fallback to ChatPro if available
    const { data: chatproConfig } = await supabaseAdmin
      .from("chatpro_config")
      .select("*")
      .single();

    if (chatproConfig?.is_enabled && chatproConfig?.api_token) {
      console.log("Fallback to ChatPro...");
      
      let baseEndpoint = chatproConfig.base_endpoint || "https://v2.chatpro.com.br";
      if (baseEndpoint.endsWith("/")) {
        baseEndpoint = baseEndpoint.slice(0, -1);
      }
      
      const instanceId = chatproConfig.instance_id;
      let chatProUrl: string;
      
      if (instanceId && !baseEndpoint.includes(instanceId)) {
        chatProUrl = `${baseEndpoint}/${instanceId}/api/v1/send_message`;
      } else {
        chatProUrl = `${baseEndpoint}/api/v1/send_message`;
      }

      const chatProResponse = await fetch(chatProUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: chatproConfig.api_token,
        },
        body: JSON.stringify({
          number: formattedPhone,
          message: message,
        }),
      });

      if (chatProResponse.ok) {
        console.log("Token sent successfully via ChatPro!");
        return new Response(
          JSON.stringify({ success: true, message: "Token sent via ChatPro" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        console.error("ChatPro failed:", await chatProResponse.text());
      }
    }

    // No WhatsApp provider configured or all failed
    console.log("No WhatsApp provider available or all failed");
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "No WhatsApp provider configured",
        token: token // Return token so it can be shown/copied
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error sending collaborator token:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
