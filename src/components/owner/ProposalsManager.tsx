import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2,
  Search,
  RefreshCw,
  Eye,
  Mail,
  Phone,
  User,
  Calendar,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Loader2,
  BarChart3,
  Target,
  Sparkles,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { Label } from '@/components/ui/label';

type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'cancelled';

interface AffiliateProposal {
  id: string;
  affiliate_id: string;
  company_name: string;
  company_email: string | null;
  company_phone: string | null;
  company_cnpj: string | null;
  contact_name: string | null;
  status: ProposalStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  accepted_at: string | null;
  cancelled_at: string | null;
  niche_id: string | null;
  questionnaire_answers: unknown | null;
  questionnaire_completed: boolean | null;
  ai_analysis: unknown | null;
  generated_proposal: unknown | null;
  proposal_generated_at: string | null;
  // FASE 6 - Comissões
  proposal_value: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  commission_paid: boolean | null;
  commission_paid_at: string | null;
  affiliates?: {
    name: string;
    email: string;
  } | null;
  business_niches?: {
    name: string;
  } | null;
}

interface GeneratedProposal {
  painPoints: string[];
  benefits: string[];
  roiAnalysis: {
    estimatedSavings: number;
    timeRecovery: number;
    revenueIncrease: number;
    paybackPeriod: number;
  };
  pricing: string;
  personalizedPitch: string;
  nextSteps: string[];
}

const statusConfig: Record<ProposalStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Em Elaboração', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  accepted: { label: 'Aceita', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const ProposalsManager = () => {
  const [proposals, setProposals] = useState<AffiliateProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<AffiliateProposal | null>(null);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [acceptingProposal, setAcceptingProposal] = useState<AffiliateProposal | null>(null);
  const [proposalValue, setProposalValue] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    cancelled: 0,
    totalValue: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_proposals')
        .select(`
          *,
          affiliates:affiliate_id (name, email),
          business_niches:niche_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProposals(data || []);
      
      // Calculate stats
      const accepted = data?.filter(p => p.status === 'accepted') || [];
      const statsData = {
        total: data?.length || 0,
        draft: data?.filter(p => p.status === 'draft').length || 0,
        sent: data?.filter(p => p.status === 'sent').length || 0,
        accepted: accepted.length,
        cancelled: data?.filter(p => p.status === 'cancelled').length || 0,
        totalValue: accepted.reduce((sum, p) => sum + (p.proposal_value || 0), 0),
        totalCommission: accepted.reduce((sum, p) => sum + (p.commission_amount || 0), 0),
      };
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching proposals:', error);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.affiliates?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAcceptProposal = async () => {
    if (!acceptingProposal || !proposalValue) return;
    
    setIsAccepting(true);
    try {
      const value = parseFloat(proposalValue);
      
      // First update the value
      const { error: valueError } = await supabase
        .from('affiliate_proposals')
        .update({ proposal_value: value })
        .eq('id', acceptingProposal.id);
      
      if (valueError) throw valueError;
      
      // Then update status (trigger will calculate commission)
      const { error: statusError } = await supabase
        .from('affiliate_proposals')
        .update({ status: 'accepted' })
        .eq('id', acceptingProposal.id);
      
      if (statusError) throw statusError;
      
      toast.success('Proposta aceita! Comissão calculada automaticamente.');
      setAcceptModalOpen(false);
      setAcceptingProposal(null);
      setProposalValue('');
      fetchProposals();
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error('Erro ao aceitar proposta');
    } finally {
      setIsAccepting(false);
    }
  };

  const handlePayCommission = async (proposal: AffiliateProposal) => {
    try {
      const { data, error } = await supabase.rpc('pay_proposal_commission', {
        proposal_id: proposal.id
      });
      
      if (error) throw error;
      
      if (data) {
        toast.success('Comissão paga! Saldo transferido para disponível.');
        fetchProposals();
      } else {
        toast.error('Não foi possível pagar a comissão');
      }
    } catch (error) {
      console.error('Error paying commission:', error);
      toast.error('Erro ao pagar comissão');
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number; icon: React.ElementType; color: string }) => (
    <Card className="border-border/50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const generatedProposal = selectedProposal?.generated_proposal as GeneratedProposal | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Propostas Empresariais
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as propostas criadas pelos afiliados
          </p>
        </div>
        <Button onClick={fetchProposals} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard title="Total" value={stats.total} icon={BarChart3} color="bg-primary/10 text-primary" />
        <StatCard title="Em Elaboração" value={stats.draft} icon={Clock} color="bg-amber-500/10 text-amber-500" />
        <StatCard title="Enviadas" value={stats.sent} icon={Send} color="bg-blue-500/10 text-blue-500" />
        <StatCard title="Aceitas" value={stats.accepted} icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-500" />
        <StatCard title="Canceladas" value={stats.cancelled} icon={XCircle} color="bg-red-500/10 text-red-500" />
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comissões</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(stats.totalCommission)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, afiliado ou contato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="draft">Em Elaboração</SelectItem>
                <SelectItem value="sent">Enviadas</SelectItem>
                <SelectItem value="accepted">Aceitas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Lista de Propostas</CardTitle>
          <CardDescription>
            {filteredProposals.length} proposta(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma proposta encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProposals.map((proposal) => {
                    const StatusIcon = statusConfig[proposal.status].icon;
                    return (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{proposal.company_name}</p>
                            {proposal.contact_name && (
                              <p className="text-xs text-muted-foreground">{proposal.contact_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{proposal.affiliates?.name || '-'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[proposal.status].color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig[proposal.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">
                            {proposal.proposal_value ? formatCurrency(proposal.proposal_value) : '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          {proposal.commission_amount ? (
                            <div>
                              <p className="text-sm font-medium text-primary">
                                {formatCurrency(proposal.commission_amount)}
                              </p>
                              {proposal.commission_paid ? (
                                <Badge variant="outline" className="text-xs text-emerald-600">Paga</Badge>
                              ) : proposal.status === 'accepted' ? (
                                <Badge variant="outline" className="text-xs text-amber-600">Pendente</Badge>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(proposal.created_at), "dd/MM/yy", { locale: ptBR })}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProposal(proposal)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {proposal.status === 'sent' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-700"
                                onClick={() => {
                                  setAcceptingProposal(proposal);
                                  setProposalValue(proposal.proposal_value?.toString() || '');
                                  setAcceptModalOpen(true);
                                }}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            {proposal.status === 'accepted' && !proposal.commission_paid && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                onClick={() => handlePayCommission(proposal)}
                              >
                                <CreditCard className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {selectedProposal?.company_name}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            {selectedProposal && (
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Informações</TabsTrigger>
                  <TabsTrigger value="questionnaire">Questionário</TabsTrigger>
                  <TabsTrigger value="proposal">Proposta IA</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  {/* Company Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Dados da Empresa</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedProposal.company_name}</span>
                      </div>
                      {selectedProposal.contact_name && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedProposal.contact_name}</span>
                        </div>
                      )}
                      {selectedProposal.company_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedProposal.company_email}</span>
                        </div>
                      )}
                      {selectedProposal.company_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{selectedProposal.company_phone}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Affiliate Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Afiliado Responsável</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p><strong>Nome:</strong> {selectedProposal.affiliates?.name || '-'}</p>
                      <p><strong>Email:</strong> {selectedProposal.affiliates?.email || '-'}</p>
                      <p><strong>Nicho:</strong> {selectedProposal.business_niches?.name || 'Não definido'}</p>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Criado: {format(new Date(selectedProposal.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      {selectedProposal.sent_at && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Send className="w-4 h-4" />
                          <span>Enviado: {format(new Date(selectedProposal.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}
                      {selectedProposal.accepted_at && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Aceito: {format(new Date(selectedProposal.accepted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="questionnaire" className="mt-4">
                  {selectedProposal.questionnaire_completed && selectedProposal.questionnaire_answers ? (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Respostas do Questionário
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(selectedProposal.questionnaire_answers as Array<{ question: string; answer: string }>).map((qa, idx) => (
                            <div key={idx} className="border-b border-border pb-3 last:border-0">
                              <p className="text-sm font-medium text-foreground">{qa.question}</p>
                              <p className="text-sm text-muted-foreground mt-1">{qa.answer}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Questionário ainda não foi preenchido</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="proposal" className="mt-4 space-y-4">
                  {generatedProposal ? (
                    <>
                      {/* Pain Points */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                            <Target className="w-4 h-4" />
                            Dores Identificadas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {generatedProposal.painPoints?.map((pain, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <span className="text-destructive">•</span>
                                {pain}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Benefits */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Benefícios
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {generatedProposal.benefits?.map((benefit, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* ROI */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            Análise de ROI
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(generatedProposal.roiAnalysis?.estimatedSavings || 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">Economia Mensal</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-lg font-bold text-blue-600">
                                {generatedProposal.roiAnalysis?.timeRecovery || 0}h
                              </p>
                              <p className="text-xs text-muted-foreground">Horas/Semana</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-lg font-bold text-primary">
                                +{generatedProposal.roiAnalysis?.revenueIncrease || 0}%
                              </p>
                              <p className="text-xs text-muted-foreground">Aumento Receita</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-lg font-bold text-amber-600">
                                {generatedProposal.roiAnalysis?.paybackPeriod || 0} meses
                              </p>
                              <p className="text-xs text-muted-foreground">Payback</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pitch */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Pitch Personalizado</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {generatedProposal.personalizedPitch}
                          </p>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Proposta IA ainda não foi gerada</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Accept Proposal Modal */}
      <Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Aceitar Proposta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Empresa: <strong className="text-foreground">{acceptingProposal?.company_name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Afiliado: <strong className="text-foreground">{acceptingProposal?.affiliates?.name}</strong>
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="proposal_value">Valor da Proposta (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="proposal_value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={proposalValue}
                  onChange={(e) => setProposalValue(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A comissão será calculada automaticamente com base na taxa do afiliado.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAcceptModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAcceptProposal} 
                disabled={isAccepting || !proposalValue}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProposalsManager;
