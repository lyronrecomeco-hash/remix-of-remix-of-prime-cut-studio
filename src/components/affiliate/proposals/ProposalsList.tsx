import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  MoreVertical,
  Trash2,
  Send,
  Eye,
  Edit,
  XCircle,
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import type { AffiliateProposal, ProposalStatus } from './types';

interface ProposalsListProps {
  proposals: AffiliateProposal[];
  loading: boolean;
  onUpdate: (id: string, data: { status: ProposalStatus }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onView?: (proposal: AffiliateProposal) => void;
  onStartQuestionnaire?: (proposal: AffiliateProposal) => void;
}

export function ProposalsList({ 
  proposals, 
  loading, 
  onUpdate, 
  onDelete, 
  onView,
  onStartQuestionnaire 
}: ProposalsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    await onUpdate(id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-4">
              <div className="h-20 bg-secondary/50 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma proposta ainda
          </h3>
          <p className="text-muted-foreground">
            Crie sua primeira proposta empresarial clicando no botão acima.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground truncate">
                          {proposal.company_name}
                        </h3>
                        <ProposalStatusBadge status={proposal.status} />
                        {proposal.questionnaire_completed && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                            <CheckCircle className="w-3 h-3" />
                            Questionário
                          </span>
                        )}
                      </div>
                      
                      {proposal.contact_name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Contato: {proposal.contact_name}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        {proposal.company_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {proposal.company_email}
                          </span>
                        )}
                        {proposal.company_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {proposal.company_phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Botão de Questionário - só aparece para drafts sem questionário */}
                  {proposal.status === 'draft' && !proposal.questionnaire_completed && onStartQuestionnaire && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartQuestionnaire(proposal)}
                      className="gap-1 text-primary border-primary/50 hover:bg-primary/10"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span className="hidden sm:inline">Questionário</span>
                    </Button>
                  )}

                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(proposal)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      {proposal.status === 'draft' && (
                        <>
                          {!proposal.questionnaire_completed && onStartQuestionnaire && (
                            <DropdownMenuItem onClick={() => onStartQuestionnaire(proposal)}>
                              <ClipboardList className="w-4 h-4 mr-2" />
                              Iniciar Questionário
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onView?.(proposal)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {proposal.questionnaire_completed && (
                            <DropdownMenuItem onClick={() => handleStatusChange(proposal.id, 'sent')}>
                              <Send className="w-4 h-4 mr-2" />
                              Marcar como Enviada
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setDeleteId(proposal.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {proposal.status === 'sent' && (
                        <>
                          <DropdownMenuItem onClick={() => handleStatusChange(proposal.id, 'accepted')}>
                            <Eye className="w-4 h-4 mr-2" />
                            Marcar como Aceita
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(proposal.id, 'cancelled')}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar Proposta
                          </DropdownMenuItem>
                        </>
                      )}

                      {proposal.status === 'accepted' && (
                        <DropdownMenuItem disabled>
                          <Eye className="w-4 h-4 mr-2" />
                          Proposta Aceita
                        </DropdownMenuItem>
                      )}

                      {proposal.status === 'cancelled' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(proposal.id, 'draft')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Reabrir como Rascunho
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {proposal.notes && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {proposal.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A proposta será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
