// Tipos para o Sistema de Propostas Empresariais - FASE 1 & 2

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'cancelled';

export interface AffiliateProposal {
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
  // Campos FASE 2
  niche_id: string | null;
  questionnaire_answers: unknown[] | null;
  questionnaire_completed: boolean | null;
  ai_analysis: unknown | null;
}

export interface CreateProposalData {
  company_name: string;
  company_email?: string;
  company_phone?: string;
  company_cnpj?: string;
  contact_name?: string;
  notes?: string;
}

export interface UpdateProposalData extends Partial<CreateProposalData> {
  status?: ProposalStatus;
}

export const statusConfig: Record<ProposalStatus, { label: string; color: string; bgColor: string }> = {
  draft: { 
    label: 'Em Elaboração', 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30' 
  },
  sent: { 
    label: 'Enviada', 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30' 
  },
  accepted: { 
    label: 'Aceita', 
    color: 'text-emerald-600', 
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' 
  },
  cancelled: { 
    label: 'Cancelada', 
    color: 'text-red-600', 
    bgColor: 'bg-red-100 dark:bg-red-900/30' 
  },
};
