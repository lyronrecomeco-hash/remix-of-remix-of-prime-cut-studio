-- Corrigir warnings de segurança: adicionar search_path às funções
CREATE OR REPLACE FUNCTION update_circuit_breaker_timestamp()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;