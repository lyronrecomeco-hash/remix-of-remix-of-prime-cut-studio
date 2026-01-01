import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { niche, answers, currentQuestionIndex, companyName } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      throw new Error('AI service not configured');
    }

    console.log(`Generating follow-up for ${companyName} in niche ${niche}, question index: ${currentQuestionIndex}`);

    // Construir contexto das respostas anteriores
    const answersContext = answers
      .map((a: { question: string; answer: string }, i: number) => `P${i + 1}: ${a.question}\nR: ${a.answer}`)
      .join('\n\n');

    const systemPrompt = `Você é um consultor de negócios especializado em análise empresarial para o segmento de ${niche}.
Seu objetivo é entender profundamente o negócio para gerar uma proposta comercial personalizada.

Baseado nas respostas anteriores do cliente, você deve:
1. Gerar UMA pergunta de follow-up relevante e específica
2. A pergunta deve explorar dores, desafios ou oportunidades do negócio
3. Seja conversacional mas profissional
4. Foque em informações que ajudem a calcular ROI e benefícios

IMPORTANTE:
- Retorne APENAS a pergunta, sem introdução ou explicação
- A pergunta deve ser objetiva e fácil de responder
- Evite perguntas já feitas
- Se já tiver informações suficientes (após 7-8 perguntas), retorne: "[COMPLETE]"`;

    const userPrompt = `Empresa: ${companyName}
Nicho: ${niche}
Número de perguntas já feitas: ${currentQuestionIndex}

Respostas anteriores:
${answersContext || 'Nenhuma resposta ainda.'}

Gere a próxima pergunta de follow-up mais relevante:`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA insuficientes.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('AI service error');
    }

    const data = await response.json();
    const followUpQuestion = data.choices?.[0]?.message?.content?.trim() || '';
    
    console.log('Generated follow-up:', followUpQuestion);

    // Verificar se o questionário está completo
    const isComplete = followUpQuestion.includes('[COMPLETE]') || currentQuestionIndex >= 8;

    return new Response(
      JSON.stringify({
        followUpQuestion: isComplete ? null : followUpQuestion,
        isComplete,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in questionnaire-ai:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
