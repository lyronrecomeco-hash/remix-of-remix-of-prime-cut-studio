import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  prompt: string;
  templateType: string;
  currentConfig?: {
    headerTitle?: string;
    contentTitle?: string;
    contentText?: string;
    buttonText?: string;
    headerBgColor?: string;
    buttonBgColor?: string;
  };
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

    const { prompt, templateType }: GenerateRequest = await req.json();
    console.log('🚀 Advanced AI Email Template Generator');
    console.log('Template type:', templateType);
    console.log('User prompt:', prompt);

    const templateTypeLabels: Record<string, string> = {
      'auth_confirm': 'confirmação de email - usuário acabou de se cadastrar e precisa confirmar',
      'auth_reset': 'redefinição de senha - usuário esqueceu a senha e precisa resetar',
      'auth_magic_link': 'link mágico de acesso - login sem senha',
      'auth_invite': 'convite para usuário - convidando alguém para a plataforma',
      'welcome': 'boas-vindas após confirmação - usuário confirmou o email com sucesso',
      'marketing': 'marketing promocional - promoções, ofertas especiais, novidades',
      'reminder': 'lembrete de agendamento - lembrar cliente sobre horário marcado',
      'feedback': 'solicitação de feedback - pedir avaliação após serviço',
      'loyalty': 'programa de fidelidade - pontos, recompensas, benefícios',
      'birthday': 'aniversário do cliente - mensagem especial de aniversário'
    };

    const systemPrompt = `Você é um ESPECIALISTA SÊNIOR em Design de Email Marketing e UX/UI com mais de 15 anos de experiência.
Você trabalhou para grandes marcas como Apple, Nike, Airbnb e domina completamente a arte de criar emails que CONVERTEM.

## SUA ESPECIALIDADE:
- Email Marketing de Alta Conversão
- Design Visual Sofisticado e Moderno
- Copywriting Persuasivo
- Psicologia das Cores
- Hierarquia Visual
- Responsividade Mobile-First
- Acessibilidade

## CONTEXTO DO NEGÓCIO:
Este é um sistema de agendamento para barbearias premium e modernas. O público-alvo são homens que valorizam:
- Estilo e sofisticação
- Atendimento premium
- Experiência diferenciada
- Qualidade acima de tudo

## TIPO DE EMAIL QUE VOCÊ VAI CRIAR:
${templateTypeLabels[templateType] || templateType}

## SUA TAREFA:
Criar um template de email COMPLETAMENTE NOVO e ÚNICO baseado EXCLUSIVAMENTE na ideia/prompt do usuário.
NÃO use templates padrão. CRIE do zero algo original e impactante.

## VOCÊ DEVE RETORNAR UM JSON VÁLIDO:
{
  "headerTitle": "Título/marca do header (máx 35 chars)",
  "headerIcon": "emoji estratégico que representa o conteúdo",
  "headerBgColor": "#hexcolor - cor principal do header",
  "headerTextColor": "#hexcolor - cor do texto do header",
  "contentTitle": "Título principal impactante (máx 60 chars)",
  "contentSubtitle": "Subtítulo complementar opcional (máx 80 chars)",
  "contentText": "Corpo do email - texto persuasivo e claro (máx 300 chars)",
  "highlightBox": "Texto de destaque/urgência opcional (máx 100 chars)",
  "highlightBgColor": "#hexcolor - cor de fundo do destaque",
  "buttonText": "CTA forte e claro (máx 25 chars)",
  "buttonBgColor": "#hexcolor - cor do botão CTA",
  "buttonTextColor": "#hexcolor - cor do texto do botão",
  "secondaryButtonText": "CTA secundário opcional (máx 25 chars)",
  "footerText": "Texto do rodapé (máx 150 chars)",
  "accentColor": "#hexcolor - cor de acento para detalhes",
  "bodyBgColor": "#hexcolor - cor de fundo do corpo",
  "cardBgColor": "#hexcolor - cor de fundo do card principal",
  "textColor": "#hexcolor - cor principal do texto",
  "dividerStyle": "solid | dashed | gradient | none",
  "borderRadius": "0px | 8px | 16px | 24px",
  "shadowIntensity": "none | subtle | medium | strong",
  "templateStyle": "minimal | elegant | bold | playful | corporate | luxury"
}

## REGRAS DE DESIGN PROFISSIONAL:

### CORES:
- Use paletas harmônicas e profissionais
- Contraste adequado para legibilidade (WCAG AA mínimo)
- Cores que evocam a emoção certa para o tipo de email
- Para luxo: dourados, pretos, brancos, tons escuros
- Para energia: vermelhos, laranjas, amarelos vibrantes
- Para confiança: azuis, verdes, tons sóbrios
- Para modernidade: gradientes sutis, tons neutros com acentos

### COPYWRITING:
- Headlines que capturam atenção IMEDIATAMENTE
- Texto escaneável e direto ao ponto
- CTAs com verbos de ação poderosos
- Urgência quando apropriado (sem ser spam)
- Personalização implícita (falar diretamente com o leitor)
- Tom que combina com a marca: premium, acolhedor, profissional

### HIERARQUIA VISUAL:
- Header impactante mas não dominante
- Conteúdo principal com destaque claro
- CTA impossível de ignorar
- Footer discreto mas informativo

### EMOJIS:
Use emojis estratégicos que complementam a mensagem:
- ✨ Novidade, especial
- 🔐 Segurança, privacidade
- 🎉 Celebração, promoção
- ✅ Confirmação, sucesso
- 💈 Barbearia, serviço
- 🔥 Urgência, popular
- ⭐ Premium, qualidade
- 🎁 Presente, surpresa
- ⏰ Tempo, urgência
- 💪 Força, confiança

## IMPORTANTE:
- NUNCA copie templates genéricos
- SEMPRE crie algo ÚNICO baseado no prompt
- Seja CRIATIVO e PROFISSIONAL
- O resultado deve parecer feito por um designer sênior
- Adapte TUDO ao contexto específico do prompt do usuário

Responda APENAS com o JSON válido, sem explicações.`;

    const userPrompt = `## PROMPT DO USUÁRIO:
"${prompt}"

## TIPO DE EMAIL:
${templateTypeLabels[templateType] || templateType}

## INSTRUÇÕES:
Crie um template de email COMPLETAMENTE PERSONALIZADO baseado na ideia acima.
Seja criativo, profissional e impactante.
O resultado deve ser ÚNICO e refletir exatamente o que o usuário pediu.

RETORNE APENAS O JSON com todas as configurações do template.`;

    console.log('Sending request to AI Gateway with advanced prompt...');

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
          JSON.stringify({ success: false, error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Erro ao gerar template');
    }

    const data = await response.json();
    let generatedContent = data.choices?.[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('Raw AI response:', generatedContent);

    // Clean the response - remove markdown code blocks if present
    generatedContent = generatedContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .replace(/^\s*\n/gm, '')
      .trim();

    // Parse JSON
    let templateConfig;
    try {
      templateConfig = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', generatedContent);
      
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          templateConfig = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error('Erro ao processar resposta da IA');
        }
      } else {
        throw new Error('Erro ao processar resposta da IA');
      }
    }

    // Validate and set defaults for required fields
    const finalConfig = {
      headerTitle: templateConfig.headerTitle || 'Barber Studio',
      headerIcon: templateConfig.headerIcon || '💈',
      headerBgColor: templateConfig.headerBgColor || '#1a1a2e',
      headerTextColor: templateConfig.headerTextColor || '#ffffff',
      contentTitle: templateConfig.contentTitle || 'Título do Email',
      contentSubtitle: templateConfig.contentSubtitle || '',
      contentText: templateConfig.contentText || 'Conteúdo do email.',
      highlightBox: templateConfig.highlightBox || '',
      highlightBgColor: templateConfig.highlightBgColor || '#fef3c7',
      buttonText: templateConfig.buttonText || 'Clique Aqui',
      buttonBgColor: templateConfig.buttonBgColor || '#c9a227',
      buttonTextColor: templateConfig.buttonTextColor || '#ffffff',
      secondaryButtonText: templateConfig.secondaryButtonText || '',
      footerText: templateConfig.footerText || 'Obrigado por escolher nossos serviços.',
      accentColor: templateConfig.accentColor || '#c9a227',
      bodyBgColor: templateConfig.bodyBgColor || '#f5f5f5',
      cardBgColor: templateConfig.cardBgColor || '#ffffff',
      textColor: templateConfig.textColor || '#333333',
      dividerStyle: templateConfig.dividerStyle || 'solid',
      borderRadius: templateConfig.borderRadius || '16px',
      shadowIntensity: templateConfig.shadowIntensity || 'medium',
      templateStyle: templateConfig.templateStyle || 'elegant',
      expirationText: templateConfig.expirationText || '',
    };

    console.log('✅ Generated advanced template config:', finalConfig);

    return new Response(
      JSON.stringify({ success: true, config: finalConfig }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate template error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
