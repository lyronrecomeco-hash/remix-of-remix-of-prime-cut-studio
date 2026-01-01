import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Building2, 
  Mail, 
  Phone, 
  MoreVertical,
  Trash2,
  Send,
  Eye,
  Edit,
  XCircle,
  ClipboardList,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Link2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import type { AffiliateProposal, ProposalStatus } from './types';
import { toast } from 'sonner';

interface ProposalsListProps {
  proposals: AffiliateProposal[];
  loading: boolean;
  onUpdate: (id: string, data: { status: ProposalStatus }) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onView?: (proposal: AffiliateProposal) => void;
  onStartQuestionnaire?: (proposal: AffiliateProposal) => void;
  onViewProposal?: (proposal: AffiliateProposal) => void;
}

const ITEMS_PER_PAGE = 8;

export function ProposalsList({ 
  proposals, 
  loading, 
  onUpdate, 
  onDelete, 
  onView,
  onStartQuestionnaire,
  onViewProposal
}: ProposalsListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(proposals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProposals = proposals.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    await onUpdate(id, { status: newStatus });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getProposalLink = (proposal: AffiliateProposal) => {
    // Use ID for reliable lookup
    return `${window.location.origin}/proposta/${proposal.id}`;
  };

  const copyLink = (proposal: AffiliateProposal) => {
    const link = getProposalLink(proposal);
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const openProposalPage = (proposal: AffiliateProposal) => {
    window.open(`/proposta/${proposal.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border animate-pulse">
            <CardContent className="p-3">
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
        <CardContent className="p-6 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-base font-medium text-foreground mb-1">
            Nenhuma proposta ainda
          </h3>
          <p className="text-sm text-muted-foreground">
            Crie sua primeira proposta empresarial.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      {/* Grid compacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {paginatedProposals.map((proposal) => (
          <Card 
            key={proposal.id} 
            className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-md group"
          >
            <CardContent className="p-3">
              <div className="flex flex-col gap-2">
                {/* Header compacto */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="p-1.5 bg-primary/10 rounded-md shrink-0">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {proposal.company_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(proposal.created_at), "dd/MM/yy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      {proposal.status === 'draft' && (
                        <>
                          {!proposal.questionnaire_completed && onStartQuestionnaire && (
                            <DropdownMenuItem onClick={() => onStartQuestionnaire(proposal)}>
                              <ClipboardList className="w-4 h-4 mr-2" />
                              Questionário
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onView?.(proposal)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {proposal.questionnaire_completed && (
                            <DropdownMenuItem onClick={() => handleStatusChange(proposal.id, 'sent')}>
                              <Send className="w-4 h-4 mr-2" />
                              Marcar Enviada
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
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Marcar Aceita
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(proposal.id, 'cancelled')}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </>
                      )}

                      {proposal.status === 'cancelled' && (
                        <DropdownMenuItem onClick={() => handleStatusChange(proposal.id, 'draft')}>
                          <Edit className="w-4 h-4 mr-2" />
                          Reabrir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status e badges */}
                <div className="flex flex-wrap gap-1.5">
                  <ProposalStatusBadge status={proposal.status} />
                  {proposal.questionnaire_completed && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>

                {/* Info compacta */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {proposal.company_email && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Mail className="w-3.5 h-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>{proposal.company_email}</TooltipContent>
                    </Tooltip>
                  )}
                  {proposal.company_phone && (
                    <Tooltip>
                      <TooltipTrigger>
                        <Phone className="w-3.5 h-3.5" />
                      </TooltipTrigger>
                      <TooltipContent>{proposal.company_phone}</TooltipContent>
                    </Tooltip>
                  )}
                  {proposal.contact_name && (
                    <span className="truncate">{proposal.contact_name}</span>
                  )}
                </div>

                {/* Ações */}
                <div className="flex gap-1.5 pt-1.5 border-t border-border">
                  {proposal.status === 'draft' && !proposal.questionnaire_completed && onStartQuestionnaire && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartQuestionnaire(proposal)}
                      className="flex-1 h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Iniciar
                    </Button>
                  )}

                  {proposal.questionnaire_completed && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewProposal?.(proposal)}
                        className="flex-1 h-7 text-xs gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Ver
                      </Button>
                      
                      {proposal.generated_proposal && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyLink(proposal)}
                                className="h-7 w-7 p-0"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Copiar link</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openProposalPage(proposal)}
                                className="h-7 w-7 p-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Abrir página</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </>
                  )}

                  {!proposal.questionnaire_completed && onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(proposal)}
                      className="h-7 w-7 p-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginação compacta */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-muted-foreground">
            {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, proposals.length)} de {proposals.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  page = currentPage - 2 + i;
                }
                if (page > totalPages) page = totalPages - 4 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className="h-7 w-7 p-0 text-xs"
                >
                  {page}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
    </TooltipProvider>
  );
}
