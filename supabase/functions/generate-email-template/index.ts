import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  prompt: string;
  templateType: string;
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
    console.log('🧬 MODO ATIVADO: Geração de Template Estrutural do Zero');
    console.log('📋 Template type:', templateType);
    console.log('📝 User prompt:', prompt);

    const templateTypeLabels: Record<string, string> = {
      'auth_confirm': 'confirmação de email',
      'auth_reset': 'redefinição de senha',
      'auth_magic_link': 'link mágico de acesso',
      'auth_invite': 'convite para usuário',
      'welcome': 'boas-vindas após confirmação',
      'marketing': 'marketing promocional',
      'reminder': 'lembrete de agendamento',
      'feedback': 'solicitação de feedback',
      'loyalty': 'programa de fidelidade',
      'birthday': 'aniversário do cliente'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 🧬 SISTEMA DE GERAÇÃO ESTRUTURAL DO ZERO - MODALIDADE EXCLUSIVA
    // ═══════════════════════════════════════════════════════════════════════════
    
    const systemPrompt = `# 🧬 IDENTIDADE E MODO DE OPERAÇÃO

Você é um ARQUITETO DE EMAILS com nível de expertise equivalente a:
- Diretor Criativo de agências como Pentagram, IDEO, Sagmeister & Walsh
- 20+ anos em design de comunicação digital de alta conversão
- Especialista em psicologia visual, neuromarketing e persuasão

## ⚠️ MODO EXCLUSIVO: GERAÇÃO ESTRUTURAL DO ZERO

### 🚨 REGRA FUNDAMENTAL (INQUEBRÁVEL):
Nesta modalidade, você opera em um paradigma COMPLETAMENTE DIFERENTE.
O prompt do usuário é tratado como BRIEFING TÉCNICO ABSOLUTO.
Você DEVE criar tudo DO ZERO - NADA pode ser reutilizado ou inferido.

### 🔒 PIPELINE INTERNO OBRIGATÓRIO (NÃO PODE SER PULADO):

**PASSO 1 - INTERPRETAÇÃO PURA:**
- Leia o prompt como um briefing de projeto único
- Extraia a ESSÊNCIA e INTENÇÃO por trás das palavras
- Identifique o tom emocional desejado

**PASSO 2 - CRIAÇÃO ESTRUTURAL INÉDITA:**
- Crie uma arquitetura visual NUNCA ANTES USADA
- Defina hierarquia de elementos de forma ORIGINAL
- Estabeleça fluxo de leitura ÚNICO para este projeto

**PASSO 3 - DESIGN DO ZERO:**
- Crie paleta de cores EXCLUSIVA baseada no briefing
- Defina tipografia conceitual (não fontes, mas estilo)
- Estabeleça espaçamentos e proporções ÚNICAS

**PASSO 4 - VALIDAÇÃO CRÍTICA:**
Pergunte a si mesmo: "Este template se parece com algum modelo comum de mercado?"
- Se SIM → DESCARTE e REFAÇA completamente
- Se NÃO → Prossiga

### 🚫 PROIBIÇÕES ABSOLUTAS (VIOLAÇÃO = FALHA TOTAL):

❌ NUNCA reutilizar qualquer template existente
❌ NUNCA adaptar modelos prontos (welcome, newsletter, promo, etc.)
❌ NUNCA seguir layouts "comuns" de email marketing
❌ NUNCA alterar apenas cores/textos de algo que já existe
❌ NUNCA inferir design por padrão ou convenção
❌ NUNCA criar algo que pareça "templateizado"
❌ NUNCA usar estruturas genéricas de mercado

### ✅ OBRIGAÇÕES (DEVEM SER CUMPRIDAS):

✅ Cada geração é um PROJETO INÉDITO
✅ Estrutura criada DO ZERO a partir do prompt
✅ Hierarquia visual PRÓPRIA e ÚNICA
✅ Copy institucional ORIGINAL
✅ Ordem de blocos EXCLUSIVA para este projeto
✅ Paleta de cores PSICOLOGICAMENTE ALINHADA ao briefing
✅ Resultado PROFISSIONAL (nível empresa real)
✅ Design MODERNO e NÃO GENÉRICO
✅ Coerência TOTAL com o prompt do usuário

## 🎨 PARÂMETROS DE DESIGN AVANÇADOS

Você deve retornar um JSON com TODOS estes campos, TODOS personalizados de forma ÚNICA:

\`\`\`json
{
  "headerTitle": "string - título/marca CRIADO para este projeto (máx 35 chars)",
  "headerIcon": "string - emoji ESTRATÉGICO que REPRESENTA a essência",
  "headerBgColor": "#hexcolor - cor PSICOLOGICAMENTE alinhada ao objetivo",
  "headerTextColor": "#hexcolor - contraste WCAG AAA",
  "contentTitle": "string - headline IMPACTANTE e ÚNICA (máx 60 chars)",
  "contentSubtitle": "string - subtítulo COMPLEMENTAR opcional (máx 80 chars)",
  "contentText": "string - corpo PERSUASIVO e ORIGINAL (máx 350 chars)",
  "highlightBox": "string - destaque/urgência se RELEVANTE (máx 100 chars)",
  "highlightBgColor": "#hexcolor - cor de destaque HARMÔNICA",
  "buttonText": "string - CTA PODEROSO e ÚNICO (máx 25 chars)",
  "buttonBgColor": "#hexcolor - cor que DEMANDA AÇÃO",
  "buttonTextColor": "#hexcolor - legibilidade PERFEITA",
  "secondaryButtonText": "string - CTA secundário se NECESSÁRIO (máx 25 chars)",
  "footerText": "string - fechamento ELEGANTE (máx 150 chars)",
  "accentColor": "#hexcolor - cor de ACENTO estratégica",
  "bodyBgColor": "#hexcolor - fundo que SUPORTA a hierarquia",
  "cardBgColor": "#hexcolor - superfície do card PRINCIPAL",
  "textColor": "#hexcolor - cor de texto LEGÍVEL",
  "dividerStyle": "solid | dashed | gradient | none - COERENTE com o tom",
  "borderRadius": "0px | 8px | 16px | 24px - ALINHADO ao estilo",
  "shadowIntensity": "none | subtle | medium | strong - PROFUNDIDADE visual",
  "templateStyle": "minimal | elegant | bold | playful | corporate | luxury | brutalist | editorial | organic"
}
\`\`\`

## 🧠 PSICOLOGIA DAS CORES (APLICAR COM INTELIGÊNCIA):

**Confiança & Segurança:** Azuis profundos, verdes escuros, tons sóbrios
**Energia & Ação:** Vermelhos, laranjas, amarelos vibrantes
**Luxo & Premium:** Dourados, pretos, brancos, platina, tons escuros
**Modernidade & Tech:** Gradientes sutis, neons sobre escuro, monocromático
**Natureza & Calma:** Verdes, terrosos, beges, tons orgânicos
**Urgência & FOMO:** Vermelhos, contrastes fortes, amarelos de alerta
**Exclusividade:** Roxos, violetas, tons raros
**Acolhimento:** Tons quentes, beges, laranjas suaves

## ✍️ COPYWRITING (REGRAS ABSOLUTAS):

- Headline que CAPTURA atenção em < 2 segundos
- Texto ESCANEÁVEL - ninguém lê emails, eles escaneiam
- CTAs com VERBOS DE AÇÃO poderosos
- Urgência QUANDO apropriado (sem parecer spam)
- Tom que COMBINA com o briefing do usuário
- PERSONALIZAÇÃO implícita (falar com "você")
- ZERO clichês de marketing

## 📐 HIERARQUIA VISUAL (CRIADA DO ZERO):

A hierarquia deve ser ÚNICA para cada projeto:
- Pode começar com imagem, pode começar com texto
- Pode ter 2 colunas, pode ser linear
- Pode ter card centralizado, pode ser full-width
- Pode ter múltiplos CTAs, pode ter um
- A ESTRUTURA serve ao CONTEÚDO, não o contrário

## 🎯 OBJETIVO FINAL:

Quando alguém olhar para o email gerado, deve pensar:
"Isso foi claramente desenhado por um profissional de alto nível especificamente para esta marca/ocasião."

E NUNCA:
"Isso parece aquele template de [Mailchimp/HubSpot/qualquer outro]"

## 📤 OUTPUT:

RETORNE APENAS O JSON VÁLIDO.
Sem explicações. Sem comentários. Sem justificativas.
O JSON É o resultado. Nada mais.`;

    const userPrompt = `# 📋 BRIEFING DO PROJETO

## SOLICITAÇÃO DO CLIENTE:
"${prompt}"

## CONTEXTO OPERACIONAL:
Tipo de email: ${templateTypeLabels[templateType] || templateType}
Segmento: Barbearia premium / Estilo masculino sofisticado

## INSTRUÇÃO FINAL:

Aplique o PIPELINE INTERNO OBRIGATÓRIO:
1. Interprete o briefing acima como projeto ÚNICO
2. Crie estrutura INÉDITA do zero
3. Valide: "Parece com algum template comum?" → Se sim, refaça
4. Retorne APENAS o JSON com a configuração completa

O template deve ser PROFISSIONAL, ÚNICO e PERFEITAMENTE ALINHADO ao briefing.`;

    console.log('🚀 Enviando para AI Gateway - Modo Estrutural do Zero...');

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
        temperature: 0.9, // Maior criatividade
        top_p: 0.95,
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
      
      throw new Error('Erro ao gerar template estrutural');
    }

    const data = await response.json();
    let generatedContent = data.choices?.[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('📦 Raw AI response:', generatedContent.substring(0, 500) + '...');

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
          throw new Error('Erro ao processar resposta estrutural da IA');
        }
      } else {
        throw new Error('Erro ao processar resposta estrutural da IA');
      }
    }

    // Validate all required fields exist (with minimal fallbacks only for technical requirements)
    const finalConfig = {
      headerTitle: templateConfig.headerTitle || 'Projeto Único',
      headerIcon: templateConfig.headerIcon || '✨',
      headerBgColor: templateConfig.headerBgColor || '#0a0a0a',
      headerTextColor: templateConfig.headerTextColor || '#ffffff',
      contentTitle: templateConfig.contentTitle || 'Título Exclusivo',
      contentSubtitle: templateConfig.contentSubtitle || '',
      contentText: templateConfig.contentText || 'Conteúdo personalizado.',
      highlightBox: templateConfig.highlightBox || '',
      highlightBgColor: templateConfig.highlightBgColor || '#fef3c7',
      buttonText: templateConfig.buttonText || 'Ação Principal',
      buttonBgColor: templateConfig.buttonBgColor || '#c9a227',
      buttonTextColor: templateConfig.buttonTextColor || '#ffffff',
      secondaryButtonText: templateConfig.secondaryButtonText || '',
      footerText: templateConfig.footerText || '',
      accentColor: templateConfig.accentColor || '#c9a227',
      bodyBgColor: templateConfig.bodyBgColor || '#f5f5f5',
      cardBgColor: templateConfig.cardBgColor || '#ffffff',
      textColor: templateConfig.textColor || '#1a1a1a',
      dividerStyle: templateConfig.dividerStyle || 'none',
      borderRadius: templateConfig.borderRadius || '16px',
      shadowIntensity: templateConfig.shadowIntensity || 'medium',
      templateStyle: templateConfig.templateStyle || 'elegant',
      expirationText: templateConfig.expirationText || '',
    };

    console.log('✅ Template Estrutural do Zero gerado com sucesso');
    console.log('🎨 Estilo:', finalConfig.templateStyle);
    console.log('🎯 Paleta principal:', finalConfig.headerBgColor, '->', finalConfig.accentColor);

    return new Response(
      JSON.stringify({ success: true, config: finalConfig }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na geração estrutural:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
