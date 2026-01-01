import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  useProposals, 
  ProposalsList, 
  ProposalsStats, 
  CreateProposalModal,
  ProposalQuestionnaireModal,
  ProposalViewer,
  type AffiliateProposal,
} from './proposals';

interface AffiliateProposalsProps {
  affiliateId: string;
}

const AffiliateProposals = ({ affiliateId }: AffiliateProposalsProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [questionnaireProposal, setQuestionnaireProposal] = useState<AffiliateProposal | null>(null);
  const [viewerProposal, setViewerProposal] = useState<AffiliateProposal | null>(null);
  
  const {
    proposals,
    loading,
    creating,
    createProposal,
    updateProposal,
    deleteProposal,
    getStatsCounts,
    fetchProposals,
  } = useProposals(affiliateId);

  const stats = getStatsCounts();

  const handleQuestionnaireComplete = () => {
    fetchProposals();
    setQuestionnaireProposal(null);
  };

  const handleProposalUpdated = () => {
    fetchProposals();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Modo Empresa
          </h2>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie propostas para empresas interessadas
          </p>
        </div>

        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Proposta
        </Button>
      </div>

      {/* Stats */}
      <ProposalsStats stats={stats} />

      {/* Lista de Propostas */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Suas Propostas
        </h3>
        <ProposalsList
          proposals={proposals}
          loading={loading}
          onUpdate={updateProposal}
          onDelete={deleteProposal}
          onStartQuestionnaire={setQuestionnaireProposal}
          onViewProposal={setViewerProposal}
        />
      </div>

      {/* Modal de Criação */}
      <CreateProposalModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={createProposal}
        loading={creating}
      />

      {/* Modal do Questionário */}
      {questionnaireProposal && (
        <ProposalQuestionnaireModal
          open={!!questionnaireProposal}
          onClose={() => setQuestionnaireProposal(null)}
          proposal={questionnaireProposal}
          onComplete={handleQuestionnaireComplete}
        />
      )}

      {/* Visualizador de Proposta */}
      {viewerProposal && (
        <ProposalViewer
          proposal={viewerProposal}
          open={!!viewerProposal}
          onOpenChange={(open) => !open && setViewerProposal(null)}
          onProposalUpdated={handleProposalUpdated}
        />
      )}
    </div>
  );
};

export default AffiliateProposals;
