import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code2,
  Server,
  Webhook,
  Shield,
  Zap,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Terminal,
  Database,
  Lock,
  Globe,
  BookOpen,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function WADocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'javascript' }: { code: string; id: string; language?: string }) => (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyCode(code, id)}
      >
        {copiedCode === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <motion.section 
        className="relative py-20 px-4 overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Zap className="w-3 h-3 mr-1" />
              API Documentation v3.0
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
              WhatsApp Automation API
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Documentação completa para integrar e automatizar seu WhatsApp Business com a API Genesis Hub
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: 'Latência', value: '< 100ms' },
              { icon: Shield, label: 'Uptime', value: '99.9%' },
              { icon: MessageSquare, label: 'Mensagens/min', value: '1000+' },
              { icon: Globe, label: 'Endpoints', value: '15+' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur border-primary/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <stat.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="quickstart" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50">
              <TabsTrigger value="quickstart" className="gap-2">
                <Zap className="w-4 h-4" />
                Quick Start
              </TabsTrigger>
              <TabsTrigger value="endpoints" className="gap-2">
                <Server className="w-4 h-4" />
                Endpoints
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-2">
                <Webhook className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
              <TabsTrigger value="backend" className="gap-2">
                <Terminal className="w-4 h-4" />
                Backend Local
              </TabsTrigger>
              <TabsTrigger value="architecture" className="gap-2">
                <Layers className="w-4 h-4" />
                Arquitetura
              </TabsTrigger>
            </TabsList>

            {/* Quick Start */}
            <TabsContent value="quickstart" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Início Rápido
                  </CardTitle>
                  <CardDescription>
                    Configure sua integração em menos de 5 minutos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                      <h3 className="font-semibold">Obtenha suas credenciais</h3>
                    </div>
                    <p className="text-muted-foreground ml-11">
                      Acesse o Painel Owner → WhatsApp Automação → Instâncias para obter seu <code className="bg-muted px-1 rounded">instance_id</code> e <code className="bg-muted px-1 rounded">instance_token</code>.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                      <h3 className="font-semibold">Configure o Backend</h3>
                    </div>
                    <p className="text-muted-foreground ml-11">
                      Escolha entre <strong>PC Local</strong> (seu computador) ou <strong>VPS</strong> (servidor dedicado).
                    </p>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                      <h3 className="font-semibold">Conecte via QR Code</h3>
                    </div>
                    <p className="text-muted-foreground ml-11">
                      Escaneie o QR Code com seu WhatsApp para vincular a instância.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">4</div>
                      <h3 className="font-semibold">Envie sua primeira mensagem</h3>
                    </div>
                    <CodeBlock 
                      id="quickstart-send"
                      code={`// Enviar mensagem via API
const response = await fetch('http://localhost:3001/api/instance/{instanceId}/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {seu_token}'
  },
  body: JSON.stringify({
    phone: '5511999999999',
    message: 'Olá! Esta é uma mensagem de teste.'
  })
});

const result = await response.json();
console.log(result); // { success: true }`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Autenticação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    Todas as requisições devem incluir o header <code className="bg-muted px-1 rounded">Authorization</code> com o token da instância.
                  </p>
                  <CodeBlock
                    id="auth-header"
                    code={`// Header de autenticação
{
  "Authorization": "Bearer {instance_token}",
  "Content-Type": "application/json"
}`}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Endpoints */}
            <TabsContent value="endpoints" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>Base URL: <code className="bg-muted px-2 py-1 rounded">http://localhost:3001</code> (Local) ou seu domínio VPS</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {/* Health Check */}
                      <div className="border-l-4 border-green-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">GET</Badge>
                          <code className="font-mono text-sm">/health</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Verifica se o backend está funcionando</p>
                        <CodeBlock
                          id="health"
                          code={`// Response
{
  "status": "ok",
  "version": "3.0.0",
  "name": "Genesis WhatsApp Backend"
}`}
                        />
                      </div>

                      {/* Send Message */}
                      <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">POST</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/send</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Envia uma mensagem de texto</p>
                        <CodeBlock
                          id="send"
                          code={`// Request Body
{
  "phone": "5511999999999",  // Número com DDI
  "message": "Sua mensagem aqui"
}

// Response
{
  "success": true,
  "messageId": "BAE5F4..."
}`}
                        />
                      </div>

                      {/* QR Code */}
                      <div className="border-l-4 border-purple-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">POST</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/qrcode</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Gera QR Code para conexão</p>
                        <CodeBlock
                          id="qrcode"
                          code={`// Request Body (opcional)
{
  "phoneHint": "5511999999999"  // Número para facilitar conexão
}

// Response
{
  "success": true,
  "qrCode": "data:image/png;base64,..."
}`}
                        />
                      </div>

                      {/* Status */}
                      <div className="border-l-4 border-green-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">GET</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/status</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Verifica status da conexão</p>
                        <CodeBlock
                          id="status"
                          code={`// Response
{
  "connected": true,
  "phoneNumber": "5511999999999",
  "name": "Minha Empresa"
}`}
                        />
                      </div>

                      {/* Disconnect */}
                      <div className="border-l-4 border-red-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">POST</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/disconnect</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Desconecta a instância</p>
                        <CodeBlock
                          id="disconnect"
                          code={`// Response
{
  "success": true,
  "message": "Disconnected"
}`}
                        />
                      </div>

                      {/* Send Media */}
                      <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">POST</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/send-media</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Envia imagem, vídeo, áudio ou documento</p>
                        <CodeBlock
                          id="send-media"
                          code={`// Request Body
{
  "phone": "5511999999999",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "image",  // image, video, audio, document
  "caption": "Legenda opcional"
}

// Response
{
  "success": true,
  "messageId": "BAE5F4..."
}`}
                        />
                      </div>

                      {/* Send Buttons */}
                      <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">POST</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/send-buttons</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Envia mensagem com botões interativos</p>
                        <CodeBlock
                          id="send-buttons"
                          code={`// Request Body
{
  "phone": "5511999999999",
  "title": "Título da mensagem",
  "message": "Escolha uma opção:",
  "footer": "Rodapé opcional",
  "buttons": [
    { "id": "1", "text": "Opção 1" },
    { "id": "2", "text": "Opção 2" },
    { "id": "3", "text": "Opção 3" }
  ]
}`}
                        />
                      </div>

                      {/* Send List */}
                      <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">POST</Badge>
                          <code className="font-mono text-sm">/api/instance/:instanceId/send-list</code>
                        </div>
                        <p className="text-sm text-muted-foreground">Envia lista de seleção</p>
                        <CodeBlock
                          id="send-list"
                          code={`// Request Body
{
  "phone": "5511999999999",
  "title": "Menu de Opções",
  "message": "Selecione um item:",
  "buttonText": "Ver opções",
  "sections": [
    {
      "title": "Categoria 1",
      "rows": [
        { "id": "item1", "title": "Item 1", "description": "Descrição" },
        { "id": "item2", "title": "Item 2", "description": "Descrição" }
      ]
    }
  ]
}`}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Webhooks */}
            <TabsContent value="webhooks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="w-5 h-5 text-primary" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receba notificações em tempo real sobre eventos do WhatsApp
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Eventos Disponíveis</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        { event: 'message.received', desc: 'Nova mensagem recebida' },
                        { event: 'message.sent', desc: 'Mensagem enviada com sucesso' },
                        { event: 'message.delivered', desc: 'Mensagem entregue' },
                        { event: 'message.read', desc: 'Mensagem lida' },
                        { event: 'connection.update', desc: 'Status de conexão alterado' },
                        { event: 'qr.update', desc: 'Novo QR Code gerado' },
                      ].map(item => (
                        <div key={item.event} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Badge variant="outline">{item.event}</Badge>
                          <span className="text-sm text-muted-foreground">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Payload de Exemplo</h3>
                    <CodeBlock
                      id="webhook-payload"
                      code={`// POST para sua URL de webhook
{
  "event": "message.received",
  "instanceId": "abc123...",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "from": "5511999999999",
    "message": "Olá!",
    "messageId": "BAE5F4...",
    "type": "text",
    "pushName": "João",
    "isGroup": false
  }
}`}
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold">Configuração via API</h3>
                    <CodeBlock
                      id="webhook-config"
                      code={`// Registrar webhook
POST /api/webhooks
{
  "url": "https://seu-dominio.com/webhook",
  "events": ["message.received", "message.sent"],
  "secret": "seu_secret_para_validar" // opcional
}

// Headers enviados com cada webhook
{
  "X-Webhook-Signature": "sha256=...",  // HMAC do payload
  "X-Webhook-Event": "message.received"
}`}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Backend Local */}
            <TabsContent value="backend" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-primary" />
                    Configuração do Backend Local
                  </CardTitle>
                  <CardDescription>
                    Execute o backend no seu próprio computador
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Requisitos</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Node.js 18+ instalado</li>
                      <li>Conexão estável com internet</li>
                      <li>PC/servidor ligado 24/7 (recomendado)</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Instalação</h3>
                    <CodeBlock
                      id="install"
                      code={`# 1. Baixe o script do Painel Owner → Backend (PC Local)

# 2. Instale as dependências
npm install

# 3. Execute o backend
node whatsapp-local.js

# O servidor iniciará na porta 3001 por padrão`}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Sistema de Heartbeat</h3>
                    <p className="text-muted-foreground">
                      O backend envia heartbeats automáticos a cada 30 segundos para manter o status atualizado no painel, 
                      mesmo quando você não está visualizando.
                    </p>
                    <CodeBlock
                      id="heartbeat"
                      code={`// O backend envia automaticamente:
POST /whatsapp-heartbeat/{instanceId}
Headers: {
  "X-Instance-Token": "seu_token"
}
Body: {
  "status": "connected",
  "phone_number": "5511999999999",
  "uptime_seconds": 3600
}`}
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <h4 className="font-semibold text-yellow-600 mb-2">⚠️ Importante</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• O backend precisa estar rodando para enviar/receber mensagens</li>
                      <li>• Se o PC desligar ou o CMD fechar, a conexão será perdida</li>
                      <li>• O painel detectará a desconexão em até 2 minutos (timeout do heartbeat)</li>
                      <li>• Para produção 24/7, considere usar um VPS</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Architecture */}
            <TabsContent value="architecture" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Arquitetura do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 rounded-lg bg-muted/30">
                    <pre className="text-sm font-mono overflow-x-auto">
{`
┌─────────────────────────────────────────────────────────────────┐
│                      GENESIS HUB - WHATSAPP AUTOMATION           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Owner Panel  │  │  Dashboard   │  │  WAInstances │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│    SUPABASE (Cloud DB)   │    │   LOCAL/VPS BACKEND      │
│  ┌────────────────────┐  │    │  ┌────────────────────┐  │
│  │ whatsapp_instances │  │◄───┤  │ Baileys (WhatsApp) │  │
│  │ whatsapp_messages  │  │    │  │     Web Multi-     │  │
│  │ whatsapp_metrics   │  │    │  │       Device       │  │
│  │ whatsapp_health    │  │    │  └────────────────────┘  │
│  └────────────────────┘  │    │           │              │
│                          │    │           ▼              │
│  ┌────────────────────┐  │    │  ┌────────────────────┐  │
│  │  Edge Functions:   │  │    │  │   REST API:        │  │
│  │  - heartbeat       │◄─┼────┤  │   - /send          │  │
│  │  - whatsapp-api    │  │    │  │   - /qrcode        │  │
│  └────────────────────┘  │    │  │   - /status        │  │
└──────────────────────────┘    │  └────────────────────┘  │
                                └──────────────────────────┘
                                           │
                                           ▼
                                ┌──────────────────────┐
                                │   WHATSAPP SERVERS   │
                                │   (Meta/Facebook)    │
                                └──────────────────────┘
`}
                    </pre>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Banco de Dados (Supabase)
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>whatsapp_instances</strong>: Instâncias e status</li>
                        <li>• <strong>whatsapp_message_logs</strong>: Histórico de mensagens</li>
                        <li>• <strong>whatsapp_metrics</strong>: Métricas de uso</li>
                        <li>• <strong>whatsapp_health_checks</strong>: Heartbeats</li>
                        <li>• <strong>whatsapp_automations</strong>: Regras de chatbot</li>
                        <li>• <strong>whatsapp_contacts</strong>: Lista de contatos</li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Cpu className="w-4 h-4" />
                        Backend (Baileys)
                      </h3>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Biblioteca open-source para WhatsApp Web</li>
                        <li>• Suporta Multi-Device (MD)</li>
                        <li>• Reconexão automática em caso de erro</li>
                        <li>• Heartbeat a cada 30s para Supabase</li>
                        <li>• API REST para integração</li>
                        <li>• Logs detalhados no console</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Rate Limits e Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-primary">60</p>
                      <p className="text-sm text-muted-foreground">msgs/minuto</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-primary">1000</p>
                      <p className="text-sm text-muted-foreground">msgs/hora</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-3xl font-bold text-primary">10000</p>
                      <p className="text-sm text-muted-foreground">msgs/dia</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Limites configuráveis via painel. Recomendamos respeitar os limites do WhatsApp para evitar banimentos.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t bg-muted/30">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Genesis Hub. WhatsApp Automation API Documentation.
          </p>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Voltar ao Site
            </a>
            <a href="/owner" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Painel Owner
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
