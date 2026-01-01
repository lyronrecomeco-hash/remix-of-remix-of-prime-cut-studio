import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Target,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  BarChart3,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GeneratedProposal {
  painPoints: string[];
  benefits: string[];
  roiAnalysis: {
    estimatedSavings: number;
    timeRecovery: number;
    revenueIncrease: number;
    paybackPeriod: number;
  };
  pricing: string | { plan: string; justification: string };
  personalizedPitch: string;
  nextSteps: string[];
}

interface ProposalData {
  id: string;
  company_name: string;
  contact_name: string | null;
  company_email: string | null;
  company_phone: string | null;
  generated_proposal: GeneratedProposal | null;
  proposal_value: number | null;
  created_at: string;
  affiliate: {
    name: string;
    whatsapp: string;
    email: string;
  } | null;
}

const ProposalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProposal();
  }, [slug]);

  const fetchProposal = async () => {
    if (!slug) {
      setError('Proposta não encontrada');
      setLoading(false);
      return;
    }

    try {
      // Search by company name slug
      const { data, error: fetchError } = await supabase
        .from('affiliate_proposals')
        .select(`
          *,
          affiliate:affiliates(name, whatsapp, email)
        `)
        .eq('questionnaire_completed', true)
        .not('generated_proposal', 'is', null);

      if (fetchError) throw fetchError;

      // Find proposal matching the slug
      const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
      const matchedProposal = data?.find(p => 
        p.company_name.toLowerCase().replace(/\s+/g, ' ').trim() === normalizedSlug ||
        p.company_name.toLowerCase().replace(/\s+/g, '-').trim() === slug.toLowerCase()
      ) as unknown as ProposalData | undefined;

      if (!matchedProposal) {
        setError('Proposta não encontrada');
        setLoading(false);
        return;
      }

      setProposal(matchedProposal);
    } catch (err) {
      console.error('Error fetching proposal:', err);
      setError('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPricingText = () => {
    if (!proposal?.generated_proposal?.pricing) return '';
    if (typeof proposal.generated_proposal.pricing === 'string') {
      return proposal.generated_proposal.pricing;
    }
    const pricingObj = proposal.generated_proposal.pricing as { plan: string; justification: string };
    return pricingObj.plan || '';
  };

  const getWhatsAppLink = () => {
    if (!proposal?.affiliate?.whatsapp) return '#';
    const phone = proposal.affiliate.whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá! Vi a proposta do Genesis Hub para ${proposal.company_name} e gostaria de saber mais.`);
    return `https://wa.me/${phone}?text=${message}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-white/70">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/5 border-white/10">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-white">Proposta não encontrada</h1>
            <p className="text-white/60">A proposta que você está procurando não existe ou foi removida.</p>
            <Button onClick={() => navigate('/')} variant="outline" className="mt-4">
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gen = proposal.generated_proposal;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-primary">GENESIS HUB</h2>
              <p className="text-xs text-white/50">Sistema de Gestão Inteligente</p>
            </div>
          </div>

          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            Proposta Comercial Personalizada
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {proposal.company_name}
          </h1>

          {proposal.contact_name && (
            <p className="text-xl text-white/70 mb-8">
              Preparado especialmente para <span className="text-primary font-semibold">{proposal.contact_name}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="gap-2" onClick={() => window.open(getWhatsAppLink(), '_blank')}>
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </Button>
            {proposal.affiliate?.email && (
              <Button size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
                <Mail className="w-5 h-5" />
                Enviar Email
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Pain Points Section */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-red-500/10 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Desafios Identificados</h2>
              <p className="text-white/60">Os principais pontos que impactam seu negócio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gen?.painPoints?.map((pain, index) => (
              <Card key={index} className="bg-red-500/5 border-red-500/20 hover:border-red-500/40 transition-colors">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-400 font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-white/80">{pain}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-24 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Como o Genesis Resolve</h2>
              <p className="text-white/60">Benefícios exclusivos para sua empresa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gen?.benefits?.map((benefit, index) => (
              <Card key={index} className="bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 transition-colors group">
                <CardContent className="p-5 flex items-start gap-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <p className="text-white/80">{benefit}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Análise de Retorno (ROI)</h2>
              <p className="text-white/60">Projeção de resultados com o Genesis</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-1">Economia Mensal</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-400">
                  {formatCurrency(gen?.roiAnalysis?.estimatedSavings || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-6 text-center">
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-1">Horas/Semana</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-400">
                  +{gen?.roiAnalysis?.timeRecovery || 0}h
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-6 text-center">
                <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-1">Aumento Receita</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-400">
                  +{gen?.roiAnalysis?.revenueIncrease || 0}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-1">Payback</p>
                <p className="text-2xl md:text-3xl font-bold text-amber-400">
                  {gen?.roiAnalysis?.paybackPeriod || 0} meses
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pitch Section */}
      <section className="py-16 md:py-24 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Nossa Proposta</h2>
                <p className="text-white/60">Solução personalizada para seu negócio</p>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-purple-500/10 to-primary/10 border-purple-500/20">
              <CardContent className="p-8">
                <p className="text-lg text-white/90 leading-relaxed whitespace-pre-line">
                  {gen?.personalizedPitch}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              Investimento
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Plano Recomendado
            </h2>
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
              <CardContent className="p-8">
                <p className="text-xl text-white/90 whitespace-pre-line">
                  {getPricingText()}
                </p>
                {proposal.proposal_value && proposal.proposal_value > 0 && (
                  <p className="text-4xl font-bold text-primary mt-6">
                    {formatCurrency(proposal.proposal_value)}/mês
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Next Steps Section */}
      <section className="py-16 md:py-24 bg-white/[0.02]">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white">Próximos Passos</h2>
              <p className="text-white/60">Como dar início a essa transformação</p>
            </div>
          </div>

          <div className="space-y-4 max-w-2xl">
            {gen?.nextSteps?.map((step, index) => (
              <Card key={index} className="bg-white/5 border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">{index + 1}</span>
                  </div>
                  <p className="text-white/80 flex-1">{step}</p>
                  <ArrowRight className="w-5 h-5 text-primary/50" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full" />
        
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Entre em contato agora e descubra como o Genesis Hub pode revolucionar a gestão da sua empresa.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="gap-2 text-lg px-8" onClick={() => window.open(getWhatsAppLink(), '_blank')}>
              <MessageCircle className="w-5 h-5" />
              Falar no WhatsApp
            </Button>
            {proposal.affiliate?.whatsapp && (
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 text-lg px-8 border-white/20 text-white hover:bg-white/10"
                onClick={() => window.open(`tel:${proposal.affiliate?.whatsapp}`, '_self')}
              >
                <Phone className="w-5 h-5" />
                Ligar Agora
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Genesis Hub</span>
          </div>
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} Genesis Hub. Todos os direitos reservados.
          </p>
          {proposal.affiliate?.name && (
            <p className="text-xs text-white/40 mt-2">
              Proposta apresentada por: {proposal.affiliate.name}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ProposalPage;