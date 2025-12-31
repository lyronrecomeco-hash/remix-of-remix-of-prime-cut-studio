import { useState } from 'react';
import { 
  HelpCircle, 
  X,
  DollarSign,
  Clock,
  Gift,
  CheckCircle,
  AlertCircle,
  Percent,
  TrendingUp,
  Users,
  Wallet,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface HowItWorksModalProps {
  commissionMonthly: number;
  commissionLifetime: number;
}

const HowItWorksModal = ({ commissionMonthly, commissionLifetime }: HowItWorksModalProps) => {
  const [open, setOpen] = useState(false);

  const steps = [
    {
      icon: Users,
      title: 'Compartilhe seu link',
      description: 'Use seu link exclusivo de afiliado para indicar novos usuários. Você pode compartilhar em redes sociais, WhatsApp, e-mail ou qualquer canal.'
    },
    {
      icon: CheckCircle,
      title: 'Usuário se cadastra',
      description: 'Quando alguém clica no seu link e realiza o cadastro, o sistema automaticamente vincula essa pessoa à sua conta de afiliado.'
    },
    {
      icon: DollarSign,
      title: 'Receba comissões',
      description: 'A cada pagamento realizado pelos usuários que você indicou, você recebe uma comissão diretamente no seu saldo.'
    },
    {
      icon: Wallet,
      title: 'Solicite o saque',
      description: 'Com saldo mínimo de R$ 50, você pode solicitar a transferência via PIX. O processamento leva até 3 dias úteis.'
    }
  ];

  const commissionRules = [
    {
      icon: Calendar,
      title: 'Comissão Mensal',
      value: `${commissionMonthly}%`,
      description: 'Sobre cada pagamento mensal dos usuários que você indicou'
    },
    {
      icon: Gift,
      title: 'Comissão Vitalícia',
      value: `${commissionLifetime}%`,
      description: 'Sobre planos vitalícios adquiridos pelos seus indicados'
    }
  ];

  const rules = [
    'Comissões são creditadas após 7 dias da confirmação do pagamento',
    'Saques mínimos de R$ 50,00 via PIX',
    'Prazo de processamento de até 3 dias úteis',
    'Cookies de rastreamento válidos por 30 dias',
    'Não é permitido usar o próprio link para se beneficiar',
    'Contas fraudulentas serão bloqueadas sem direito a saque'
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-border hover:bg-primary hover:text-primary-foreground">
          <HelpCircle className="w-4 h-4" />
          Como Funciona
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Como Funciona o Programa de Afiliados
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Passos */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Passo a Passo</h3>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex gap-4 p-4 bg-secondary/30 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{index + 1}. {step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comissões */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Suas Comissões
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {commissionRules.map((rule, index) => {
                const Icon = rule.icon;
                return (
                  <div key={index} className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{rule.title}</span>
                    </div>
                    <p className="text-3xl font-bold text-primary">{rule.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Regras */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Regras Importantes
            </h3>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <ul className="space-y-2">
                {rules.map((rule, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Prazo de Saque */}
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-500" />
              <div>
                <h4 className="font-semibold text-foreground">Prazo de Processamento</h4>
                <p className="text-sm text-muted-foreground">
                  Saques são processados em até <strong className="text-green-500">3 dias úteis</strong> após a solicitação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksModal;
