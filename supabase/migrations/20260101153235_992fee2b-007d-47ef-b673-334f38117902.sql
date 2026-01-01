-- FASE 6: Campos de Valor e Comissão para Propostas

-- Adicionar campos de valor e comissão
ALTER TABLE public.affiliate_proposals
ADD COLUMN IF NOT EXISTS proposal_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 30,
ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS commission_paid_at timestamptz;

-- Criar função para calcular comissão automaticamente quando proposta é aceita
CREATE OR REPLACE FUNCTION public.calculate_proposal_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando status muda para 'accepted', calcular comissão
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Buscar taxa de comissão do afiliado ou usar default
    SELECT COALESCE(commission_rate_monthly, 30) INTO NEW.commission_rate
    FROM public.affiliates 
    WHERE id = NEW.affiliate_id;
    
    -- Calcular valor da comissão
    NEW.commission_amount := (NEW.proposal_value * NEW.commission_rate) / 100;
    NEW.accepted_at := NOW();
    
    -- Atualizar saldo pendente do afiliado
    UPDATE public.affiliates
    SET pending_balance = pending_balance + NEW.commission_amount,
        total_earnings = total_earnings + NEW.commission_amount,
        updated_at = NOW()
    WHERE id = NEW.affiliate_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_calculate_proposal_commission ON public.affiliate_proposals;
CREATE TRIGGER trigger_calculate_proposal_commission
  BEFORE UPDATE ON public.affiliate_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_proposal_commission();

-- Função para marcar comissão como paga
CREATE OR REPLACE FUNCTION public.pay_proposal_commission(proposal_id uuid)
RETURNS boolean AS $$
DECLARE
  v_affiliate_id uuid;
  v_commission numeric;
BEGIN
  -- Buscar dados da proposta
  SELECT affiliate_id, commission_amount INTO v_affiliate_id, v_commission
  FROM public.affiliate_proposals
  WHERE id = proposal_id 
    AND status = 'accepted' 
    AND commission_paid = false;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Marcar como paga
  UPDATE public.affiliate_proposals
  SET commission_paid = true,
      commission_paid_at = NOW()
  WHERE id = proposal_id;
  
  -- Mover de pendente para disponível
  UPDATE public.affiliates
  SET pending_balance = pending_balance - v_commission,
      available_balance = available_balance + v_commission,
      updated_at = NOW()
  WHERE id = v_affiliate_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;