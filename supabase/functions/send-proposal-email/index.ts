import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratedProposal {
  painPoints: string[];
  benefits: string[];
  roiAnalysis: {
    currentCost: string;
    projectedSaving: string;
    paybackPeriod: string;
    roi: string;
  };
  pricing: {
    recommended: string;
    options: { name: string; price: string; features: string[] }[];
  };
  pitch: string;
  nextSteps: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId } = await req.json();

    if (!proposalId) {
      throw new Error("proposalId é obrigatório");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurada");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      throw new Error("Proposta não encontrada");
    }

    if (!proposal.company_email) {
      throw new Error("Email da empresa não informado");
    }

    if (!proposal.generated_proposal) {
      throw new Error("Proposta ainda não foi gerada");
    }

    const generatedProposal = proposal.generated_proposal as GeneratedProposal;
    const affiliateName = proposal.affiliates?.name || "Consultor";
    const affiliateEmail = proposal.affiliates?.email || "";
    const affiliateWhatsapp = proposal.affiliates?.whatsapp || "";
    const nicheName = proposal.business_niches?.name || "Seu Negócio";

    // Gerar HTML do email
    const emailHtml = generateProposalEmailHtml({
      companyName: proposal.company_name,
      contactName: proposal.contact_name,
      affiliateName,
      affiliateEmail,
      affiliateWhatsapp,
      nicheName,
      proposal: generatedProposal,
    });

    // Enviar email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Genesis <noreply@genesisbarber.com.br>",
        to: [proposal.company_email],
        subject: `Proposta Comercial Personalizada - ${proposal.company_name}`,
        html: emailHtml,
        reply_to: affiliateEmail || undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend error:", errorData);
      throw new Error("Falha ao enviar email");
    }

    // Atualizar status da proposta
    const { error: updateError } = await supabase
      .from("affiliate_proposals")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    if (updateError) {
      console.error("Error updating proposal status:", updateError);
    }

    // Log do envio
    await supabase.from("email_logs").insert({
      recipient_email: proposal.company_email,
      recipient_name: proposal.contact_name || proposal.company_name,
      subject: `Proposta Comercial Personalizada - ${proposal.company_name}`,
      template_type: "affiliate_proposal",
      status: "sent",
      metadata: {
        proposal_id: proposalId,
        affiliate_id: proposal.affiliate_id,
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Proposta enviada com sucesso" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending proposal:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateProposalEmailHtml(params: {
  companyName: string;
  contactName: string | null;
  affiliateName: string;
  affiliateEmail: string;
  affiliateWhatsapp: string;
  nicheName: string;
  proposal: GeneratedProposal;
}): string {
  const { companyName, contactName, affiliateName, affiliateEmail, affiliateWhatsapp, nicheName, proposal } = params;

  const greeting = contactName ? `Olá ${contactName}` : `Prezado(a)`;

  const painPointsHtml = proposal.painPoints
    .map((point) => `<li style="margin-bottom: 8px; color: #dc2626;">⚠️ ${point}</li>`)
    .join("");

  const benefitsHtml = proposal.benefits
    .map((benefit) => `<li style="margin-bottom: 8px; color: #16a34a;">✅ ${benefit}</li>`)
    .join("");

  const nextStepsHtml = proposal.nextSteps
    .map((step, index) => `<li style="margin-bottom: 8px;"><strong>${index + 1}.</strong> ${step}</li>`)
    .join("");

  const pricingOptionsHtml = proposal.pricing.options
    .map(
      (option) => `
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 4px solid #6366f1;">
        <h4 style="margin: 0 0 8px 0; color: #1e293b;">${option.name} - ${option.price}</h4>
        <ul style="margin: 0; padding-left: 20px; color: #64748b;">
          ${option.features.map((f) => `<li>${f}</li>`).join("")}
        </ul>
      </div>
    `
    )
    .join("");

  const whatsappLink = affiliateWhatsapp
    ? `https://wa.me/${affiliateWhatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${affiliateName}, tenho interesse na proposta para ${companyName}!`)}`
    : null;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta Comercial - ${companyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Proposta Comercial Personalizada</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 16px;">${companyName} • ${nicheName}</p>
    </div>

    <!-- Content -->
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">
        ${greeting},
      </p>
      <p style="font-size: 16px; color: #334155; line-height: 1.6;">
        É com grande satisfação que apresento esta proposta personalizada desenvolvida especialmente para a <strong>${companyName}</strong>.
      </p>

      <!-- Pain Points -->
      <div style="margin: 32px 0; background: #fef2f2; border-radius: 12px; padding: 24px;">
        <h2 style="color: #991b1b; font-size: 18px; margin: 0 0 16px 0;">🎯 Desafios Identificados</h2>
        <ul style="margin: 0; padding-left: 20px; list-style: none;">
          ${painPointsHtml}
        </ul>
      </div>

      <!-- Benefits -->
      <div style="margin: 32px 0; background: #f0fdf4; border-radius: 12px; padding: 24px;">
        <h2 style="color: #166534; font-size: 18px; margin: 0 0 16px 0;">💡 Benefícios da Nossa Solução</h2>
        <ul style="margin: 0; padding-left: 20px; list-style: none;">
          ${benefitsHtml}
        </ul>
      </div>

      <!-- ROI -->
      <div style="margin: 32px 0; background: #eff6ff; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 16px 0;">📊 Análise de Retorno</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="background: #ffffff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Custo Atual Estimado</p>
            <p style="margin: 4px 0 0 0; color: #dc2626; font-size: 18px; font-weight: 700;">${proposal.roiAnalysis.currentCost}</p>
          </div>
          <div style="background: #ffffff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Economia Projetada</p>
            <p style="margin: 4px 0 0 0; color: #16a34a; font-size: 18px; font-weight: 700;">${proposal.roiAnalysis.projectedSaving}</p>
          </div>
          <div style="background: #ffffff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">Payback</p>
            <p style="margin: 4px 0 0 0; color: #1e40af; font-size: 18px; font-weight: 700;">${proposal.roiAnalysis.paybackPeriod}</p>
          </div>
          <div style="background: #ffffff; padding: 16px; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px;">ROI Anual</p>
            <p style="margin: 4px 0 0 0; color: #7c3aed; font-size: 18px; font-weight: 700;">${proposal.roiAnalysis.roi}</p>
          </div>
        </div>
      </div>

      <!-- Pitch -->
      <div style="margin: 32px 0; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 24px; border-left: 4px solid #7c3aed;">
        <h2 style="color: #5b21b6; font-size: 18px; margin: 0 0 16px 0;">💬 Por Que Escolher Nossa Solução?</h2>
        <p style="color: #4c1d95; font-size: 15px; line-height: 1.7; margin: 0;">${proposal.pitch}</p>
      </div>

      <!-- Pricing -->
      <div style="margin: 32px 0;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 8px 0;">💰 Opções de Investimento</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 16px 0;">Recomendado: <strong>${proposal.pricing.recommended}</strong></p>
        ${pricingOptionsHtml}
      </div>

      <!-- Next Steps -->
      <div style="margin: 32px 0; background: #f8fafc; border-radius: 12px; padding: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; margin: 0 0 16px 0;">🚀 Próximos Passos</h2>
        <ol style="margin: 0; padding-left: 20px; color: #475569; line-height: 1.8;">
          ${nextStepsHtml}
        </ol>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 40px 0;">
        ${whatsappLink ? `
        <a href="${whatsappLink}" style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          💬 Falar no WhatsApp
        </a>
        ` : ""}
        ${affiliateEmail ? `
        <p style="margin: 16px 0 0 0; color: #64748b; font-size: 14px;">
          ou responda este email para <strong>${affiliateEmail}</strong>
        </p>
        ` : ""}
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #1e293b; padding: 24px 32px; text-align: center;">
      <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">
        Proposta elaborada por <strong style="color: #ffffff;">${affiliateName}</strong>
      </p>
      <p style="color: rgba(255,255,255,0.5); margin: 12px 0 0 0; font-size: 12px;">
        Genesis • Sistema de Gestão Empresarial
      </p>
    </div>
  </div>
</body>
</html>
`;
}
