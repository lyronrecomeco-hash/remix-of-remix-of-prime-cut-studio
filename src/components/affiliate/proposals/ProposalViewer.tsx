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
  Loader2,
  Download
} from 'lucide-react';
import { AffiliateProposal } from './types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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

interface ProposalViewerProps {
  proposal: AffiliateProposal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProposalUpdated: () => void;
  autoSendEnabled?: boolean;
}

export const ProposalViewer: React.FC<ProposalViewerProps> = ({
  proposal,
  open,
  onOpenChange,
  onProposalUpdated,
  autoSendEnabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const generatedProposal = proposal.generated_proposal as GeneratedProposal | null;
  const answers = proposal.questionnaire_answers as Array<{ question: string; answer: string }> | null;

  // Helper to get pricing text regardless of format
  const getPricingText = () => {
    if (!generatedProposal?.pricing) return '';
    if (typeof generatedProposal.pricing === 'string') {
      return generatedProposal.pricing;
    }
    // Handle object format {plan, justification}
    const pricingObj = generatedProposal.pricing as { plan: string; justification: string };
    return `${pricingObj.plan || ''}\n\n${pricingObj.justification || ''}`;
  };

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

      // If auto-send is enabled, send immediately
      if (autoSendEnabled && proposal.company_email) {
        await handleSendProposal();
      }
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

  const handleDownloadPDF = async () => {
    if (!generatedProposal) return;
    
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, fontSize: number, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, contentWidth);
        lines.forEach((line: string) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = margin;
          }
          doc.text(line, margin, yPos);
          yPos += fontSize * 0.5;
        });
        yPos += 5;
      };

      // Header with gradient-like background
      doc.setFillColor(15, 82, 186); // Primary blue
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('GENESIS HUB', margin, 25);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Proposta Comercial Personalizada', margin, 35);
      
      yPos = 60;
      doc.setTextColor(0, 0, 0);

      // Company info
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, contentWidth, 25, 'F');
      yPos += 8;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Empresa: ${proposal.company_name}`, margin + 5, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      doc.text(`Data: ${dateStr}`, margin + 5, yPos);
      if (proposal.contact_name) {
        doc.text(`Contato: ${proposal.contact_name}`, margin + 80, yPos);
      }
      yPos += 20;

      // Pain Points Section
      doc.setFillColor(220, 53, 69); // Red accent
      doc.rect(margin, yPos, 3, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 53, 69);
      doc.text('Desafios Identificados', margin + 8, yPos + 9);
      yPos += 20;
      doc.setTextColor(0, 0, 0);

      generatedProposal.painPoints?.forEach((pain, index) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        addWrappedText(`• ${pain}`, 10);
      });
      yPos += 10;

      // Benefits Section
      doc.setFillColor(40, 167, 69); // Green accent
      doc.rect(margin, yPos, 3, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(40, 167, 69);
      doc.text('Benefícios do Genesis', margin + 8, yPos + 9);
      yPos += 20;
      doc.setTextColor(0, 0, 0);

      generatedProposal.benefits?.forEach((benefit, index) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        addWrappedText(`✓ ${benefit}`, 10);
      });
      yPos += 10;

      // ROI Section
      if (yPos > 200) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFillColor(15, 82, 186);
      doc.rect(margin, yPos, 3, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 82, 186);
      doc.text('Análise de Retorno (ROI)', margin + 8, yPos + 9);
      yPos += 20;
      doc.setTextColor(0, 0, 0);

      const roi = generatedProposal.roiAnalysis;
      if (roi) {
        // ROI Cards
        const cardWidth = (contentWidth - 10) / 2;
        doc.setFillColor(245, 245, 245);
        
        // Card 1 - Economia
        doc.rect(margin, yPos, cardWidth, 25, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Economia Mensal', margin + 5, yPos + 8);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 167, 69);
        doc.text(formatCurrency(roi.estimatedSavings || 0), margin + 5, yPos + 18);
        
        // Card 2 - Tempo
        doc.setTextColor(0, 0, 0);
        doc.rect(margin + cardWidth + 10, yPos, cardWidth, 25, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Horas Economizadas/Semana', margin + cardWidth + 15, yPos + 8);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 82, 186);
        doc.text(`${roi.timeRecovery || 0}h`, margin + cardWidth + 15, yPos + 18);
        
        yPos += 30;
        doc.setTextColor(0, 0, 0);
        
        // Card 3 - Receita
        doc.rect(margin, yPos, cardWidth, 25, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Potencial Aumento Receita', margin + 5, yPos + 8);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 82, 186);
        doc.text(`+${roi.revenueIncrease || 0}%`, margin + 5, yPos + 18);
        
        // Card 4 - Payback
        doc.setTextColor(0, 0, 0);
        doc.rect(margin + cardWidth + 10, yPos, cardWidth, 25, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Período de Retorno', margin + cardWidth + 15, yPos + 8);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 193, 7);
        doc.text(`${roi.paybackPeriod || 0} meses`, margin + cardWidth + 15, yPos + 18);
        
        yPos += 35;
        doc.setTextColor(0, 0, 0);
      }

      // Pitch Section
      if (yPos > 200) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFillColor(138, 43, 226); // Purple accent
      doc.rect(margin, yPos, 3, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(138, 43, 226);
      doc.text('Nossa Proposta', margin + 8, yPos + 9);
      yPos += 20;
      doc.setTextColor(0, 0, 0);

      addWrappedText(generatedProposal.personalizedPitch || '', 10);
      yPos += 10;

      // Pricing Section
      doc.setFillColor(15, 82, 186);
      doc.rect(margin, yPos, contentWidth, 30, 'F');
      yPos += 12;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Recomendação de Plano', margin + 5, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const pricingLines = doc.splitTextToSize(getPricingText(), contentWidth - 10);
      pricingLines.slice(0, 2).forEach((line: string) => {
        doc.text(line, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 15;
      doc.setTextColor(0, 0, 0);

      // Next Steps
      if (yPos > 220) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.setFillColor(255, 193, 7);
      doc.rect(margin, yPos, 3, 12, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 193, 7);
      doc.text('Próximos Passos', margin + 8, yPos + 9);
      yPos += 20;
      doc.setTextColor(0, 0, 0);

      generatedProposal.nextSteps?.forEach((step, index) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        addWrappedText(`${index + 1}. ${step}`, 10);
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(240, 240, 240);
        doc.rect(0, 280, pageWidth, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Genesis Hub - Sistema de Gestão Inteligente', margin, 288);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 20, 288);
      }

      doc.save(`Proposta_${proposal.company_name.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsDownloading(false);
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
                    <p className="text-sm whitespace-pre-line">{getPricingText()}</p>
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
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleDownloadPDF} 
                disabled={isDownloading}
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Baixar PDF
              </Button>
              
              {proposal.status === 'draft' && (
                <>
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
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
