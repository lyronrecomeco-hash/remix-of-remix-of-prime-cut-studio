import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Luna AI - Prompt Ultra-Profissional para ChatGPT
const LUNA_SYSTEM_PROMPT = `# 🌙 Luna AI - Arquiteta de Fluxos WhatsApp

Você é a **Luna**, uma IA especializada em criar fluxos de automação WhatsApp ultra-profissionais. Você foi treinada com milhares de fluxos de sucesso e conhece profundamente as melhores práticas de conversação automatizada.

## 📋 TIPOS DE NÓS DISPONÍVEIS

### GATILHOS (obrigatórios - iniciam o fluxo)
- **trigger**: Gatilho inicial (palavra-chave, primeiro contato, botão clicado)

### AÇÕES
- **message**: Envia mensagem de texto (suporta variáveis: {{nome}}, {{telefone}})
- **button**: Envia mensagem com botões interativos (máximo 3 botões)
- **list**: Envia lista de opções selecionáveis
- **delay**: Aguarda tempo antes de continuar (simula digitação humana)
- **ai**: Resposta gerada por IA em tempo real
- **webhook**: Integração com sistema externo (API)
- **variable**: Define/modifica variável do contexto
- **end**: Finaliza o fluxo

### CONTROLE DE FLUXO
- **condition**: Bifurcação condicional (SIM/NÃO)
- **split**: Teste A/B (divide tráfego)
- **goto**: Pula para outro nó específico

### ESPECIAIS
- **integration**: Conecta com CRM/sistemas
- **note**: Nota/comentário (não executa)

## 🔗 REGRAS DE CONEXÃO

1. Todo fluxo DEVE começar com um nó 'trigger'
2. Nós de 'condition' têm 2 saídas: 'yes' e 'no'
3. Nós de 'split' têm 2 saídas para teste A/B
4. Nó 'end' não tem saídas
5. Todos os outros nós têm 1 saída padrão
6. IDs devem ser únicos (use prefixo do tipo + timestamp/número)

## 📐 REGRAS DE LAYOUT

- Posição inicial: x=400, y=80
- Espaçamento vertical: 150px entre nós
- Espaçamento horizontal: 350px para bifurcações
- Caminho principal: centro (x=400)
- Caminho SIM: esquerda (x=150)
- Caminho NÃO: direita (x=650)

## 💡 BOAS PRÁTICAS

1. Sempre adicione delays (2-5s) entre mensagens para parecer humano
2. Use no máximo 3 botões por mensagem
3. Mensagens curtas e objetivas (máximo 3 linhas)
4. Sempre tenha um caminho de "ajuda" ou "falar com humano"
5. Personalize com {{nome}} quando possível
6. Finalize fluxos com agradecimento

## 📤 FORMATO DE RESPOSTA

Responda SEMPRE em JSON válido com esta estrutura:
{
  "flow": {
    "nodes": [
      {
        "id": "string",
        "type": "flowNode",
        "position": { "x": number, "y": number },
        "data": {
          "label": "string",
          "type": "trigger|message|button|list|condition|delay|ai|webhook|variable|split|goto|integration|note|end",
          "config": { ... },
          "description": "string",
          "icon": "string"
        }
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "nodeId",
        "target": "nodeId",
        "sourceHandle": "yes|no|null",
        "targetHandle": null,
        "label": "Sim|Não|null"
      }
    ]
  },
  "summary": "Resumo curto do fluxo criado",
  "tips": ["Dica 1", "Dica 2"]
}

## 🎯 EXEMPLOS DE CONFIGURAÇÕES

### Trigger
{ "triggerType": "keyword", "keywords": "oi,olá,bom dia" }

### Message
{ "text": "Olá {{nome}}! Como posso ajudar?", "typing": true }

### Button
{ "text": "Escolha uma opção:", "buttonsRaw": "btn_1|✅ Opção 1\\nbtn_2|❌ Opção 2" }

### Condition
{ "field": "message", "operator": "contains", "value": "sim" }

### Delay
{ "seconds": 3, "unit": "seconds" }

### AI
{ "prompt": "Responda de forma amigável sobre...", "model": "gpt-4o-mini", "useContext": true }

### Webhook
{ "url": "https://api.example.com", "method": "POST" }

IMPORTANTE: Gere fluxos completos, funcionais e prontos para produção!`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, context } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let content: string = '';

    // Build the user message
    let userMessage = `Crie um fluxo de automação WhatsApp profissional para: ${prompt}`;
    
    if (context?.currentNodes?.length > 0) {
      userMessage += `\n\nContexto atual do fluxo (${context.currentNodes.length} nós existentes):`;
      userMessage += `\nNós: ${context.currentNodes.map((n: any) => n.data?.label || n.id).join(', ')}`;
    }

    // Priority: OpenAI > Gemini > Lovable Gateway
    if (OPENAI_API_KEY) {
      console.log('[Luna AI] Using OpenAI API...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: LUNA_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Luna AI] OpenAI Error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('API Key do OpenAI inválida');
        }
        if (response.status === 429) {
          throw new Error('Limite de requisições OpenAI excedido');
        }
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content || '';
      
    } else if (GEMINI_API_KEY) {
      console.log('[Luna AI] Using Gemini API...');
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: LUNA_SYSTEM_PROMPT + '\n\n---\n\n' + userMessage }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini error: ${response.status}`);
      }

      const data = await response.json();
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
    } else if (LOVABLE_API_KEY) {
      console.log('[Luna AI] Using Lovable Gateway...');
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: LUNA_SYSTEM_PROMPT },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido');
        }
        if (response.status === 402) {
          throw new Error('Créditos insuficientes. Configure OPENAI_API_KEY.');
        }
        throw new Error(`Gateway error: ${response.status}`);
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content || '';
    } else {
      throw new Error('Nenhuma API Key configurada (OPENAI_API_KEY, GEMINI_API_KEY ou LOVABLE_API_KEY)');
    }

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('[Luna AI] Response received, parsing...');

    // Parse JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // Try to extract JSON from markdown
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1].trim());
      } else {
        const startIndex = content.indexOf('{');
        const endIndex = content.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1) {
          result = JSON.parse(content.substring(startIndex, endIndex + 1));
        } else {
          throw new Error('Falha ao processar resposta da IA');
        }
      }
    }

    // Validate and fix the flow
    if (result.flow) {
      const seenIds = new Set();
      result.flow.nodes = result.flow.nodes.map((node: any, index: number) => {
        if (seenIds.has(node.id)) {
          node.id = `${node.data?.type || 'node'}-${Date.now()}-${index}`;
        }
        seenIds.add(node.id);
        return node;
      });

      const nodeIds = new Set(result.flow.nodes.map((n: any) => n.id));
      result.flow.edges = (result.flow.edges || []).filter((edge: any) => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      ).map((edge: any, index: number) => ({
        ...edge,
        id: edge.id || `edge-${Date.now()}-${index}`
      }));
    }

    console.log('[Luna AI] Flow generated:', result.flow?.nodes?.length, 'nodes');

    return new Response(
      JSON.stringify({
        success: true,
        flow: result.flow,
        summary: result.summary || 'Fluxo gerado com sucesso',
        tips: result.tips || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Luna AI] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro ao gerar fluxo',
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
