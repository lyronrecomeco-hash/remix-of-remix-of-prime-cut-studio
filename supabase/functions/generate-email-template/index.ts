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

    const { prompt, templateType, currentConfig }: GenerateRequest = await req.json();
    console.log('Generating email template with AI:', templateType, prompt);

    const templateTypeLabels: Record<string, string> = {
      'auth_confirm': 'confirmação de email',
      'auth_reset': 'redefinição de senha',
      'auth_magic_link': 'link mágico de acesso',
      'auth_invite': 'convite para usuário'
    };

    const systemPrompt = `Você é um especialista em design de emails e UX/UI.
Sua tarefa é personalizar templates de email para uma barbearia moderna e sofisticada.

VOCÊ DEVE RETORNAR UM JSON VÁLIDO com a seguinte estrutura:
{
  "headerTitle": "Nome da marca/título do header",
  "contentTitle": "Título principal do conteúdo",
  "contentText": "Texto explicativo do email",
  "buttonText": "Texto do botão CTA",
  "headerBgColor": "#hexcolor",
  "buttonBgColor": "#hexcolor",
  "headerIcon": "emoji ou ícone unicode",
  "footerText": "Texto do rodapé"
}

REGRAS IMPORTANTES:
- headerTitle: máximo 30 caracteres
- contentTitle: máximo 50 caracteres  
- contentText: máximo 200 caracteres, texto claro e profissional
- buttonText: máximo 20 caracteres, deve ser um CTA claro
- Cores devem ser em formato hexadecimal (#RRGGBB)
- Para cores, escolha paletas que transmitam profissionalismo e elegância
- headerIcon: use emojis apropriados como ✨, 🔐, 🔗, 🎉, ✅, 💈
- O tom deve ser profissional mas acolhedor
- Adapte o conteúdo ao tipo de email: ${templateTypeLabels[templateType] || templateType}

Responda APENAS com o JSON, sem explicações adicionais.`;

    const userPrompt = `Crie/personalize um template de email de ${templateTypeLabels[templateType] || templateType} com base nesta descrição do usuário:

"${prompt}"

${currentConfig ? `
Configuração atual (pode manter ou modificar conforme a ideia do usuário):
- Título header: ${currentConfig.headerTitle || 'Barber Studio'}
- Título conteúdo: ${currentConfig.contentTitle || ''}
- Texto: ${currentConfig.contentText || ''}
- Botão: ${currentConfig.buttonText || ''}
- Cor header: ${currentConfig.headerBgColor || '#c9a227'}
- Cor botão: ${currentConfig.buttonBgColor || '#c9a227'}
` : ''}

Retorne o JSON com as configurações personalizadas baseadas na ideia do usuário.`;

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

    // Clean the response - remove markdown code blocks if present
    generatedContent = generatedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    let templateConfig;
    try {
      templateConfig = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', generatedContent);
      throw new Error('Erro ao processar resposta da IA');
    }

    console.log('Generated template config:', templateConfig);

    return new Response(
      JSON.stringify({ success: true, config: templateConfig }),
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
