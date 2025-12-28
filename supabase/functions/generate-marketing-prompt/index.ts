import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  type: 'generate' | 'improve';
  context: string;
  currentMessage?: string;
  feedback?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY não configurada');
    }

    const { type, context, currentMessage, feedback }: GenerateRequest = await req.json();
    console.log('Generating marketing prompt:', type, context);

    let systemPrompt = `Você é um especialista em marketing para barbearias. 
Crie mensagens de WhatsApp persuasivas, curtas e diretas para campanhas de marketing.
As mensagens devem:
- Ser em português brasileiro
- Ter no máximo 300 caracteres
- Usar emojis com moderação (1-3)
- Incluir call-to-action claro
- Ser personalizáveis com {{nome}} para o nome do cliente
- Focar em promoções, lembretes ou anúncios
- Evitar spam ou linguagem agressiva`;

    let userPrompt = '';

    if (type === 'generate') {
      userPrompt = `Crie uma mensagem de marketing para uma barbearia com o seguinte contexto/objetivo:

${context}

Responda APENAS com a mensagem, sem explicações adicionais.`;
    } else if (type === 'improve') {
      userPrompt = `Melhore a seguinte mensagem de marketing de barbearia:

Mensagem atual:
${currentMessage}

${feedback ? `Feedback do usuário: ${feedback}` : 'Torne-a mais atraente e persuasiva.'}

Responda APENAS com a mensagem melhorada, sem explicações adicionais.`;
    }

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
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Créditos de IA esgotados. Adicione créditos na sua conta.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Erro ao gerar mensagem');
    }

    const data = await response.json();
    const generatedMessage = data.choices?.[0]?.message?.content?.trim();

    if (!generatedMessage) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('Generated message:', generatedMessage.substring(0, 50) + '...');

    return new Response(
      JSON.stringify({ success: true, message: generatedMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate prompt error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
