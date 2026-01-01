import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  Search,
  RefreshCw,
  MessageSquare,
  Shield,
  Crown,
  UserPlus,
  UserMinus,
  Archive,
  Loader2,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface Group {
  id: string;
  instance_id: string;
  group_jid: string;
  name: string | null;
  description: string | null;
  owner_jid: string | null;
  picture_url: string | null;
  participant_count: number;
  is_admin: boolean;
  is_archived: boolean;
  last_message_at: string | null;
  synced_at: string;
}

interface Participant {
  id: string;
  group_id: string;
  phone: string;
  name: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  joined_at: string | null;
}

interface WAGroupsProps {
  instances: Array<{ id: string; name: string; status: string }>;
}

export const WAGroups = ({ instances }: WAGroupsProps) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [groupMessage, setGroupMessage] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_groups')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setGroups((data || []) as Group[]);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchParticipants = useCallback(async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_group_participants')
        .select('*')
        .eq('group_id', groupId)
        .order('is_super_admin', { ascending: false })
        .order('is_admin', { ascending: false });

      if (error) throw error;
      setParticipants((data || []) as Participant[]);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroup) {
      fetchParticipants(selectedGroup.id);
    }
  }, [selectedGroup, fetchParticipants]);

  const handleSyncGroups = async () => {
    setIsSyncing(true);
    toast.info('Sincronização de grupos iniciada...');
    // This would call the backend to sync groups
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Grupos sincronizados!');
      fetchGroups();
    }, 2000);
  };

  const handleSendMessage = async () => {
    if (!groupMessage.trim() || !selectedGroup) return;

    setIsSendingMessage(true);
    try {
      // This would call the backend to send the message
      await supabase.from('whatsapp_send_queue').insert({
        instance_id: selectedGroup.instance_id,
        phone_to: selectedGroup.group_jid,
        message_type: 'text',
        message_content: groupMessage,
        status: 'queued',
      });

      toast.success('Mensagem enviada para a fila!');
      setGroupMessage('');
      setMessageDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const toggleArchive = async (group: Group) => {
    try {
      await supabase
        .from('whatsapp_groups')
        .update({ is_archived: !group.is_archived })
        .eq('id', group.id);

      toast.success(group.is_archived ? 'Grupo desarquivado' : 'Grupo arquivado');
      fetchGroups();
    } catch (error) {
      toast.error('Erro ao arquivar grupo');
    }
  };

  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return !group.is_archived;
    const query = searchQuery.toLowerCase();
    return (
      !group.is_archived &&
      (group.name?.toLowerCase().includes(query) || group.group_jid.includes(query))
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
      <div className="flex h-[calc(100vh-250px)] min-h-[500px] gap-4">
        {/* Groups List */}
        <Card className="w-96 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-5 h-5" />
                Grupos
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleSyncGroups} disabled={isSyncing}>
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum grupo encontrado</p>
                  <Button variant="outline" className="mt-4" onClick={handleSyncGroups}>
                    Sincronizar Grupos
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedGroup?.id === group.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedGroup(group)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={group.picture_url || undefined} />
                          <AvatarFallback>
                            <Users className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {group.name || 'Grupo sem nome'}
                            </p>
                            {group.is_admin && (
                              <Shield className="w-3 h-3 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.participant_count} participantes
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Group Details */}
        <Card className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={selectedGroup.picture_url || undefined} />
                      <AvatarFallback>
                        <Users className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {selectedGroup.name || 'Grupo sem nome'}
                        {selectedGroup.is_admin && (
                          <Badge variant="outline" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {selectedGroup.participant_count} participantes
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMessageDialogOpen(true)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleArchive(selectedGroup)}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {selectedGroup.description && (
                  <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-lg">
                    {selectedGroup.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="p-4">
                  <h4 className="font-medium text-sm mb-3">Participantes</h4>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>
                                {participant.name?.[0] || participant.phone.slice(-2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">
                                {participant.name || participant.phone}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {participant.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {participant.is_super_admin && (
                              <Badge variant="default" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Dono
                              </Badge>
                            )}
                            {participant.is_admin && !participant.is_super_admin && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {participants.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum participante encontrado
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium text-lg mb-2">Selecione um grupo</h3>
                <p className="text-sm">Escolha um grupo para ver os detalhes</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Send Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem para o Grupo</DialogTitle>
            <DialogDescription>
              {selectedGroup?.name || 'Grupo selecionado'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={groupMessage}
              onChange={(e) => setGroupMessage(e.target.value)}
              rows={4}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSendingMessage || !groupMessage.trim()}
              className="w-full"
            >
              {isSendingMessage ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
