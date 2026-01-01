import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Contact,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Phone,
  Ban,
  CheckCircle,
  XCircle,
  Tag,
  Loader2,
  Upload,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface ContactData {
  id: string;
  instance_id: string;
  phone: string;
  name: string | null;
  push_name: string | null;
  profile_picture_url: string | null;
  about: string | null;
  is_business: boolean;
  is_verified: boolean;
  is_blocked: boolean;
  has_whatsapp: boolean | null;
  last_checked_at: string | null;
  tags: string[];
  custom_fields: any;
  synced_at: string;
  created_at: string;
}

interface WAContactsProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

export const WAContacts = ({ instances }: WAContactsProps) => {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [checkPhone, setCheckPhone] = useState('');
  const [checkResult, setCheckResult] = useState<{ phone: string; hasWhatsapp: boolean } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTags, setFormTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .order('name', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setContacts((data || []) as ContactData[]);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Erro ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const checkWhatsAppNumber = async () => {
    if (!checkPhone.trim()) return;

    setIsChecking(true);
    setCheckResult(null);
    try {
      let formattedPhone = checkPhone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      // This would call the backend to check if the number has WhatsApp
      // For now, simulate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const hasWhatsapp = Math.random() > 0.2; // Simulated result
      setCheckResult({ phone: formattedPhone, hasWhatsapp });

      // Save to contacts if has WhatsApp
      if (hasWhatsapp) {
        await supabase.from('whatsapp_contacts').upsert({
          instance_id: instances[0]?.id,
          phone: formattedPhone,
          has_whatsapp: true,
          last_checked_at: new Date().toISOString(),
        }, { onConflict: 'instance_id,phone' });
        fetchContacts();
      }

      toast.success(hasWhatsapp ? 'Número tem WhatsApp!' : 'Número não tem WhatsApp');
    } catch (error) {
      toast.error('Erro ao verificar número');
    } finally {
      setIsChecking(false);
    }
  };

  const openCreateDialog = () => {
    setEditingContact(null);
    setFormName('');
    setFormPhone('');
    setFormTags('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (contact: ContactData) => {
    setEditingContact(contact);
    setFormName(contact.name || '');
    setFormPhone(contact.phone);
    setFormTags(contact.tags.join(', '));
    setIsDialogOpen(true);
  };

  const saveContact = async () => {
    if (!formPhone.trim()) {
      toast.error('Digite o telefone');
      return;
    }

    setIsSaving(true);
    try {
      let formattedPhone = formPhone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = '55' + formattedPhone;
      }

      const data = {
        instance_id: instances[0]?.id,
        phone: formattedPhone,
        name: formName || null,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (editingContact) {
        const { error } = await supabase
          .from('whatsapp_contacts')
          .update(data)
          .eq('id', editingContact.id);
        if (error) throw error;
        toast.success('Contato atualizado!');
      } else {
        const { error } = await supabase
          .from('whatsapp_contacts')
          .insert(data);
        if (error) throw error;
        toast.success('Contato adicionado!');
      }

      setIsDialogOpen(false);
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Erro ao salvar contato');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBlock = async (contact: ContactData) => {
    try {
      await supabase
        .from('whatsapp_contacts')
        .update({ is_blocked: !contact.is_blocked })
        .eq('id', contact.id);

      toast.success(contact.is_blocked ? 'Contato desbloqueado' : 'Contato bloqueado');
      fetchContacts();
    } catch (error) {
      toast.error('Erro ao alterar bloqueio');
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await supabase.from('whatsapp_contacts').delete().eq('id', id);
      toast.success('Contato removido');
      fetchContacts();
    } catch (error) {
      toast.error('Erro ao remover contato');
    }
  };

  const exportContacts = () => {
    const csv = [
      ['Nome', 'Telefone', 'Tags', 'Tem WhatsApp', 'Bloqueado'].join(','),
      ...contacts.map(c => [
        c.name || '',
        c.phone,
        c.tags.join(';'),
        c.has_whatsapp ? 'Sim' : 'Não',
        c.is_blocked ? 'Sim' : 'Não'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contatos-whatsapp.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Contatos exportados!');
  };

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      contact.phone.includes(query) ||
      contact.name?.toLowerCase().includes(query) ||
      contact.tags.some(t => t.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Check Number Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verificar Número</CardTitle>
          <CardDescription>
            Verifique se um número possui WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Ex: 11999999999"
                value={checkPhone}
                onChange={(e) => setCheckPhone(e.target.value)}
              />
            </div>
            <Button onClick={checkWhatsAppNumber} disabled={isChecking}>
              {isChecking ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Phone className="w-4 h-4 mr-2" />
              )}
              Verificar
            </Button>
          </div>
          {checkResult && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              checkResult.hasWhatsapp ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              {checkResult.hasWhatsapp ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium">
                  {checkResult.hasWhatsapp ? 'Número tem WhatsApp' : 'Número não tem WhatsApp'}
                </p>
                <p className="text-sm text-muted-foreground">{checkResult.phone}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Contact className="w-5 h-5" />
                Contatos ({contacts.length})
              </CardTitle>
              <CardDescription>
                Gerencie seus contatos do WhatsApp
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportContacts}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contato..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Contact className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contato encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={contact.profile_picture_url || undefined} />
                            <AvatarFallback>
                              {contact.name?.[0] || contact.phone.slice(-2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {contact.name || 'Sem nome'}
                            </p>
                            {contact.push_name && contact.push_name !== contact.name && (
                              <p className="text-xs text-muted-foreground">
                                {contact.push_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {contact.has_whatsapp !== null && (
                            contact.has_whatsapp ? (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <XCircle className="w-3 h-3 mr-1" />
                                Sem WA
                              </Badge>
                            )
                          )}
                          {contact.is_blocked && (
                            <Badge variant="destructive" className="text-xs">
                              <Ban className="w-3 h-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(contact)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBlock(contact)}
                          >
                            <Ban className={`w-4 h-4 ${contact.is_blocked ? 'text-destructive' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteContact(contact.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add/Edit Contact Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Atualize os dados do contato' : 'Adicione um novo contato'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Nome do contato"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                placeholder="11999999999"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                disabled={!!editingContact}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input
                placeholder="cliente, vip, ativo"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveContact} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
