import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, instanceId } = await req.json();

    if (!proposalId) {
      throw new Error("proposalId é obrigatório");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[WhatsApp Proposal] Starting send for proposal: ${proposalId}`);

    // Buscar proposta com dados do afiliado
    const { data: proposal, error: proposalError } = await supabase
      .from("affiliate_proposals")
      .select(`
        *,
        affiliates:affiliate_id (name, email, whatsapp),
        business_niches:niche_id (name)
      `)
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error("[WhatsApp Proposal] Proposal not found:", proposalError);
      throw new Error("Proposta não encontrada");
    }

    if (!proposal.company_phone) {
      console.error("[WhatsApp Proposal] No company phone");
      throw new Error("Telefone da empresa não informado");
    }

    // Buscar instância do WhatsApp conectada
    let instance = null;
    
    if (instanceId) {
      // Usar instância específica
      const { data: specificInstance } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("id", instanceId)
        .eq("status", "connected")
        .single();
      
      instance = specificInstance;
    }
    
    if (!instance) {
      // Buscar primeira instância conectada e ativa
      const { data: instances } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("status", "connected")
        .eq("is_active", true)
        .order("last_heartbeat", { ascending: false })
        .limit(1);

      instance = instances?.[0];
    }

    if (!instance) {
      console.error("[WhatsApp Proposal] No connected WhatsApp instance found");
      throw new Error("Nenhuma instância do WhatsApp conectada");
    }

    console.log(`[WhatsApp Proposal] Using instance: ${instance.name} (${instance.id})`);

    // Formatar número de telefone
    let phone = proposal.company_phone.replace(/\D/g, "");
    if (!phone.startsWith("55") && phone.length <= 11) {
      phone = "55" + phone;
    }

    // Gerar link da proposta
    const proposalLink = `${supabaseUrl.replace('.supabase.co', '')}.lovable.app/proposta/${proposalId}`;
    // Fallback para URL base se não funcionar
    const baseUrl = "https://genesishub.cloud";
    const finalLink = `${baseUrl}/proposta/${proposalId}`;

    // Montar mensagem
    const companyName = proposal.company_name;
    const affiliateName = proposal.affiliates?.name || "Consultor Genesis";
    const nicheName = proposal.business_niches?.name || "seu negócio";

    const message = `🚀 *Proposta Comercial Personalizada*

Olá! Sou ${affiliateName}, consultor parceiro do *Genesis Hub*.

Preparei uma proposta exclusiva para a *${companyName}* com foco em ${nicheName}.

📊 *Na proposta você encontra:*
✅ Diagnóstico completo do seu negócio
✅ Análise de ROI detalhada
✅ Benefícios exclusivos
✅ Planos e investimento

🔗 *Acesse sua proposta interativa:*
${finalLink}

_A proposta possui IA em tempo real para tirar suas dúvidas!_

Aguardo seu retorno! 💼`;

    // Enviar via backend local/VPS
    const backendEndpoint = instance.backend_url || "http://localhost:3001";
    const backendToken = instance.backend_token || instance.instance_token;

    console.log(`[WhatsApp Proposal] Sending to ${phone} via ${backendEndpoint}`);

    try {
      const sendResponse = await fetch(`${backendEndpoint}/api/instance/${instance.id}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(backendToken ? { "Authorization": `Bearer ${backendToken}` } : {}),
        },
        body: JSON.stringify({
          phone,
          message,
        }),
      });

      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        console.error("[WhatsApp Proposal] Send failed:", errorText);
        throw new Error(`Falha ao enviar WhatsApp: ${sendResponse.status}`);
      }

      var sendResult = await sendResponse.json();
      console.log("[WhatsApp Proposal] Message sent successfully:", sendResult);
    } catch (fetchError) {
      console.error("[WhatsApp Proposal] Fetch error:", fetchError);
      throw new Error("Backend do WhatsApp não está acessível. Verifique se o script está rodando.");
    }

    // Atualizar proposta com status de envio
    await supabase
      .from("affiliate_proposals")
      .update({
        status: proposal.status === "draft" ? "sent" : proposal.status,
        sent_at: proposal.sent_at || new Date().toISOString(),
        notes: `${proposal.notes || ""}\n[WhatsApp] Enviado em ${new Date().toLocaleString("pt-BR")}`.trim(),
      })
      .eq("id", proposalId);

    // Registrar no inbox se existir
    try {
      await supabase.from("whatsapp_inbox").insert({
        instance_id: instance.id,
        remote_jid: `${phone}@s.whatsapp.net`,
        message_id: sendResult.messageId || `proposal_${proposalId}_${Date.now()}`,
        from_me: true,
        message_type: "text",
        content: message,
        timestamp: new Date().toISOString(),
        status: "sent",
      });
    } catch (inboxError) {
      console.log("[WhatsApp Proposal] Could not log to inbox:", inboxError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Proposta enviada via WhatsApp",
        phone,
        instanceUsed: instance.name
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WhatsApp Proposal] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
