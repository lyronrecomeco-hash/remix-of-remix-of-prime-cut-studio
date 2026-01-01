import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Target,
  CheckCircle2,
  AlertCircle,
  Send,
  FileText,
  Sparkles,
  Loader2
} from 'lucide-react';
import { AffiliateProposal } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface ProposalViewerProps {
  proposal: AffiliateProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProposalUpdated: () => void;
}

export const ProposalViewer: React.FC<ProposalViewerProps> = ({
  proposal,
  open,
  onOpenChange,
  onProposalUpdated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const generatedProposal = proposal.generated_proposal as GeneratedProposal | null;
  const answers = proposal.questionnaire_answers as Array<{ question: string; answer: string }> | null;

  const handleGenerateProposal = async () => {
    if (!proposal.questionnaire_completed || !answers?.length) {
      toast.error('Complete o questionário antes de gerar a proposta');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-proposal', {
        body: {
          proposalId: proposal.id,
          companyName: proposal.company_name,
          niche: proposal.niche_id ? 'Personalizado' : 'Geral',
          answers: answers
        }
      });

      if (error) throw error;

      toast.success('Proposta gerada com sucesso!');
      onProposalUpdated();
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Erro ao gerar proposta');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendProposal = async () => {
    if (!generatedProposal) {
      toast.error('Gere a proposta antes de enviar');
      return;
    }

    if (!proposal.company_email) {
      toast.error('Email da empresa não informado. Edite a proposta e adicione o email.');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-proposal-email', {
        body: { proposalId: proposal.id }
      });

      if (error) throw error;

      toast.success('Proposta enviada por email com sucesso!');
      onProposalUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast.error('Erro ao enviar proposta por email');
    } finally {
      setIsSending(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Proposta - {proposal.company_name}
          </DialogTitle>
        </DialogHeader>

        {!proposal.questionnaire_completed ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Questionário não concluído</h3>
            <p className="text-muted-foreground">
              Complete o questionário para gerar a proposta personalizada.
            </p>
          </div>
        ) : !generatedProposal ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Pronto para gerar a proposta!</h3>
            <p className="text-muted-foreground mb-6">
              O questionário foi concluído. Clique abaixo para gerar a proposta com IA.
            </p>
            <Button onClick={handleGenerateProposal} disabled={isGenerating} size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando proposta...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Proposta com IA
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="roi">ROI</TabsTrigger>
                <TabsTrigger value="pitch">Pitch</TabsTrigger>
                <TabsTrigger value="next">Próximos Passos</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Pain Points */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      Dores Identificadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedProposal.painPoints?.map((pain, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-destructive mt-1">•</span>
                          {pain}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Benefícios do Genesis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedProposal.benefits?.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Pricing */}
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Recomendação de Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{generatedProposal.pricing}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="roi" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-emerald-500">
                          {formatCurrency(generatedProposal.roiAnalysis?.estimatedSavings || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Economia mensal estimada</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-blue-500">
                          {generatedProposal.roiAnalysis?.timeRecovery || 0}h
                        </p>
                        <p className="text-sm text-muted-foreground">Horas economizadas/semana</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold text-primary">
                          +{generatedProposal.roiAnalysis?.revenueIncrease || 0}%
                        </p>
                        <p className="text-sm text-muted-foreground">Potencial aumento receita</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Target className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-amber-500">
                          {generatedProposal.roiAnalysis?.paybackPeriod || 0} meses
                        </p>
                        <p className="text-sm text-muted-foreground">Período de retorno</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="pitch" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {generatedProposal.personalizedPitch}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="next" className="mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Próximos Passos para Fechamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {generatedProposal.nextSteps?.map((step, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <Badge variant="outline" className="shrink-0">
                            {index + 1}
                          </Badge>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            {proposal.status === 'draft' && (
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleGenerateProposal} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Regenerar
                </Button>
                <Button onClick={handleSendProposal} disabled={isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar Proposta
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
