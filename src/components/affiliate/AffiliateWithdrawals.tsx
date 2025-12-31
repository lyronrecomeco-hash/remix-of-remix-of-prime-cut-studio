import { useState, useEffect } from 'react';
import { Wallet, Clock, Check, X, AlertCircle, Plus, User, CreditCard, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Affiliate {
  id: string;
  name: string;
  available_balance: number;
  pix_key: string | null;
  pix_type: string | null;
}

interface AffiliateWithdrawalsProps {
  affiliate: Affiliate;
  onRefresh: () => void;
}

interface Withdrawal {
  id: string;
  amount: number;
  pix_key: string;
  pix_type: string;
  status: string;
  rejection_reason: string | null;
  requested_at: string;
  processed_at: string | null;
}

const MINIMUM_WITHDRAWAL = 50;

const AffiliateWithdrawals = ({ affiliate, onRefresh }: AffiliateWithdrawalsProps) => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form fields
  const [fullName, setFullName] = useState(affiliate.name || '');
  const [cpf, setCpf] = useState('');
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState(affiliate.pix_key || '');
  const [pixType, setPixType] = useState(affiliate.pix_type || 'cpf');

  useEffect(() => {
    fetchWithdrawals();
  }, [affiliate.id]);

  const fetchWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_withdrawals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Erro ao buscar saques:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    return value;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountValue = parseFloat(amount);
    
    if (!fullName.trim()) {
      toast.error('Informe seu nome completo');
      return;
    }

    if (!cpf.trim() || cpf.replace(/\D/g, '').length !== 11) {
      toast.error('Informe um CPF válido');
      return;
    }
    
    if (amountValue < MINIMUM_WITHDRAWAL) {
      toast.error(`Valor mínimo para saque é R$ ${MINIMUM_WITHDRAWAL},00`);
      return;
    }

    if (amountValue > affiliate.available_balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!pixKey.trim()) {
      toast.error('Informe a chave PIX');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('affiliate_withdrawals')
        .insert({
          affiliate_id: affiliate.id,
          amount: amountValue,
          pix_key: pixKey.trim(),
          pix_type: pixType as any,
        });

      if (error) throw error;

      toast.success('Solicitação de saque enviada com sucesso!');
      setDialogOpen(false);
      setAmount('');
      setCpf('');
      fetchWithdrawals();
      onRefresh();
    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      toast.error('Erro ao solicitar saque');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { icon: Clock, label: 'Pendente', class: 'bg-yellow-500/20 text-yellow-500' },
      processing: { icon: Clock, label: 'Processando', class: 'bg-blue-500/20 text-blue-500' },
      completed: { icon: Check, label: 'Pago', class: 'bg-green-500/20 text-green-500' },
      rejected: { icon: X, label: 'Rejeitado', class: 'bg-red-500/20 text-red-500' }
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${config.class}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getPixTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      email: 'E-mail',
      phone: 'Telefone',
      random: 'Chave Aleatória'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Saques</h2>
          <p className="text-muted-foreground mt-1 text-sm">Solicite e acompanhe seus saques</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
              disabled={affiliate.available_balance < MINIMUM_WITHDRAWAL}
            >
              <Plus className="w-4 h-4 mr-2" />
              Solicitar Saque
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Solicitar Saque
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Saldo Disponível */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(affiliate.available_balance)}
                </p>
              </div>

              {/* Nome Completo */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nome Completo
                </Label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="bg-input border-border"
                  required
                />
              </div>

              {/* CPF */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  CPF
                </Label>
                <Input
                  type="text"
                  value={cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="bg-input border-border"
                  maxLength={14}
                  required
                />
              </div>

              {/* Valor do Saque */}
              <div className="space-y-2">
                <Label className="text-foreground">Valor do Saque</Label>
                <Input
                  type="number"
                  min={MINIMUM_WITHDRAWAL}
                  max={affiliate.available_balance}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Mínimo R$ ${MINIMUM_WITHDRAWAL},00`}
                  className="bg-input border-border"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Valor mínimo: R$ {MINIMUM_WITHDRAWAL},00
                </p>
              </div>

              {/* Tipo de Chave PIX */}
              <div className="space-y-2">
                <Label className="text-foreground">Tipo de Chave PIX</Label>
                <Select value={pixType} onValueChange={setPixType}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="phone">Telefone</SelectItem>
                    <SelectItem value="random">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Chave PIX */}
              <div className="space-y-2">
                <Label className="text-foreground">Chave PIX</Label>
                <Input
                  type="text"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="Sua chave PIX"
                  className="bg-input border-border"
                  required
                />
              </div>

              {/* Aviso de Prazo */}
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-500">Prazo de Processamento</p>
                  <p className="text-muted-foreground mt-1">
                    O saque pode levar até <strong>3 dias úteis</strong> para ser processado e transferido para sua conta.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {submitting ? 'Solicitando...' : 'Confirmar Saque'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Saldo Disponível para Saque</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">
                {formatCurrency(affiliate.available_balance)}
              </p>
            </div>
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
          </div>
          {affiliate.available_balance < MINIMUM_WITHDRAWAL && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-500">
                Saldo mínimo de R$ {MINIMUM_WITHDRAWAL},00 necessário para saque
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawals History */}
      <Card className="bg-card border-border">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Saques
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum saque solicitado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[500px] px-4 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Data</TableHead>
                      <TableHead className="text-muted-foreground">Valor</TableHead>
                      <TableHead className="text-muted-foreground">PIX</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id} className="border-border">
                        <TableCell className="text-foreground text-sm">
                          {formatDate(withdrawal.requested_at)}
                        </TableCell>
                        <TableCell className="text-foreground font-bold">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="text-foreground">
                          <div>
                            <p className="font-medium text-sm">{getPixTypeLabel(withdrawal.pix_type)}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">{withdrawal.pix_key}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {getStatusBadge(withdrawal.status)}
                            {withdrawal.rejection_reason && (
                              <p className="text-xs text-red-500 mt-1">
                                {withdrawal.rejection_reason}
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateWithdrawals;
