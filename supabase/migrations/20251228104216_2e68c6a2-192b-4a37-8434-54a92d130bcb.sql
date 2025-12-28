-- Adicionar campos para botão e imagem nos templates de mensagem
ALTER TABLE public.message_templates
ADD COLUMN IF NOT EXISTS button_text text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS button_url text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Comentários explicativos
COMMENT ON COLUMN public.message_templates.button_text IS 'Texto do botão clicável (opcional)';
COMMENT ON COLUMN public.message_templates.button_url IS 'URL do botão clicável (opcional)';
COMMENT ON COLUMN public.message_templates.image_url IS 'URL da imagem a ser enviada junto com a mensagem (opcional)';