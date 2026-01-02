import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Key, 
  Plus, 
  Copy, 
  Eye, 
  EyeOff, 
  Trash2, 
  Settings2,
  Activity,
  Zap,
  Webhook,
  BarChart3,
  Shield,
  Clock,
  Check,
  X,
  RefreshCw,
  Link2,
  Unlink,
  FileText,
  AlertTriangle,
  Server,
  ExternalLink,
  Bot
} from 'lucide-react';
import WAWebhooksManager from './whatsapp/WAWebhooksManager';
import WAAutomationsManager from './whatsapp/WAAutomationsManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface APIProject {
  id: string;
  name: string;
  description: string | null;
  api_key: string;
  api_secret: string;
  rate_limit_per_minute: number;
  rate_limit_per_hour: number;
  rate_limit_per_day: number;
  max_instances: number;
  is_active: boolean;
  environment: string;
  created_at: string;
  updated_at: string;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  status: string;
  phone_number: string | null;
}

interface ProjectInstance {
  id: string;
  project_id: string;
  instance_id: string;
  can_send: boolean;
  can_receive: boolean;
  can_manage: boolean;
  linked_at: string;
  instance?: WhatsAppInstance;
}

interface APILog {
  id: string;
  project_id: string | null;
  endpoint: string;
  method: string;
  request_body: Record<string, unknown> | null;
  response_status: number | null;
  response_time_ms: number | null;
  ip_address: string | null;
  created_at: string;
}

const WhatsAppAPIManager = () => {
  const [projects, setProjects] = useState<APIProject[]>([]);
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [projectInstances, setProjectInstances] = useState<ProjectInstance[]>([]);
  const [logs, setLogs] = useState<APILog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<APIProject | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rate_limit_per_minute: 60,
    rate_limit_per_hour: 1000,
    rate_limit_per_day: 10000,
    max_instances: 3,
    environment: 'production'
  });
  
  // Visibility toggles
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('whatsapp_api_projects')
        .select('*')
        .order('created_at', { ascending: false });
      
      setProjects((projectsData || []) as APIProject[]);
      
      // Fetch instances
      const { data: instancesData } = await supabase
        .from('whatsapp_instances')
        .select('id, name, status, phone_number')
        .order('name');
      
      setInstances((instancesData || []) as WhatsAppInstance[]);
      
      // Fetch project-instance links
      const { data: linksData } = await supabase
        .from('whatsapp_project_instances')
        .select('*');
      
      setProjectInstances((linksData || []) as ProjectInstance[]);
      
      // Fetch recent logs
      const { data: logsData } = await supabase
        .from('whatsapp_api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      setLogs((logsData || []) as APILog[]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');
      
      const { error } = await supabase
        .from('whatsapp_api_projects')
        .insert({
          name: formData.name,
          description: formData.description || null,
          rate_limit_per_minute: formData.rate_limit_per_minute,
          rate_limit_per_hour: formData.rate_limit_per_hour,
          rate_limit_per_day: formData.rate_limit_per_day,
          max_instances: formData.max_instances,
          environment: formData.environment,
          owner_user_id: userData.user.id
        });
      
      if (error) throw error;
      
      toast.success('Projeto criado com sucesso!');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto');
    }
  };

  const updateProject = async () => {
    if (!selectedProject) return;
    
    try {
      const { error } = await supabase
        .from('whatsapp_api_projects')
        .update({
          name: formData.name,
          description: formData.description || null,
          rate_limit_per_minute: formData.rate_limit_per_minute,
          rate_limit_per_hour: formData.rate_limit_per_hour,
          rate_limit_per_day: formData.rate_limit_per_day,
          max_instances: formData.max_instances,
          environment: formData.environment
        })
        .eq('id', selectedProject.id);
      
      if (error) throw error;
      
      toast.success('Projeto atualizado!');
      setShowEditDialog(false);
      setSelectedProject(null);
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar projeto:', error);
      toast.error('Erro ao atualizar projeto');
    }
  };

  const toggleProjectStatus = async (project: APIProject) => {
    try {
      const { error } = await supabase
        .from('whatsapp_api_projects')
        .update({ is_active: !project.is_active })
        .eq('id', project.id);
      
      if (error) throw error;
      
      toast.success(project.is_active ? 'Projeto desativado' : 'Projeto ativado');
      fetchData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const deleteProject = async (project: APIProject) => {
    if (!confirm(`Excluir projeto "${project.name}"? Esta ação não pode ser desfeita.`)) return;
    
    try {
      const { error } = await supabase
        .from('whatsapp_api_projects')
        .delete()
        .eq('id', project.id);
      
      if (error) throw error;
      
      toast.success('Projeto excluído');
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir projeto');
    }
  };

  const linkInstance = async (instanceId: string) => {
    if (!selectedProject) return;
    
    try {
      const { error } = await supabase
        .from('whatsapp_project_instances')
        .insert({
          project_id: selectedProject.id,
          instance_id: instanceId
        });
      
      if (error) throw error;
      
      toast.success('Instância vinculada!');
      fetchData();
    } catch (error) {
      console.error('Erro ao vincular:', error);
      toast.error('Erro ao vincular instância');
    }
  };

  const unlinkInstance = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_project_instances')
        .delete()
        .eq('id', linkId);
      
      if (error) throw error;
      
      toast.success('Instância desvinculada');
      fetchData();
    } catch (error) {
      console.error('Erro ao desvincular:', error);
      toast.error('Erro ao desvincular');
    }
  };

  const regenerateApiKey = async (project: APIProject) => {
    if (!confirm('Regenerar API Key? A chave atual será invalidada.')) return;
    
    try {
      // Generate new key format
      const newKey = 'wac_' + Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from('whatsapp_api_projects')
        .update({ api_key: newKey })
        .eq('id', project.id);
      
      if (error) throw error;
      
      toast.success('Nova API Key gerada!');
      fetchData();
    } catch (error) {
      console.error('Erro ao regenerar:', error);
      toast.error('Erro ao regenerar API Key');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rate_limit_per_minute: 60,
      rate_limit_per_hour: 1000,
      rate_limit_per_day: 10000,
      max_instances: 3,
      environment: 'production'
    });
  };

  const openEditDialog = (project: APIProject) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      rate_limit_per_minute: project.rate_limit_per_minute,
      rate_limit_per_hour: project.rate_limit_per_hour,
      rate_limit_per_day: project.rate_limit_per_day,
      max_instances: project.max_instances,
      environment: project.environment
    });
    setShowEditDialog(true);
  };

  const getProjectInstanceCount = (projectId: string) => {
    return projectInstances.filter(pi => pi.project_id === projectId).length;
  };

  const getLinkedInstances = (projectId: string) => {
    const links = projectInstances.filter(pi => pi.project_id === projectId);
    return links.map(link => {
      const instance = instances.find(i => i.id === link.instance_id);
      return { ...link, instance };
    });
  };

  const getUnlinkedInstances = (projectId: string) => {
    const linkedIds = projectInstances
      .filter(pi => pi.project_id === projectId)
      .map(pi => pi.instance_id);
    return instances.filter(i => !linkedIds.includes(i.id));
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      connected: { variant: 'default', label: 'Conectado' },
      disconnected: { variant: 'destructive', label: 'Desconectado' },
      qr_pending: { variant: 'secondary', label: 'QR Pendente' }
    };
    const c = config[status] || { variant: 'outline', label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Server className="w-6 h-6 text-primary" />
            WhatsApp Automation Core
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie projetos de API, integrações e automações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href="/docs/whatsapp-api" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentação
            </a>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projetos Ativos</p>
                <p className="text-2xl font-bold">{projects.filter(p => p.is_active).length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Instâncias Vinculadas</p>
                <p className="text-2xl font-bold">{projectInstances.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chamadas (24h)</p>
                <p className="text-2xl font-bold">{logs.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold">
                  {logs.length > 0 
                    ? `${Math.round((logs.filter(l => l.response_status && l.response_status < 400).length / logs.length) * 100)}%`
                    : '—'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Projetos
          </TabsTrigger>
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Instâncias
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Automações
          </TabsTrigger>
          <TabsTrigger value="api-test" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Teste API
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Server className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum projeto criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie um projeto para gerar API Keys e integrar sistemas externos.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className={!project.is_active ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {project.name}
                          <Badge variant={project.is_active ? 'default' : 'secondary'}>
                            {project.is_active ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant="outline">{project.environment}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {project.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProject(project);
                            setShowLinkDialog(true);
                          }}
                          title="Gerenciar instâncias"
                        >
                          <Link2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                          title="Editar"
                        >
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteProject(project)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Credentials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">API Key</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                            {visibleSecrets[`key-${project.id}`] 
                              ? project.api_key 
                              : '•'.repeat(32)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setVisibleSecrets(prev => ({
                              ...prev,
                              [`key-${project.id}`]: !prev[`key-${project.id}`]
                            }))}
                          >
                            {visibleSecrets[`key-${project.id}`] 
                              ? <EyeOff className="w-4 h-4" /> 
                              : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(project.api_key, 'API Key')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => regenerateApiKey(project)}
                            title="Regenerar"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">API Secret</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                            {visibleSecrets[`secret-${project.id}`] 
                              ? project.api_secret 
                              : '•'.repeat(32)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setVisibleSecrets(prev => ({
                              ...prev,
                              [`secret-${project.id}`]: !prev[`secret-${project.id}`]
                            }))}
                          >
                            {visibleSecrets[`secret-${project.id}`] 
                              ? <EyeOff className="w-4 h-4" /> 
                              : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(project.api_secret, 'API Secret')}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Limits & Info */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{project.rate_limit_per_minute}/min</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{project.rate_limit_per_hour}/hora</span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>{project.rate_limit_per_day}/dia</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Link2 className="w-4 h-4" />
                        <span>{getProjectInstanceCount(project.id)}/{project.max_instances} instâncias</span>
                      </div>
                    </div>

                    {/* Linked Instances Preview */}
                    {getProjectInstanceCount(project.id) > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {getLinkedInstances(project.id).map((link) => (
                          <Badge key={link.id} variant="secondary" className="gap-1">
                            <span className={`w-2 h-2 rounded-full ${
                              link.instance?.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            {link.instance?.name || 'Instância'}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Toggle Active */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Criado em {format(new Date(project.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {project.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <Switch
                          checked={project.is_active}
                          onCheckedChange={() => toggleProjectStatus(project)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Instances Tab */}
        <TabsContent value="instances" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Instâncias Disponíveis</CardTitle>
              <CardDescription>
                Instâncias do WhatsApp que podem ser vinculadas a projetos de API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Projetos Vinculados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhuma instância disponível
                      </TableCell>
                    </TableRow>
                  ) : (
                    instances.map((instance) => {
                      const linkedProjects = projectInstances
                        .filter(pi => pi.instance_id === instance.id)
                        .map(pi => projects.find(p => p.id === pi.project_id))
                        .filter(Boolean);
                      
                      return (
                        <TableRow key={instance.id}>
                          <TableCell className="font-medium">{instance.name}</TableCell>
                          <TableCell>{getStatusBadge(instance.status)}</TableCell>
                          <TableCell>{instance.phone_number || '—'}</TableCell>
                          <TableCell>
                            {linkedProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {linkedProjects.map((p) => (
                                  <Badge key={p!.id} variant="outline" className="text-xs">
                                    {p!.name}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Nenhum</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6">
          <WAWebhooksManager />
        </TabsContent>

        {/* Automations Tab */}
        <TabsContent value="automations" className="mt-6">
          <WAAutomationsManager />
        </TabsContent>

        {/* API Test Tab */}
        <TabsContent value="api-test" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Exemplos de Uso
                </CardTitle>
                <CardDescription>
                  Copie e cole estes exemplos para testar a API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Send Message Example */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="w-4 h-4" />
                    Enviar Mensagem
                  </Label>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
{`curl -X POST \\
  'https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-core/send' \\
  -H 'Content-Type: application/json' \\
  -H 'X-API-Key: YOUR_API_KEY' \\
  -H 'X-API-Secret: YOUR_API_SECRET' \\
  -d '{
    "instanceId": "INSTANCE_UUID",
    "to": "5511999999999",
    "message": "Olá! Teste de API."
  }'`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`curl -X POST 'https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-core/send' -H 'Content-Type: application/json' -H 'X-API-Key: YOUR_API_KEY' -H 'X-API-Secret: YOUR_API_SECRET' -d '{"instanceId": "INSTANCE_UUID", "to": "5511999999999", "message": "Olá! Teste de API."}'`, 'Exemplo')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Bulk Send Example */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Envio em Lote
                  </Label>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
{`curl -X POST \\
  '.../whatsapp-core/send-bulk' \\
  -H 'X-API-Key: ...' \\
  -d '{
    "instanceId": "...",
    "messages": [
      {"to": "5511...", "message": "Msg 1"},
      {"to": "5511...", "message": "Msg 2"}
    ]
  }'`}
                    </pre>
                  </div>
                </div>

                {/* Status Check Example */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Consultar Status
                  </Label>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
{`curl -X GET \\
  '.../whatsapp-core/status/MESSAGE_ID' \\
  -H 'X-API-Key: YOUR_API_KEY' \\
  -H 'X-API-Secret: YOUR_API_SECRET'`}
                    </pre>
                  </div>
                </div>

                {/* Health Check */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Activity className="w-4 h-4" />
                    Health Check
                  </Label>
                  <div className="relative">
                    <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto font-mono">
{`curl -X GET \\
  'https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-core/health'`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`curl -X GET 'https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-core/health'`, 'Health check')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Info & Endpoints */}
            <div className="space-y-4">
              {/* Base URL */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono truncate">
                      https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-core
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard('https://wvnszzrvrrueuycrpgyc.supabase.co/functions/v1/whatsapp-core', 'Base URL')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Available Endpoints */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Webhook className="w-4 h-4" />
                    Endpoints Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono text-xs w-16 justify-center">POST</Badge>
                        <span className="font-mono">/send</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Enviar mensagem</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono text-xs w-16 justify-center">POST</Badge>
                        <span className="font-mono">/send-bulk</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Envio em lote</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs w-16 justify-center">GET</Badge>
                        <span className="font-mono">/status/:id</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Status da mensagem</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="font-mono text-xs w-16 justify-center">POST</Badge>
                        <span className="font-mono">/events</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Disparar evento</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs w-16 justify-center">GET</Badge>
                        <span className="font-mono">/instances</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Listar instâncias</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-mono text-xs w-16 justify-center">GET</Badge>
                        <span className="font-mono">/health</span>
                      </div>
                      <span className="text-muted-foreground text-xs">Health check</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Authentication Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Autenticação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Todas as requisições (exceto /health) requerem autenticação via headers:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">X-API-Key</code>
                      <span className="text-muted-foreground">Chave do projeto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-muted rounded text-xs font-mono">X-API-Secret</code>
                      <span className="text-muted-foreground">Segredo do projeto</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Rate Limits Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Rate Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Os limites são definidos por projeto:
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="font-bold">60</div>
                      <div className="text-xs text-muted-foreground">/minuto</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="font-bold">1000</div>
                      <div className="text-xs text-muted-foreground">/hora</div>
                    </div>
                    <div className="p-2 bg-muted rounded-lg">
                      <div className="font-bold">10000</div>
                      <div className="text-xs text-muted-foreground">/dia</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Quando excedido, retorna HTTP 429 com header <code className="px-1 bg-muted rounded">X-RateLimit-Reset</code>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Logs de API</CardTitle>
                  <CardDescription>Últimas 100 chamadas de API</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum log registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {log.method}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">
                            {log.endpoint}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={log.response_status && log.response_status < 400 ? 'default' : 'destructive'}
                            >
                              {log.response_status || '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.response_time_ms ? `${log.response_time_ms}ms` : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.ip_address || '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
            <DialogDescription>
              Crie um projeto para obter credenciais de API e integrar sistemas externos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Projeto *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Loja Virtual, CRM Externo..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito deste projeto..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select
                value={formData.environment}
                onValueChange={(v) => setFormData(prev => ({ ...prev, environment: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Limite/min</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_per_minute}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_minute: parseInt(e.target.value) || 60 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Limite/hora</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_per_hour}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_hour: parseInt(e.target.value) || 1000 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Limite/dia</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_per_day}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_day: parseInt(e.target.value) || 10000 
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Máximo de Instâncias</Label>
              <Input
                type="number"
                value={formData.max_instances}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_instances: parseInt(e.target.value) || 3 
                }))}
                min={1}
                max={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={createProject} disabled={!formData.name}>
              Criar Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
            <DialogDescription>
              Atualize as configurações do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Projeto *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select
                value={formData.environment}
                onValueChange={(v) => setFormData(prev => ({ ...prev, environment: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Produção</SelectItem>
                  <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Limite/min</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_per_minute}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_minute: parseInt(e.target.value) || 60 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Limite/hora</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_per_hour}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_hour: parseInt(e.target.value) || 1000 
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Limite/dia</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_per_day}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    rate_limit_per_day: parseInt(e.target.value) || 10000 
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Máximo de Instâncias</Label>
              <Input
                type="number"
                value={formData.max_instances}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_instances: parseInt(e.target.value) || 3 
                }))}
                min={1}
                max={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={updateProject} disabled={!formData.name}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Instance Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Instâncias</DialogTitle>
            <DialogDescription>
              Vincule ou desvincule instâncias do projeto "{selectedProject?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Linked Instances */}
            <div>
              <h4 className="text-sm font-medium mb-2">Instâncias Vinculadas</h4>
              {selectedProject && getLinkedInstances(selectedProject.id).length > 0 ? (
                <div className="space-y-2">
                  {getLinkedInstances(selectedProject.id).map((link) => (
                    <div 
                      key={link.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          link.instance?.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{link.instance?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {link.instance?.phone_number || 'Sem número'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unlinkInstance(link.id)}
                      >
                        <Unlink className="w-4 h-4 mr-1" />
                        Desvincular
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhuma instância vinculada
                </p>
              )}
            </div>

            {/* Available to Link */}
            <div>
              <h4 className="text-sm font-medium mb-2">Disponíveis para Vincular</h4>
              {selectedProject && getUnlinkedInstances(selectedProject.id).length > 0 ? (
                <div className="space-y-2">
                  {getUnlinkedInstances(selectedProject.id).map((instance) => (
                    <div 
                      key={instance.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          instance.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{instance.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {instance.phone_number || 'Sem número'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => linkInstance(instance.id)}
                        disabled={
                          selectedProject && 
                          getProjectInstanceCount(selectedProject.id) >= selectedProject.max_instances
                        }
                      >
                        <Link2 className="w-4 h-4 mr-1" />
                        Vincular
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Todas as instâncias já estão vinculadas
                </p>
              )}
            </div>

            {/* Limit Warning */}
            {selectedProject && getProjectInstanceCount(selectedProject.id) >= selectedProject.max_instances && (
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <p className="text-sm">
                  Limite de {selectedProject.max_instances} instâncias atingido.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppAPIManager;