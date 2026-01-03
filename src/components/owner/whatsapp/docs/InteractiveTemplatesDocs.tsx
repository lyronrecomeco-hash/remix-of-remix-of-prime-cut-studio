import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Book, 
  Zap, 
  MessageSquare, 
  MousePointer, 
  GitBranch, 
  Code, 
  Webhook,
  Settings,
  PlayCircle,
  FileJson,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

const InteractiveTemplatesDocs = () => {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
          <Book className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Documentação: Templates Interativos</h1>
          <p className="text-muted-foreground">Sistema completo de mensagens interativas para WhatsApp</p>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs">Templates</TabsTrigger>
          <TabsTrigger value="buttons" className="text-xs">Botões</TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">Ações</TabsTrigger>
          <TabsTrigger value="states" className="text-xs">Estados</TabsTrigger>
          <TabsTrigger value="webhook" className="text-xs">Webhook</TabsTrigger>
          <TabsTrigger value="testing" className="text-xs">Testes</TabsTrigger>
          <TabsTrigger value="examples" className="text-xs">Exemplos</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Sistema de Templates Interativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O sistema de Templates Interativos permite criar fluxos conversacionais 
                automatizados no WhatsApp com botões, listas e ações programáticas.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <h4 className="font-semibold text-green-400 mb-2">✅ Funcionalidades</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Templates com botões de resposta rápida</li>
                    <li>• Listas interativas com seções</li>
                    <li>• Botões CTA (Call to Action)</li>
                    <li>• Motor de ações automatizadas</li>
                    <li>• Gerenciamento de estados de conversa</li>
                    <li>• Webhook para integração externa</li>
                    <li>• Modo de teste integrado</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold text-blue-400 mb-2">🔄 Fluxo de Funcionamento</h4>
                  <ol className="text-sm space-y-1 text-muted-foreground">
                    <li>1. Criar template interativo</li>
                    <li>2. Configurar ações para botões</li>
                    <li>3. Enviar template para usuário</li>
                    <li>4. Usuário clica em botão</li>
                    <li>5. Webhook processa o clique</li>
                    <li>6. Ação é executada</li>
                    <li>7. Estado da conversa atualizado</li>
                  </ol>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">📊 Tabelas do Sistema</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Badge variant="outline">whatsapp_interactive_templates</Badge>
                  <Badge variant="outline">whatsapp_button_actions</Badge>
                  <Badge variant="outline">whatsapp_conversation_states</Badge>
                  <Badge variant="outline">whatsapp_button_clicks</Badge>
                  <Badge variant="outline">whatsapp_template_sends</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                Templates Interativos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Templates são modelos de mensagem com elementos interativos como botões e listas.
              </p>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Tipos de Template</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Badge className="bg-blue-500">text</Badge>
                      <p className="text-sm text-muted-foreground">Mensagem simples de texto</p>
                    </div>
                    <div className="space-y-2">
                      <Badge className="bg-green-500">buttons</Badge>
                      <p className="text-sm text-muted-foreground">Até 3 botões de resposta rápida</p>
                    </div>
                    <div className="space-y-2">
                      <Badge className="bg-purple-500">list</Badge>
                      <p className="text-sm text-muted-foreground">Lista com seções e itens</p>
                    </div>
                    <div className="space-y-2">
                      <Badge className="bg-orange-500">cta</Badge>
                      <p className="text-sm text-muted-foreground">Botões de ação (URL, telefone)</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Estrutura do Template</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "name": "pedido_confirmado",
  "template_type": "buttons",
  "message_content": "Seu pedido #{{order_id}} foi confirmado!",
  "footer_text": "Genesis WhatsApp",
  "buttons": [
    { "id": "btn_track", "text": "📍 Rastrear", "action": "track_order" },
    { "id": "btn_cancel", "text": "❌ Cancelar", "action": "cancel_order" }
  ],
  "variables": ["order_id"],
  "category": "orders"
}`}
                  </pre>
                </div>

                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-400">Limites do WhatsApp</h4>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• Máximo de 3 botões por template</li>
                        <li>• Texto do botão: máximo 20 caracteres</li>
                        <li>• Listas: máximo 10 seções, 10 itens por seção</li>
                        <li>• Footer: máximo 60 caracteres</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buttons */}
        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5 text-purple-500" />
                Configuração de Botões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cada botão possui um ID único que é usado para identificar a ação quando clicado.
              </p>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Estrutura do Botão</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "id": "btn_confirmar_123",  // ID único do botão
  "text": "✅ Confirmar",      // Texto exibido (max 20 chars)
  "action": "confirm_order",   // Identificador da ação
  "payload": {                 // Dados extras (opcional)
    "order_id": "123"
  }
}`}
                </pre>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <h4 className="font-semibold text-green-400 mb-2">Botões de Resposta</h4>
                  <p className="text-sm text-muted-foreground">
                    Botões simples que retornam um callback quando clicados.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/10 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Botões URL</h4>
                  <p className="text-sm text-muted-foreground">
                    Abrem um link externo quando clicados.
                  </p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-lg">
                  <h4 className="font-semibold text-purple-400 mb-2">Botões Telefone</h4>
                  <p className="text-sm text-muted-foreground">
                    Iniciam uma chamada telefônica.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Actions */}
        <TabsContent value="actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Motor de Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O Motor de Ações define o que acontece quando um botão é clicado.
              </p>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3">Tipos de Ação Disponíveis</h4>
                  <div className="grid gap-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <Badge className="bg-green-500 mt-0.5">send_template</Badge>
                      <div>
                        <p className="text-sm font-medium">Enviar Template</p>
                        <p className="text-xs text-muted-foreground">Envia outro template como resposta</p>
                        <pre className="text-xs mt-2 bg-muted p-2 rounded">
{`{ "next_template_id": "uuid-do-template" }`}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <Badge className="bg-blue-500 mt-0.5">update_state</Badge>
                      <div>
                        <p className="text-sm font-medium">Atualizar Estado</p>
                        <p className="text-xs text-muted-foreground">Muda o estado da conversa</p>
                        <pre className="text-xs mt-2 bg-muted p-2 rounded">
{`{ "new_state": "awaiting_payment" }`}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <Badge className="bg-purple-500 mt-0.5">create_order</Badge>
                      <div>
                        <p className="text-sm font-medium">Criar Pedido</p>
                        <p className="text-xs text-muted-foreground">Cria um novo pedido no sistema</p>
                        <pre className="text-xs mt-2 bg-muted p-2 rounded">
{`{ "product_id": "123", "quantity": 1 }`}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <Badge className="bg-orange-500 mt-0.5">send_payment</Badge>
                      <div>
                        <p className="text-sm font-medium">Enviar Link de Pagamento</p>
                        <p className="text-xs text-muted-foreground">Gera e envia um link de pagamento</p>
                        <pre className="text-xs mt-2 bg-muted p-2 rounded">
{`{ "payment_method": "pix", "amount_from_context": true }`}
                        </pre>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                      <Badge className="bg-red-500 mt-0.5">transfer_to_human</Badge>
                      <div>
                        <p className="text-sm font-medium">Transferir para Humano</p>
                        <p className="text-xs text-muted-foreground">Encerra o bot e transfere para atendente</p>
                        <pre className="text-xs mt-2 bg-muted p-2 rounded">
{`{ "department": "suporte", "priority": "high" }`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* States */}
        <TabsContent value="states" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-cyan-500" />
                Estados de Conversa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cada conversa mantém um estado que permite criar fluxos condicionais.
              </p>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Estrutura do Estado</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "phone": "5511999999999",
  "current_state": "awaiting_payment",
  "context": {
    "order_id": "12345",
    "total": 150.00,
    "items": ["Produto A", "Produto B"]
  },
  "last_template_id": "uuid-ultimo-template",
  "last_button_clicked": "btn_confirmar"
}`}
                </pre>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Estados Comuns</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">initial</Badge>
                    <Badge variant="outline">menu</Badge>
                    <Badge variant="outline">browsing</Badge>
                    <Badge variant="outline">cart</Badge>
                    <Badge variant="outline">checkout</Badge>
                    <Badge variant="outline">awaiting_payment</Badge>
                    <Badge variant="outline">paid</Badge>
                    <Badge variant="outline">delivered</Badge>
                    <Badge variant="outline">support</Badge>
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Contexto Dinâmico</h4>
                  <p className="text-sm text-muted-foreground">
                    O campo <code>context</code> armazena dados da sessão que 
                    podem ser usados nas variáveis dos templates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook */}
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-orange-500" />
                Webhook de Botões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O webhook processa cliques de botões e executa as ações configuradas.
              </p>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Endpoint</h4>
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  POST /functions/v1/whatsapp-button-webhook
                </code>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Request Body</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "phone": "5511999999999",
  "button_id": "btn_confirmar",
  "template_id": "uuid-do-template",
  "payload": { "order_id": "123" }
}`}
                  </pre>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Response</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "success": true,
  "action_executed": "send_template",
  "new_state": "awaiting_payment",
  "next_template": {
    "id": "uuid",
    "name": "pagamento_pendente",
    "message_content": "..."
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-400">Integração com Backend</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure seu backend WhatsApp para enviar os cliques de botão 
                      para este webhook. O sistema processará automaticamente e retornará 
                      o próximo template a ser enviado.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testing */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-green-500" />
                Modo de Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                O Modo de Teste permite simular fluxos completos sem enviar mensagens reais.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">🎮 Funcionalidades</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Selecionar template para simular</li>
                    <li>• Preencher variáveis dinamicamente</li>
                    <li>• Clicar em botões interativos</li>
                    <li>• Ver ações executadas</li>
                    <li>• Acompanhar mudanças de estado</li>
                    <li>• Visualizar timeline completa</li>
                  </ul>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">📊 Timeline</h4>
                  <p className="text-sm text-muted-foreground">
                    A timeline mostra cada passo da simulação:
                  </p>
                  <div className="mt-2 space-y-1">
                    <Badge variant="outline" className="mr-1">message_sent</Badge>
                    <Badge variant="outline" className="mr-1">button_click</Badge>
                    <Badge variant="outline" className="mr-1">action_executed</Badge>
                    <Badge variant="outline">state_change</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples */}
        <TabsContent value="examples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-indigo-500" />
                Exemplos de Implementação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Use o "Fluxo de Exemplo" para criar um fluxo completo de pedidos automaticamente.
              </p>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Fluxo de Pedido Completo</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge>Menu Inicial</Badge>
                  <span>→</span>
                  <Badge>Pedido Recebido</Badge>
                  <span>→</span>
                  <Badge>Pagamento Pendente</Badge>
                  <span>→</span>
                  <Badge>Pagamento Confirmado</Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Exemplo de Integração Node.js</h4>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`// Receber callback de botão do WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  const { from, button_id, context } = req.body;
  
  // Enviar para o Genesis
  const response = await fetch(
    'https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-button-webhook',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: from,
        button_id: button_id,
        template_id: context.template_id
      })
    }
  );
  
  const result = await response.json();
  
  // Se tiver próximo template, enviar
  if (result.next_template) {
    await sendWhatsAppMessage(from, result.next_template);
  }
  
  res.json({ success: true });
});`}
                </pre>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-semibold text-blue-400 mb-2">💡 Dicas</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Sempre teste seus fluxos no Modo de Teste antes de ativar</li>
                  <li>• Use nomes descritivos para botões (btn_confirmar, btn_cancelar)</li>
                  <li>• Mantenha o contexto atualizado para variáveis dinâmicas</li>
                  <li>• Configure uma ação padrão para botões não mapeados</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InteractiveTemplatesDocs;
