import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plug,
  Calendar,
  Users,
  Megaphone,
  Bell,
  Globe,
  Database,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming_soon';
  category: 'crm' | 'scheduling' | 'marketing' | 'notifications' | 'external';
}

const integrations: Integration[] = [
  {
    id: 'crm',
    name: 'CRM Genesis',
    description: 'Envie mensagens automaticamente quando leads mudarem de estágio no funil',
    icon: <Users className="w-6 h-6" />,
    status: 'available',
    category: 'crm',
  },
  {
    id: 'agendamentos',
    name: 'Sistema de Agendamentos',
    description: 'Notifique clientes sobre confirmações, lembretes e cancelamentos',
    icon: <Calendar className="w-6 h-6" />,
    status: 'available',
    category: 'scheduling',
  },
  {
    id: 'campanhas',
    name: 'Campanhas de Marketing',
    description: 'Dispare campanhas em massa com templates personalizados',
    icon: <Megaphone className="w-6 h-6" />,
    status: 'available',
    category: 'marketing',
  },
  {
    id: 'fila',
    name: 'Fila de Espera',
    description: 'Notifique clientes quando chegar a vez deles na fila',
    icon: <Bell className="w-6 h-6" />,
    status: 'available',
    category: 'notifications',
  },
  {
    id: 'api',
    name: 'API Externa',
    description: 'Conecte com qualquer sistema externo via REST API',
    icon: <Globe className="w-6 h-6" />,
    status: 'available',
    category: 'external',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Integre com mais de 5000 apps via Zapier',
    icon: <Zap className="w-6 h-6" />,
    status: 'coming_soon',
    category: 'external',
  },
  {
    id: 'n8n',
    name: 'N8N',
    description: 'Automações avançadas com N8N self-hosted',
    icon: <Database className="w-6 h-6" />,
    status: 'coming_soon',
    category: 'external',
  },
];

const categories = [
  { id: 'crm', label: 'CRM', icon: Users },
  { id: 'scheduling', label: 'Agendamentos', icon: Calendar },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'notifications', label: 'Notificações', icon: Bell },
  { id: 'external', label: 'Externos', icon: Globe },
];

export const WAIntegrations = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="w-5 h-5" />
            Integrações
          </CardTitle>
          <CardDescription>
            Conecte o WhatsApp Automação com outros sistemas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {categories.map((category) => {
              const categoryIntegrations = integrations.filter(i => i.category === category.id);
              if (categoryIntegrations.length === 0) return null;
              
              const CategoryIcon = category.icon;
              
              return (
                <div key={category.id} className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2 text-muted-foreground">
                    <CategoryIcon className="w-4 h-4" />
                    {category.label}
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryIntegrations.map((integration) => (
                      <Card key={integration.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {integration.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-sm">{integration.name}</h4>
                                {integration.status === 'coming_soon' && (
                                  <Badge variant="secondary" className="text-xs">
                                    Em breve
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {integration.description}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            {integration.status === 'available' ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                                disabled
                              >
                                <Plug className="w-4 h-4 mr-2" />
                                Integrar
                                <ArrowRight className="w-4 h-4 ml-auto" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="w-full" disabled>
                                Em desenvolvimento
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentação da API</CardTitle>
          <CardDescription>
            Use nossa API REST para integrar com qualquer sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Base URL</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                /api/whatsapp/v1
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Autenticação</span>
              <code className="text-xs bg-background px-2 py-1 rounded">
                Bearer Token
              </code>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Endpoints Disponíveis</h4>
            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <code className="text-xs">POST /send</code>
                <span className="text-xs text-muted-foreground">Enviar mensagem</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <code className="text-xs">GET /status/:instanceId</code>
                <span className="text-xs text-muted-foreground">Status da instância</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <code className="text-xs">POST /qrcode/:instanceId</code>
                <span className="text-xs text-muted-foreground">Gerar QR Code</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <code className="text-xs">GET /contacts</code>
                <span className="text-xs text-muted-foreground">Listar contatos</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted">
                <code className="text-xs">GET /groups</code>
                <span className="text-xs text-muted-foreground">Listar grupos</span>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" disabled>
            <ExternalLink className="w-4 h-4 mr-2" />
            Ver Documentação Completa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
