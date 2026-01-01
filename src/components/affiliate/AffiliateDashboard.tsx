import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Users, 
  Copy, 
  Check,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  affiliate_code: string;
  commission_rate_monthly: number;
  commission_rate_lifetime: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
}

interface AffiliateDashboardProps {
  affiliate: Affiliate;
}

interface ProposalStats {
  total: number;
  accepted: number;
  totalValue: number;
  totalCommission: number;
}

const AffiliateDashboard = ({ affiliate }: AffiliateDashboardProps) => {
  const [copied, setCopied] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [referralsCount, setReferralsCount] = useState(0);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [proposalStats, setProposalStats] = useState<ProposalStats>({
    total: 0,
    accepted: 0,
    totalValue: 0,
    totalCommission: 0,
  });

  // Link direto para login ao invés do site comercial - rota correta
  const affiliateLink = `https://app.genesishub.cloud/admin/login?ref=${affiliate.affiliate_code}`;

  useEffect(() => {
    fetchStats();
    fetchProposalStats();
  }, [affiliate.id]);

  const fetchStats = async () => {
    try {
      // Buscar contagem de vendas confirmadas
      const { count: salesC } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_id', affiliate.id)
        .in('status', ['confirmed', 'paid']);

      setSalesCount(salesC || 0);

      // Buscar total de referências
      const { count: refsC } = await supabase
        .from('affiliate_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('affiliate_id', affiliate.id);

      setReferralsCount(refsC || 0);

      // Buscar vendas recentes
      const { data: recent } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentSales(recent || []);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchProposalStats = async () => {
    try {
      const { data: proposals } = await supabase
        .from('affiliate_proposals')
        .select('status, proposal_value, commission_amount')
        .eq('affiliate_id', affiliate.id);

      if (proposals) {
        const accepted = proposals.filter(p => p.status === 'accepted');
        setProposalStats({
          total: proposals.length,
          accepted: accepted.length,
          totalValue: accepted.reduce((sum, p) => sum + (p.proposal_value || 0), 0),
          totalCommission: accepted.reduce((sum, p) => sum + (p.commission_amount || 0), 0),
        });
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de propostas:', error);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const stats = [
    {
      title: 'Saldo Disponível',
      value: formatCurrency(affiliate.available_balance),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Saldo Pendente',
      value: formatCurrency(affiliate.pending_balance),
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Total Ganho',
      value: formatCurrency(affiliate.total_earnings),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Vendas Realizadas',
      value: salesCount.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
  ];

  const proposalStatsCards = [
    {
      title: 'Propostas Criadas',
      value: proposalStats.total.toString(),
      icon: Building2,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
    },
    {
      title: 'Propostas Aceitas',
      value: proposalStats.accepted.toString(),
      icon: Check,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Valor Fechado',
      value: formatCurrency(proposalStats.totalValue),
      icon: DollarSign,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      title: 'Comissão Propostas',
      value: formatCurrency(proposalStats.totalCommission),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-4 sm:p-6 rounded-xl border border-primary/20">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Bem-vindo, {affiliate.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Acompanhe suas vendas e comissões no painel abaixo.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="order-2 sm:order-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-lg sm:text-2xl font-bold mt-1 text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`order-1 sm:order-2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Proposal Stats - Modo Empresa */}
      {proposalStats.total > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Modo Empresa
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {proposalStatsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="order-2 sm:order-1">
                        <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-lg sm:text-2xl font-bold mt-1 text-foreground">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`order-1 sm:order-2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Affiliate Link */}
      <Card className="bg-card border-border">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-foreground">Seu Link de Afiliado</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col gap-3">
            <div className="bg-secondary/50 rounded-lg px-3 sm:px-4 py-3 font-mono text-xs sm:text-sm text-foreground break-all">
              {affiliateLink}
            </div>
            <Button
              onClick={copyLink}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Link
                </>
              )}
            </Button>
          </div>
          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Comissões:</span>{' '}
              <span className="text-primary font-bold">{affiliate.commission_rate_monthly}%</span> (Mensal) |{' '}
              <span className="text-primary font-bold">{affiliate.commission_rate_lifetime}%</span> (Vitalício)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              O link leva direto para a página de cadastro. Cookies válidos por 30 dias.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma venda registrada ainda.</p>
              <p className="text-sm mt-1">Compartilhe seu link para começar a ganhar!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {sale.plan_name || 'Cadastro'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">
                      {formatCurrency(sale.commission_amount || 0)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sale.status === 'confirmed' || sale.status === 'paid'
                        ? 'bg-green-500/20 text-green-500'
                        : sale.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {sale.status === 'pending' ? 'Pendente' :
                       sale.status === 'confirmed' ? 'Confirmado' :
                       sale.status === 'paid' ? 'Pago' : 'Cancelado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateDashboard;
