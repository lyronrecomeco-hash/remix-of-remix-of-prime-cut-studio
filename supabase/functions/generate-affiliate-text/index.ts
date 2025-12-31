import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, type, affiliateCode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating text with prompt:', prompt, 'type:', type);

    const systemPrompt = `Você é um especialista em copywriting e marketing digital para afiliados.
    Gere textos persuasivos, profissionais e de alta conversão para marketing de afiliados.
    Use emojis com moderação. Seja direto e convincente.
    O link de afiliado para incluir é: ${affiliateCode ? `https://app.genesishub.cloud/admin-login?ref=${affiliateCode}` : '[LINK]'}`;

    const typePrompts: Record<string, string> = {
      'whatsapp': 'Crie uma mensagem curta e direta para WhatsApp (máximo 300 caracteres) sobre:',
      'instagram': 'Crie uma legenda para Instagram com hashtags relevantes sobre:',
      'facebook': 'Crie um post para Facebook engajador e persuasivo sobre:',
      'email': 'Crie um e-mail marketing profissional com assunto e corpo sobre:',
      'story': 'Crie um texto curto e impactante para Story do Instagram sobre:',
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${typePrompts[type] || 'Crie um texto de marketing sobre:'} ${prompt}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos esgotados. Entre em contato com o suporte.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ text: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating text:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar texto' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
