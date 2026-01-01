import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Zap,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Copy,
  Check,
  Hash,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickReply {
  id: string;
  instance_id: string;
  shortcut: string;
  title: string;
  content: string;
  media_url: string | null;
  usage_count: number;
  is_active: boolean;
  created_at: string;
}

interface WAQuickRepliesProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

export const WAQuickReplies = ({ instances }: WAQuickRepliesProps) => {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [formShortcut, setFormShortcut] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_quick_replies')
        .select('*')
        .order('usage_count', { ascending: false });

      if (error) throw error;
      setQuickReplies((data || []) as QuickReply[]);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
      toast.error('Erro ao carregar respostas rápidas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = () => {
    setEditingReply(null);
    setFormShortcut('');
    setFormTitle('');
    setFormContent('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (reply: QuickReply) => {
    setEditingReply(reply);
    setFormShortcut(reply.shortcut);
    setFormTitle(reply.title);
    setFormContent(reply.content);
    setIsDialogOpen(true);
  };

  const saveReply = async () => {
    if (!formShortcut.trim() || !formTitle.trim() || !formContent.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        instance_id: instances[0]?.id,
        shortcut: formShortcut.startsWith('/') ? formShortcut : '/' + formShortcut,
        title: formTitle,
        content: formContent,
      };

      if (editingReply) {
        const { error } = await supabase
          .from('whatsapp_quick_replies')
          .update(data)
          .eq('id', editingReply.id);
        if (error) throw error;
        toast.success('Resposta rápida atualizada!');
      } else {
        const { error } = await supabase
          .from('whatsapp_quick_replies')
          .insert(data);
        if (error) throw error;
        toast.success('Resposta rápida criada!');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving quick reply:', error);
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReply = async (id: string) => {
    try {
      const { error } = await supabase.from('whatsapp_quick_replies').delete().eq('id', id);
      if (error) throw error;
      toast.success('Resposta rápida removida');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const copyContent = async (reply: QuickReply) => {
    await navigator.clipboard.writeText(reply.content);
    setCopiedId(reply.id);
    setTimeout(() => setCopiedId(null), 2000);
    
    // Update usage count
    await supabase
      .from('whatsapp_quick_replies')
      .update({ usage_count: reply.usage_count + 1 })
      .eq('id', reply.id);
    
    toast.success('Copiado para a área de transferência!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Respostas Rápidas
              </CardTitle>
              <CardDescription>
                Crie atalhos para mensagens frequentes
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Resposta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingReply ? 'Editar Resposta' : 'Nova Resposta Rápida'}</DialogTitle>
                  <DialogDescription>
                    Crie um atalho para uma mensagem frequente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Atalho</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="saudacao"
                        value={formShortcut}
                        onChange={(e) => setFormShortcut(e.target.value.replace(/\s/g, ''))}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite "{formShortcut.startsWith('/') ? formShortcut : '/' + formShortcut}" para usar
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      placeholder="Saudação inicial"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Conteúdo</Label>
                    <Textarea
                      placeholder="Olá! Como posso ajudar você hoje?"
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={saveReply} disabled={isSaving}>
                    {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {quickReplies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma resposta rápida configurada</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Resposta
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quickReplies.map((reply) => (
                  <Card key={reply.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Badge variant="secondary" className="font-mono text-xs mb-2">
                            {reply.shortcut}
                          </Badge>
                          <h4 className="font-medium text-sm">{reply.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {reply.usage_count}x
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {reply.content}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyContent(reply)}
                        >
                          {copiedId === reply.id ? (
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          Copiar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(reply)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive"
                          onClick={() => deleteReply(reply.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
