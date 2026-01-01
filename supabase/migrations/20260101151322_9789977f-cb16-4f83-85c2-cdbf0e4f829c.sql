-- FASE 3: Adicionar campos para proposta gerada

-- Adicionar campos de proposta gerada na tabela affiliate_proposals
ALTER TABLE public.affiliate_proposals
ADD COLUMN IF NOT EXISTS generated_proposal jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS proposal_generated_at timestamptz DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.affiliate_proposals.generated_proposal IS 'Proposta gerada pela IA com ROI, benefícios e pricing';
COMMENT ON COLUMN public.affiliate_proposals.proposal_generated_at IS 'Data/hora da geração da proposta';