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

    const systemPrompt = `Você é um ESPECIALISTA em copywriting e marketing digital para barbearias.
Seu objetivo é criar mensagens de WhatsApp EXTREMAMENTE persuasivas que CONVERTEM.

ESTRUTURA OBRIGATÓRIA DA MENSAGEM:

1. **GANCHO EMOCIONAL** (primeira linha):
   - Toque na DOR do cliente (ex: "Cansado de não se sentir bem com seu visual?")
   - Use uma pergunta poderosa ou afirmação que gere identificação
   
2. **AGITAÇÃO DO PROBLEMA**:
   - Amplifique a dor sutilmente
   - Mostre que você entende o problema
   
3. **SOLUÇÃO** (sua oferta):
   - Apresente sua barbearia como A solução
   - Destaque o benefício principal
   - Se houver promoção, apresente com URGÊNCIA
   
4. **PROVA SOCIAL** (opcional):
   - Mencione satisfação dos clientes
   - Use números se possível
   
5. **CALL-TO-ACTION CLARO**:
   - Diga EXATAMENTE o que fazer
   - Crie urgência ("Vagas limitadas", "Só hoje", etc.)

REGRAS IMPORTANTES:
- Máximo 350 caracteres (mensagens curtas convertem mais)
- Use 2-4 emojis estratégicos (não exagere)
- Tom: profissional mas próximo, como um amigo expert
- Personalize com {{nome}} no início
- Em português brasileiro natural
- Evite parecer spam ou desesperado
- Foque em TRANSFORMAÇÃO, não apenas no serviço

EXEMPLOS DE ESTRUTURAS QUE FUNCIONAM:

"{{nome}}, [pergunta que toca na dor]? 💇‍♂️

[Sua solução + benefício]

[Oferta/urgência]

[CTA direto]"

"Ei {{nome}}! [Identificação do problema]

[Como você resolve + diferencial]

🔥 [Oferta irresistível]

[CTA com urgência]"`;

    let userPrompt = '';

    if (type === 'generate') {
      userPrompt = `Crie uma mensagem de marketing PERSUASIVA para uma barbearia com base neste contexto/objetivo:

${context}

IMPORTANTE: Use a estrutura DOR → AGITAÇÃO → SOLUÇÃO → CTA.
Responda APENAS com a mensagem final, sem explicações.`;
    } else if (type === 'improve') {
      userPrompt = `Melhore esta mensagem de marketing de barbearia, tornando-a MAIS PERSUASIVA:

MENSAGEM ATUAL:
${currentMessage}

${feedback ? `AJUSTES SOLICITADOS: ${feedback}` : 'Torne-a mais impactante, com melhor gancho emocional e CTA mais forte.'}

IMPORTANTE: 
- Mantenha a estrutura DOR → SOLUÇÃO → CTA
- Melhore o gancho inicial
- Fortaleça a urgência
- Responda APENAS com a mensagem melhorada, sem explicações.`;
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
