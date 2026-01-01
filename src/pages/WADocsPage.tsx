import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  ArrowRight,
  Phone,
  Image,
  ListOrdered,
  MousePointer,
  Users,
  RefreshCw,
  Activity,
  FileJson,
  Settings,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Wifi,
  Bot,
  Send,
  FileText,
  Menu,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function WADocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('quickstart');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success('Código copiado!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id, language = 'javascript', title }: { code: string; id: string; language?: string; title?: string }) => (
    <div className="relative group rounded-lg overflow-hidden border border-border/50 bg-zinc-950">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-border/30">
          <span className="text-xs font-medium text-zinc-400">{title}</span>
          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">{language}</Badge>
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-sm font-mono text-zinc-100">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800/50 hover:bg-zinc-700"
        onClick={() => copyCode(code, id)}
      >
        {copiedCode === id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
      </Button>
    </div>
  );

  const EndpointCard = ({ method, path, description, children, badge }: { 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'; 
    path: string; 
    description: string; 
    children?: React.ReactNode;
    badge?: string;
  }) => {
    const methodColors = {
      GET: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
      POST: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      PUT: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      DELETE: 'bg-red-500/10 text-red-500 border-red-500/30',
    };

    return (
      <div className="border border-border/50 rounded-lg overflow-hidden bg-card/50 hover:bg-card/80 transition-colors">
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={methodColors[method]}>{method}</Badge>
            <code className="font-mono text-sm text-foreground">{path}</code>
            {badge && <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">{badge}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{description}</p>
        </div>
        {children && <div className="p-4 bg-muted/10">{children}</div>}
      </div>
    );
  };

  const SidebarItem = ({ id, icon: Icon, label, isActive, onClick }: {
    id: string;
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        isActive 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );

  const sections = [
    { id: 'quickstart', icon: Rocket, label: 'Quick Start' },
    { id: 'auth', icon: Lock, label: 'Autenticação' },
    { id: 'instances', icon: Smartphone, label: 'Instâncias' },
    { id: 'messages', icon: MessageSquare, label: 'Mensagens' },
    { id: 'media', icon: Image, label: 'Mídia' },
    { id: 'interactive', icon: MousePointer, label: 'Interativos' },
    { id: 'webhooks', icon: Webhook, label: 'Webhooks' },
    { id: 'heartbeat', icon: Activity, label: 'Heartbeat' },
    { id: 'automations', icon: Bot, label: 'Automações' },
    { id: 'backend', icon: Terminal, label: 'Backend Local' },
    { id: 'errors', icon: AlertTriangle, label: 'Erros' },
    { id: 'sdks', icon: Code2, label: 'SDKs & Libs' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <motion.section 
        className="relative py-16 px-4 overflow-hidden border-b border-border/30"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <div>
              <Badge className="mb-1 bg-primary/10 text-primary border-primary/20">v4.0</Badge>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                WhatsApp Automation API
              </h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Documentação completa para integrar e automatizar seu WhatsApp Business. 
            Envie mensagens, mídia, botões interativos e muito mais.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { icon: Zap, label: 'Latência', value: '< 100ms', color: 'text-yellow-500' },
              { icon: Shield, label: 'Uptime', value: '99.9%', color: 'text-emerald-500' },
              { icon: MessageSquare, label: 'Msg/min', value: '1000+', color: 'text-blue-500' },
              { icon: Server, label: 'Endpoints', value: '20+', color: 'text-purple-500' },
              { icon: Users, label: 'Instâncias', value: 'Ilimitadas', color: 'text-orange-500' },
              { icon: Webhook, label: 'Webhooks', value: 'Real-time', color: 'text-pink-500' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.05 }}
                className="bg-card/50 backdrop-blur border border-border/50 rounded-xl p-3"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Documentação
              </p>
              {sections.map(section => (
                <SidebarItem
                  key={section.id}
                  {...section}
                  isActive={activeSection === section.id}
                  onClick={() => setActiveSection(section.id)}
                />
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="space-y-8">
              
              {/* Quick Start */}
              {activeSection === 'quickstart' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Rocket className="w-6 h-6 text-primary" />
                      Quick Start
                    </h2>
                    <p className="text-muted-foreground">Configure sua integração em menos de 5 minutos</p>
                  </div>

                  <div className="grid gap-4">
                    {[
                      { step: 1, title: 'Obtenha suas credenciais', desc: 'Acesse o Painel Owner → WhatsApp Automação → Instâncias', icon: Lock },
                      { step: 2, title: 'Configure o Backend', desc: 'Escolha entre PC Local ou VPS dedicado', icon: Server },
                      { step: 3, title: 'Conecte via QR Code', desc: 'Escaneie o QR Code com seu WhatsApp', icon: Phone },
                      { step: 4, title: 'Envie sua primeira mensagem', desc: 'Use a API para enviar mensagens', icon: Send },
                    ].map((item) => (
                      <Card key={item.step} className="bg-card/50 border-border/50">
                        <CardContent className="flex items-start gap-4 p-4">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                            {item.step}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold flex items-center gap-2">
                              <item.icon className="w-4 h-4 text-muted-foreground" />
                              {item.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <CodeBlock
                    id="quickstart-example"
                    title="Exemplo: Enviar mensagem"
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
// { success: true, messageId: "BAE5F4..." }`}
                  />
                </motion.div>
              )}

              {/* Authentication */}
              {activeSection === 'auth' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Lock className="w-6 h-6 text-primary" />
                      Autenticação
                    </h2>
                    <p className="text-muted-foreground">Todas as requisições devem incluir autenticação via Bearer Token</p>
                  </div>

                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Tipos de Token</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                          <Badge className="mb-2 bg-blue-500/10 text-blue-500">instance_token</Badge>
                          <p className="text-sm text-muted-foreground">Token único por instância. Gerado automaticamente ao criar a instância.</p>
                        </div>
                        <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
                          <Badge className="mb-2 bg-purple-500/10 text-purple-500">backend_token</Badge>
                          <p className="text-sm text-muted-foreground">Token global do backend. Usado para operações administrativas.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <CodeBlock
                    id="auth-header"
                    title="Header de Autenticação"
                    code={`// Todas as requisições devem incluir:
{
  "Authorization": "Bearer {instance_token}",
  "Content-Type": "application/json"
}

// Ou usar o header específico:
{
  "X-Instance-Token": "{instance_token}",
  "Content-Type": "application/json"
}`}
                  />
                </motion.div>
              )}

              {/* Instances */}
              {activeSection === 'instances' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Phone className="w-6 h-6 text-primary" />
                      Gerenciamento de Instâncias
                    </h2>
                    <p className="text-muted-foreground">Endpoints para gerenciar conexões WhatsApp</p>
                  </div>

                  <div className="space-y-4">
                    <EndpointCard method="GET" path="/health" description="Verifica se o backend está funcionando">
                      <CodeBlock id="health" code={`// Response
{ "status": "ok", "version": "4.0.0", "name": "Genesis WhatsApp Backend" }`} />
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/instance/:instanceId/qrcode" description="Gera QR Code para conexão">
                      <CodeBlock id="qrcode" code={`// Request
{ "phoneHint": "5511999999999" }  // opcional

// Response
{ "success": true, "qrCode": "data:image/png;base64,..." }`} />
                    </EndpointCard>

                    <EndpointCard method="GET" path="/api/instance/:instanceId/status" description="Verifica status da conexão">
                      <CodeBlock id="status" code={`// Response
{ "connected": true, "phoneNumber": "5511999999999", "name": "Minha Empresa" }`} />
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/instance/:instanceId/disconnect" description="Desconecta a instância">
                      <CodeBlock id="disconnect" code={`// Response
{ "success": true, "message": "Disconnected" }`} />
                    </EndpointCard>
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {activeSection === 'messages' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <MessageSquare className="w-6 h-6 text-primary" />
                      Envio de Mensagens
                    </h2>
                    <p className="text-muted-foreground">Endpoints para enviar mensagens de texto</p>
                  </div>

                  <div className="space-y-4">
                    <EndpointCard method="POST" path="/api/instance/:instanceId/send" description="Envia uma mensagem de texto" badge="Mais usado">
                      <CodeBlock id="send-text" code={`// Request
{
  "phone": "5511999999999",  // Número com DDI (sem +)
  "message": "Olá! Como posso ajudar?"
}

// Response
{
  "success": true,
  "messageId": "BAE5F4A8B3C2D1E0"
}`} />
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/instance/:instanceId/send-bulk" description="Envia mensagens em lote">
                      <CodeBlock id="send-bulk" code={`// Request
{
  "messages": [
    { "phone": "5511999999999", "message": "Olá João!" },
    { "phone": "5511888888888", "message": "Olá Maria!" }
  ],
  "delay": 2000  // delay entre mensagens (ms)
}

// Response
{
  "success": true,
  "sent": 2,
  "failed": 0
}`} />
                    </EndpointCard>
                  </div>
                </motion.div>
              )}

              {/* Media */}
              {activeSection === 'media' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Image className="w-6 h-6 text-primary" />
                      Envio de Mídia
                    </h2>
                    <p className="text-muted-foreground">Envie imagens, vídeos, áudios e documentos</p>
                  </div>

                  <div className="space-y-4">
                    <EndpointCard method="POST" path="/api/instance/:instanceId/send-media" description="Envia arquivo de mídia">
                      <CodeBlock id="send-media" code={`// Request
{
  "phone": "5511999999999",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "image",  // image | video | audio | document
  "caption": "Confira nossa promoção!",  // opcional
  "filename": "promo.jpg"  // para documentos
}

// Response
{ "success": true, "messageId": "BAE5F4..." }`} />
                    </EndpointCard>

                    <Card className="bg-muted/30 border-border/50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          Tipos de mídia suportados
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="p-2 bg-background rounded border border-border/50">
                            <span className="font-mono text-xs text-primary">image</span>
                            <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP</p>
                          </div>
                          <div className="p-2 bg-background rounded border border-border/50">
                            <span className="font-mono text-xs text-primary">video</span>
                            <p className="text-xs text-muted-foreground">MP4, 3GP, MOV</p>
                          </div>
                          <div className="p-2 bg-background rounded border border-border/50">
                            <span className="font-mono text-xs text-primary">audio</span>
                            <p className="text-xs text-muted-foreground">MP3, OGG, AAC</p>
                          </div>
                          <div className="p-2 bg-background rounded border border-border/50">
                            <span className="font-mono text-xs text-primary">document</span>
                            <p className="text-xs text-muted-foreground">PDF, DOC, XLS</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* Interactive */}
              {activeSection === 'interactive' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <MousePointer className="w-6 h-6 text-primary" />
                      Mensagens Interativas
                    </h2>
                    <p className="text-muted-foreground">Botões, listas e templates interativos</p>
                  </div>

                  <div className="space-y-4">
                    <EndpointCard method="POST" path="/api/instance/:instanceId/send-buttons" description="Envia mensagem com botões">
                      <CodeBlock id="send-buttons" code={`// Request
{
  "phone": "5511999999999",
  "title": "Escolha uma opção",
  "message": "Como posso ajudar você hoje?",
  "footer": "Genesis Hub",
  "buttons": [
    { "id": "1", "text": "💼 Agendar" },
    { "id": "2", "text": "💰 Preços" },
    { "id": "3", "text": "📞 Falar com atendente" }
  ]
}`} />
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/instance/:instanceId/send-list" description="Envia lista de seleção">
                      <CodeBlock id="send-list" code={`// Request
{
  "phone": "5511999999999",
  "title": "Menu de Serviços",
  "message": "Selecione o serviço desejado:",
  "buttonText": "Ver opções",
  "sections": [
    {
      "title": "Cortes",
      "rows": [
        { "id": "corte1", "title": "Corte Simples", "description": "R$ 35,00" },
        { "id": "corte2", "title": "Corte + Barba", "description": "R$ 55,00" }
      ]
    },
    {
      "title": "Tratamentos",
      "rows": [
        { "id": "trat1", "title": "Hidratação", "description": "R$ 45,00" }
      ]
    }
  ]
}`} />
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/instance/:instanceId/send-location" description="Envia localização">
                      <CodeBlock id="send-location" code={`// Request
{
  "phone": "5511999999999",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "name": "Genesis Hub",
  "address": "Av. Paulista, 1000 - São Paulo"
}`} />
                    </EndpointCard>

                    <EndpointCard method="POST" path="/api/instance/:instanceId/send-contact" description="Envia contato">
                      <CodeBlock id="send-contact" code={`// Request
{
  "phone": "5511999999999",
  "contact": {
    "name": "Suporte Genesis",
    "phone": "5511999888777",
    "email": "suporte@genesis.com"
  }
}`} />
                    </EndpointCard>
                  </div>
                </motion.div>
              )}

              {/* Webhooks */}
              {activeSection === 'webhooks' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Webhook className="w-6 h-6 text-primary" />
                      Webhooks
                    </h2>
                    <p className="text-muted-foreground">Receba notificações em tempo real</p>
                  </div>

                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Eventos Disponíveis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {[
                          { event: 'message.received', desc: 'Nova mensagem recebida' },
                          { event: 'message.sent', desc: 'Mensagem enviada com sucesso' },
                          { event: 'message.ack', desc: 'Status de leitura atualizado' },
                          { event: 'connection.update', desc: 'Status da conexão alterado' },
                          { event: 'qr.updated', desc: 'Novo QR Code gerado' },
                        ].map(item => (
                          <div key={item.event} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <Badge variant="outline" className="font-mono text-xs">{item.event}</Badge>
                            <span className="text-sm text-muted-foreground">{item.desc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <CodeBlock
                    id="webhook-payload"
                    title="Payload do Webhook"
                    code={`// Exemplo: message.received
{
  "event": "message.received",
  "instanceId": "uuid-da-instancia",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "messageId": "BAE5F4A8B3C2D1E0",
    "from": "5511999999999",
    "fromName": "João Silva",
    "type": "text",
    "body": "Olá, gostaria de agendar um horário",
    "isGroup": false
  }
}`}
                  />
                </motion.div>
              )}

              {/* Heartbeat */}
              {activeSection === 'heartbeat' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Activity className="w-6 h-6 text-primary" />
                      Sistema de Heartbeat
                    </h2>
                    <p className="text-muted-foreground">Monitoramento contínuo de conectividade</p>
                  </div>

                  <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-emerald-500/20">
                          <Wifi className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">O que é o Heartbeat?</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            O backend local envia sinais a cada 30 segundos para a Cloud, confirmando que está ativo.
                            Se o sinal cessar por mais de 2 minutos, a instância é marcada como desconectada automaticamente.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <EndpointCard method="POST" path="/functions/v1/whatsapp-heartbeat/:instanceId" description="Envia heartbeat">
                      <CodeBlock id="heartbeat-post" code={`// Headers
{ "X-Instance-Token": "{instance_token}" }

// Request
{
  "status": "connected",
  "phone_number": "5511999999999",
  "uptime_seconds": 3600
}

// Response
{ "success": true, "timestamp": "2024-01-15T10:30:00Z" }`} />
                    </EndpointCard>

                    <EndpointCard method="GET" path="/functions/v1/whatsapp-heartbeat/status/:instanceId" description="Consulta status">
                      <CodeBlock id="heartbeat-status" code={`// Response
{
  "id": "uuid",
  "name": "Principal",
  "status": "connected",
  "phone_number": "5511999999999",
  "last_heartbeat_at": "2024-01-15T10:30:00Z",
  "is_stale": false,
  "effective_status": "connected"
}`} />
                    </EndpointCard>
                  </div>
                </motion.div>
              )}

              {/* Automations */}
              {activeSection === 'automations' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Bot className="w-6 h-6 text-primary" />
                      Automações
                    </h2>
                    <p className="text-muted-foreground">Chatbots e respostas automáticas</p>
                  </div>

                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">Recursos de Automação</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      {[
                        { icon: MessageSquare, title: 'Auto-resposta', desc: 'Resposta automática para todas as mensagens' },
                        { icon: Clock, title: 'Horário comercial', desc: 'Diferentes respostas por horário' },
                        { icon: Bot, title: 'Chatbot por palavras-chave', desc: 'Fluxos baseados em gatilhos' },
                        { icon: Users, title: 'Atendimento humano', desc: 'Transferência para operador' },
                      ].map(item => (
                        <div key={item.title} className="p-4 rounded-lg border border-border/50 bg-muted/20">
                          <item.icon className="w-5 h-5 text-primary mb-2" />
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <CodeBlock
                    id="automation-config"
                    title="Configurar automação via API"
                    code={`// POST /api/instance/:instanceId/automation
{
  "type": "keyword",
  "trigger": "preço",
  "response": "Nossos preços começam em R$ 35,00. Quer ver o catálogo completo?",
  "buttons": [
    { "id": "ver", "text": "Ver catálogo" },
    { "id": "falar", "text": "Falar com atendente" }
  ]
}`}
                  />
                </motion.div>
              )}

              {/* Backend Local */}
              {activeSection === 'backend' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Terminal className="w-6 h-6 text-primary" />
                      Backend Local (PC)
                    </h2>
                    <p className="text-muted-foreground">Execute o backend no seu computador</p>
                  </div>

                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle>Requisitos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Node.js 18+</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> NPM ou Yarn</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Porta 3001 disponível</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Conexão estável com internet</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <CodeBlock
                    id="backend-install"
                    title="Instalação"
                    language="bash"
                    code={`# 1. Baixe o script do painel Owner
# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env

# 4. Execute o backend
node whatsapp-local.js

# O backend estará disponível em http://localhost:3001`}
                  />

                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-600 dark:text-amber-400">Importante</h4>
                        <p className="text-sm text-muted-foreground">
                          O backend local precisa estar rodando para manter a conexão. 
                          Se o processo for encerrado, a conexão será perdida.
                          Para produção, recomendamos usar um VPS.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Errors */}
              {activeSection === 'errors' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                      Códigos de Erro
                    </h2>
                    <p className="text-muted-foreground">Referência de erros e soluções</p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { code: 400, title: 'Bad Request', desc: 'Parâmetros inválidos na requisição', solution: 'Verifique o formato do JSON e campos obrigatórios' },
                      { code: 401, title: 'Unauthorized', desc: 'Token inválido ou ausente', solution: 'Verifique o header Authorization' },
                      { code: 404, title: 'Not Found', desc: 'Instância ou recurso não encontrado', solution: 'Verifique o instanceId e endpoint' },
                      { code: 429, title: 'Rate Limited', desc: 'Limite de requisições excedido', solution: 'Aguarde alguns segundos e tente novamente' },
                      { code: 500, title: 'Internal Error', desc: 'Erro interno do servidor', solution: 'Verifique os logs do backend' },
                      { code: 503, title: 'Service Unavailable', desc: 'Backend offline', solution: 'Verifique se o backend está rodando' },
                    ].map(err => (
                      <Card key={err.code} className="bg-card/50 border-border/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Badge variant="outline" className={`font-mono ${err.code >= 500 ? 'text-red-500 border-red-500/30' : err.code >= 400 ? 'text-amber-500 border-amber-500/30' : 'text-blue-500 border-blue-500/30'}`}>
                              {err.code}
                            </Badge>
                            <div className="flex-1">
                              <h4 className="font-medium">{err.title}</h4>
                              <p className="text-sm text-muted-foreground">{err.desc}</p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">💡 {err.solution}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SDKs */}
              {activeSection === 'sdks' && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible" className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                      <Code2 className="w-6 h-6 text-primary" />
                      SDKs & Bibliotecas
                    </h2>
                    <p className="text-muted-foreground">Integre facilmente com sua stack preferida</p>
                  </div>

                  <Card className="bg-blue-500/10 border-blue-500/20">
                    <CardContent className="p-6 text-center">
                      <Rocket className="w-12 h-12 mx-auto text-blue-500 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">SDKs em desenvolvimento</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Estamos desenvolvendo SDKs oficiais para JavaScript/TypeScript, Python e PHP.
                        Enquanto isso, use os endpoints REST diretamente.
                      </p>
                    </CardContent>
                  </Card>

                  <CodeBlock
                    id="sdk-js"
                    title="Exemplo com JavaScript/TypeScript"
                    code={`// genesis-whatsapp-sdk (em breve)
import { GenesisWhatsApp } from '@genesis/whatsapp-sdk';

const client = new GenesisWhatsApp({
  instanceId: 'seu-instance-id',
  token: 'seu-token'
});

// Enviar mensagem
await client.sendText('5511999999999', 'Olá!');

// Enviar imagem
await client.sendImage('5511999999999', 'https://...', 'Legenda');

// Enviar botões
await client.sendButtons('5511999999999', {
  title: 'Escolha',
  buttons: [{ id: '1', text: 'Opção 1' }]
});`}
                  />
                </motion.div>
              )}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
