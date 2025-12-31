import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Ban, 
  CheckCircle, 
  Search,
  Copy,
  Eye,
  Wallet,
  TrendingUp,
  UserCheck,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface Affiliate {
  id: string;
  user_id: string;
  name: string;
  email: string;
  whatsapp: string;
  affiliate_code: string;
  password_hash: string;
  status: 'active' | 'pending' | 'blocked';
  total_earnings: number;
  pending_balance: number;
  available_balance: number;
  pix_key: string | null;
  pix_type: string | null;
  created_at: string;
}

interface Withdrawal {
  id: string;
  affiliate_id: string;
  amount: number;
  pix_key: string;
  pix_type: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejection_reason: string | null;
  requested_at: string;
  processed_at: string | null;
}

interface Referral {
  id: string;
  affiliate_id: string;
  referred_user_id: string;
  status: 'pending' | 'trial' | 'converted' | 'cancelled';
  plan_name: string | null;
  plan_price: number | null;
  commission_amount: number | null;
  created_at: string;
  converted_at: string | null;
}

const AffiliateManager = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [creating, setCreating] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showAffiliateDetailsModal, setShowAffiliateDetailsModal] = useState(false);

  const [createdCredentials, setCreatedCredentials] = useState<{
    name?: string;
    email: string;
    password: string;
    affiliate_code: string;
  } | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  
  const [newAffiliate, setNewAffiliate] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [affiliatesRes, withdrawalsRes, referralsRes] = await Promise.all([
        supabase.from('affiliates').select('*').order('created_at', { ascending: false }),
        supabase.from('affiliate_withdrawals').select('*').order('requested_at', { ascending: false }),
        supabase.from('affiliate_referrals').select('*').order('created_at', { ascending: false })
      ]);

      if (affiliatesRes.data) setAffiliates(affiliatesRes.data as Affiliate[]);
      if (withdrawalsRes.data) setWithdrawals(withdrawalsRes.data as Withdrawal[]);
      if (referralsRes.data) setReferrals(referralsRes.data as Referral[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateAffiliate = async () => {
    if (!newAffiliate.name || !newAffiliate.email || !newAffiliate.whatsapp) {
      toast.error('Preencha todos os campos');
      return;
    }

    setCreating(true);
    try {
      const normalizedEmail = newAffiliate.email.toLowerCase().trim();

      const { data, error } = await supabase.functions.invoke('create-affiliate', {
        body: {
          name: newAffiliate.name,
          email: normalizedEmail,
          whatsapp: newAffiliate.whatsapp,
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao criar afiliado');
      }

      if (!data?.success || !data?.affiliate?.email || !data?.affiliate?.password) {
        throw new Error(data?.error || 'Erro ao criar afiliado');
      }

      setCreatedCredentials({
        name: data.affiliate.name,
        email: data.affiliate.email,
        password: data.affiliate.password,
        affiliate_code: data.affiliate.affiliate_code,
      });
      setShowCredentialsModal(true);

      toast.success('Afiliado criado com sucesso!');

      setNewAffiliate({ name: '', email: '', whatsapp: '' });
      setShowCreateModal(false);
      fetchData();
    } catch (error: any) {
      console.error('Error creating affiliate:', error);
      toast.error(error.message || 'Erro ao criar afiliado');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (affiliate: Affiliate) => {
    const newStatus = affiliate.status === 'active' ? 'blocked' : 'active';
    
    try {
      const { error } = await supabase
        .from('affiliates')
        .update({ status: newStatus })
        .eq('id', affiliate.id);

      if (error) throw error;

      toast.success(`Afiliado ${newStatus === 'active' ? 'ativado' : 'bloqueado'}`);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleProcessWithdrawal = async (status: 'completed' | 'rejected') => {
    if (!selectedWithdrawal) return;
    if (status === 'rejected' && !rejectionReason) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    setProcessing(true);
    try {
      const { error: withdrawalError } = await supabase
        .from('affiliate_withdrawals')
        .update({
          status,
          rejection_reason: status === 'rejected' ? rejectionReason : null,
          processed_at: new Date().toISOString()
        })
        .eq('id', selectedWithdrawal.id);

      if (withdrawalError) throw withdrawalError;

      if (status === 'completed') {
        const affiliate = affiliates.find(a => a.id === selectedWithdrawal.affiliate_id);
        if (affiliate) {
          await supabase
            .from('affiliates')
            .update({
              available_balance: affiliate.available_balance - selectedWithdrawal.amount
            })
            .eq('id', affiliate.id);
        }
      }

      toast.success(`Saque ${status === 'completed' ? 'aprovado' : 'rejeitado'}`);
      setShowWithdrawalModal(false);
      setSelectedWithdrawal(null);
      setRejectionReason('');
      fetchData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Erro ao processar saque');
    } finally {
      setProcessing(false);
    }
  };

  const getAffiliateName = (affiliateId: string) => {
    const affiliate = affiliates.find(a => a.id === affiliateId);
    return affiliate?.name || 'Desconhecido';
  };

  const filteredAffiliates = affiliates.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const totalPendingAmount = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
  const activeAffiliates = affiliates.filter(a => a.status === 'active').length;
  const totalReferrals = referrals.length;
  const convertedReferrals = referrals.filter(r => r.status === 'converted').length;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAffiliates}</p>
                <p className="text-sm text-muted-foreground">Afiliados Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total Indicações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{convertedReferrals}</p>
                <p className="text-sm text-muted-foreground">Conversões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">R$ {totalPendingAmount.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="affiliates" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
            <TabsTrigger value="withdrawals">
              Saques
              {pendingWithdrawals.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingWithdrawals.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="referrals">Indicações</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Afiliado
          </Button>
        </div>

        <TabsContent value="affiliates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Afiliados Cadastrados</CardTitle>
                  <CardDescription>Gerencie os afiliados do sistema</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar afiliado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Saldo Disponível</TableHead>
                    <TableHead className="text-right">Saldo Pendente</TableHead>
                    <TableHead className="text-right">Total Ganho</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell className="font-medium">{affiliate.name}</TableCell>
                      <TableCell>{affiliate.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">{affiliate.affiliate_code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(affiliate.affiliate_code)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={affiliate.status === 'active' ? 'default' : 'destructive'}>
                          {affiliate.status === 'active' ? 'Ativo' : 'Bloqueado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">R$ {Number(affiliate.available_balance).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">R$ {Number(affiliate.pending_balance).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">R$ {Number(affiliate.total_earnings).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAffiliate(affiliate);
                              setShowAffiliateDetailsModal(true);
                            }}
                            className="gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </Button>
                          <Button
                            variant={affiliate.status === 'active' ? 'destructive' : 'default'}
                            size="sm"
                            onClick={() => handleToggleStatus(affiliate)}
                          >
                            {affiliate.status === 'active' ? (
                              <>
                                <Ban className="w-3 h-3 mr-1" />Bloquear
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />Ativar
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAffiliates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum afiliado encontrado</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Saque</CardTitle>
              <CardDescription>Processe os saques dos afiliados via PIX</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Chave PIX</TableHead>
                    <TableHead>Tipo PIX</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">{getAffiliateName(withdrawal.affiliate_id)}</TableCell>
                      <TableCell className="font-medium text-green-600">R$ {Number(withdrawal.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs max-w-32 truncate">{withdrawal.pix_key}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(withdrawal.pix_key)}>
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="uppercase">{withdrawal.pix_type}</TableCell>
                      <TableCell>
                        <Badge variant={withdrawal.status === 'completed' ? 'default' : withdrawal.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {withdrawal.status === 'completed' && 'Aprovado'}
                          {withdrawal.status === 'rejected' && 'Rejeitado'}
                          {withdrawal.status === 'pending' && 'Pendente'}
                          {withdrawal.status === 'processing' && 'Processando'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(withdrawal.requested_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' && (
                          <Button size="sm" onClick={() => { setSelectedWithdrawal(withdrawal); setShowWithdrawalModal(true); }}>Processar</Button>
                        )}
                        {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                          <span className="text-xs text-destructive">{withdrawal.rejection_reason}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {withdrawals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma solicitação de saque</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Indicações</CardTitle>
              <CardDescription>Histórico de indicações e conversões</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Afiliado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell className="font-medium">{getAffiliateName(referral.affiliate_id)}</TableCell>
                      <TableCell>
                        <Badge variant={referral.status === 'converted' ? 'default' : referral.status === 'cancelled' ? 'destructive' : 'secondary'}>
                          {referral.status === 'pending' && 'Pendente'}
                          {referral.status === 'trial' && 'Trial'}
                          {referral.status === 'converted' && 'Convertido'}
                          {referral.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{referral.plan_name || '-'}</TableCell>
                      <TableCell className="text-right">{referral.plan_price ? `R$ ${Number(referral.plan_price).toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">{referral.commission_amount ? `R$ ${Number(referral.commission_amount).toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(referral.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                  {referrals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma indicação registrada</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Afiliado</DialogTitle>
            <DialogDescription>Preencha os dados do novo afiliado. Usuário, senha e código serão gerados automaticamente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="Nome do afiliado" value={newAffiliate.name} onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" value={newAffiliate.email} onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" placeholder="(11) 99999-9999" value={newAffiliate.whatsapp} onChange={(e) => setNewAffiliate({ ...newAffiliate, whatsapp: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateAffiliate} disabled={creating}>
              {creating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Criando...</> : <><Plus className="w-4 h-4 mr-2" />Criar Afiliado</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showCredentialsModal}
        onOpenChange={(open) => {
          setShowCredentialsModal(open);
          if (!open) setCreatedCredentials(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credenciais do Afiliado</DialogTitle>
            <DialogDescription>Copie e envie para o afiliado (login via email + senha).</DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Email</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">{createdCredentials.email}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(createdCredentials.email)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Senha</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">{createdCredentials.password}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(createdCredentials.password)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Código</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">{createdCredentials.affiliate_code}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(createdCredentials.affiliate_code)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCredentialsModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showWithdrawalModal} onOpenChange={setShowWithdrawalModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Processar Saque</DialogTitle>
            <DialogDescription>Confirme o pagamento PIX ou rejeite a solicitação.</DialogDescription>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Afiliado:</span>
                  <span className="font-medium">{getAffiliateName(selectedWithdrawal.affiliate_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-medium text-green-600">R$ {Number(selectedWithdrawal.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo PIX:</span>
                  <span className="font-medium uppercase">{selectedWithdrawal.pix_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Chave PIX:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-background px-2 py-1 rounded text-xs">{selectedWithdrawal.pix_key}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(selectedWithdrawal.pix_key)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection">Motivo da Rejeição (opcional)</Label>
                <Textarea id="rejection" placeholder="Informe o motivo caso rejeite o saque..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWithdrawalModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleProcessWithdrawal('rejected')} disabled={processing}>
              <XCircle className="w-4 h-4 mr-2" />Rejeitar
            </Button>
            <Button onClick={() => handleProcessWithdrawal('completed')} disabled={processing}>
              {processing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Aprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAffiliateDetailsModal} onOpenChange={setShowAffiliateDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Afiliado</DialogTitle>
            <DialogDescription>Informações e credenciais do afiliado selecionado.</DialogDescription>
          </DialogHeader>

          {selectedAffiliate && (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Nome</span>
                <span className="font-medium text-sm">{selectedAffiliate.name}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Email</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selectedAffiliate.email}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(selectedAffiliate.email)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Senha</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selectedAffiliate.password_hash}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(selectedAffiliate.password_hash)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Código</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-xs">{selectedAffiliate.affiliate_code}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(selectedAffiliate.affiliate_code)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <span className="font-medium text-sm">{selectedAffiliate.whatsapp}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={selectedAffiliate.status === 'active' ? 'default' : selectedAffiliate.status === 'blocked' ? 'destructive' : 'secondary'}>
                  {selectedAffiliate.status === 'active' ? 'Ativo' : selectedAffiliate.status === 'blocked' ? 'Bloqueado' : 'Pendente'}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowAffiliateDetailsModal(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AffiliateManager;
