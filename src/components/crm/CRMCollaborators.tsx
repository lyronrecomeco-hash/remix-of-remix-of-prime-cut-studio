import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCRM } from '@/contexts/CRMContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  UserPlus,
  Users,
  Trash2,
  RefreshCw,
  Loader2,
  Copy,
  CheckCircle2,
  XCircle,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Collaborator {
  id: string;
  name: string;
  whatsapp: string;
  access_level: string;
  token: string;
  is_used: boolean;
  created_at: string;
  expires_at: string;
}

export default function CRMCollaborators() {
  const { crmTenant, crmUser, isAdmin } = useCRM();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    access_level: 'full',
  });

  useEffect(() => {
    if (crmTenant) {
      fetchCollaborators();
    }
  }, [crmTenant]);

  const fetchCollaborators = async () => {
    if (!crmTenant) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_collaborator_tokens')
        .select('*')
        .eq('crm_tenant_id', crmTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error: any) {
      console.error('Error fetching collaborators:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setIsLoading(false);
    }
  };

  const generateToken = () => {
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `crm@genesishub-token-${randomPart}`;
  };

  const handleAddCollaborator = async () => {
    if (!crmTenant || !crmUser) return;
    
    if (!formData.name || !formData.whatsapp) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = generateToken();

      const { data, error } = await supabase
        .from('crm_collaborator_tokens')
        .insert({
          crm_tenant_id: crmTenant.id,
          name: formData.name,
          whatsapp: formData.whatsapp,
          access_level: formData.access_level,
          token,
          created_by: crmUser.id,
        })
        .select()
        .single();

      if (error) throw error;

      setCollaborators([data, ...collaborators]);
      setFormData({ name: '', whatsapp: '', access_level: 'full' });
      setIsAddOpen(false);

      // Try to send WhatsApp message via automation
      try {
        await supabase.functions.invoke('send-collaborator-token', {
          body: {
            whatsapp: formData.whatsapp,
            name: formData.name,
            token,
            companyName: crmTenant.name,
          },
        });
        toast.success('Colaborador adicionado e token enviado via WhatsApp!');
      } catch (whatsappError) {
        console.error('WhatsApp send error:', whatsappError);
        toast.success('Colaborador adicionado! Token não pôde ser enviado automaticamente.');
      }
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      toast.error('Erro ao adicionar colaborador');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendToken = async (collaborator: Collaborator) => {
    try {
      await supabase.functions.invoke('send-collaborator-token', {
        body: {
          whatsapp: collaborator.whatsapp,
          name: collaborator.name,
          token: collaborator.token,
          companyName: crmTenant?.name,
        },
      });
      toast.success('Token reenviado com sucesso!');
    } catch (error: any) {
      console.error('Error resending token:', error);
      toast.error('Erro ao reenviar token');
    }
  };

  const handleRemoveCollaborator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('crm_collaborator_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollaborators(collaborators.filter(c => c.id !== id));
      toast.success('Colaborador removido com sucesso!');
    } catch (error: any) {
      console.error('Error removing collaborator:', error);
      toast.error('Erro ao remover colaborador');
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copiado!');
  };

  const getAccessLevelBadge = (level: string) => {
    switch (level) {
      case 'full':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Acesso Total</Badge>;
      case 'whatsapp_only':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Apenas WhatsApp</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas administradores podem gerenciar colaboradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Colaboradores</h2>
          <p className="text-muted-foreground">
            Gerencie os colaboradores da sua empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCollaborators}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
                <DialogDescription>
                  O token de acesso será enviado automaticamente via WhatsApp
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="collab-name">Nome do Colaborador *</Label>
                  <Input
                    id="collab-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collab-whatsapp">WhatsApp *</Label>
                  <Input
                    id="collab-whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="5511999999999"
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas números com código do país (55)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-level">Nível de Acesso</Label>
                  <Select
                    value={formData.access_level}
                    onValueChange={(value) => setFormData({ ...formData, access_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Acesso Total (Full)</SelectItem>
                      <SelectItem value="whatsapp_only">Apenas WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-400">Token via WhatsApp</p>
                      <p className="text-muted-foreground">
                        O token de acesso será enviado automaticamente para o WhatsApp informado.
                        Em caso de erro, você poderá reenviar o token.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCollaborator} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Adicionar e Enviar Token
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{collaborators.length}</p>
                <p className="text-sm text-muted-foreground">Total de Colaboradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {collaborators.filter(c => c.is_used).length}
                </p>
                <p className="text-sm text-muted-foreground">Tokens Utilizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <XCircle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {collaborators.filter(c => !c.is_used).length}
                </p>
                <p className="text-sm text-muted-foreground">Tokens Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum colaborador cadastrado ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Acesso</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collaborators.map((collab) => (
                  <TableRow key={collab.id}>
                    <TableCell className="font-medium">{collab.name}</TableCell>
                    <TableCell>{collab.whatsapp}</TableCell>
                    <TableCell>{getAccessLevelBadge(collab.access_level)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {collab.token.substring(0, 20)}...
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToken(collab.token)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {collab.is_used ? (
                        <Badge className="bg-green-500/20 text-green-400">Utilizado</Badge>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(collab.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!collab.is_used && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResendToken(collab)}
                            title="Reenviar token"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover Colaborador</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover {collab.name}? 
                                Esta ação é irreversível e o colaborador perderá acesso imediatamente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveCollaborator(collab.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
