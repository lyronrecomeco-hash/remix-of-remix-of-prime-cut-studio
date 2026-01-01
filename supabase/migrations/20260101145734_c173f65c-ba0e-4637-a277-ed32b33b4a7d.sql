-- =====================================================
-- FASE 2: Seleção de Nicho + Questionário Inteligente
-- =====================================================

-- Tabela de Nichos disponíveis
CREATE TABLE public.business_niches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT, -- nome do ícone lucide
  base_questions JSONB NOT NULL DEFAULT '[]', -- perguntas base do nicho
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_business_niches_slug ON public.business_niches(slug);
CREATE INDEX idx_business_niches_active ON public.business_niches(is_active);

-- RLS
ALTER TABLE public.business_niches ENABLE ROW LEVEL SECURITY;

-- Nichos são públicos para leitura (afiliados precisam ver)
CREATE POLICY "Anyone can view active niches"
ON public.business_niches
FOR SELECT
USING (is_active = true);

-- Owner gerencia nichos
CREATE POLICY "Owner can manage niches"
ON public.business_niches
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Adicionar campos de nicho e questionário na tabela de propostas
ALTER TABLE public.affiliate_proposals
ADD COLUMN niche_id UUID REFERENCES public.business_niches(id),
ADD COLUMN questionnaire_answers JSONB DEFAULT '[]',
ADD COLUMN questionnaire_completed BOOLEAN DEFAULT false,
ADD COLUMN ai_analysis JSONB DEFAULT NULL;

-- Índice para busca por nicho
CREATE INDEX idx_affiliate_proposals_niche ON public.affiliate_proposals(niche_id);

-- Tabela para histórico de conversas do questionário (IA)
CREATE TABLE public.proposal_questionnaire_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.affiliate_proposals(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  ai_follow_up TEXT, -- pergunta de follow-up gerada pela IA
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_questionnaire_history_proposal ON public.proposal_questionnaire_history(proposal_id);

-- RLS
ALTER TABLE public.proposal_questionnaire_history ENABLE ROW LEVEL SECURITY;

-- Afiliados podem ver/gerenciar histórico de suas propostas
CREATE POLICY "Affiliates can manage own questionnaire history"
ON public.proposal_questionnaire_history
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.affiliate_proposals p
    WHERE p.id = proposal_id
    AND p.affiliate_id = get_affiliate_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.affiliate_proposals p
    WHERE p.id = proposal_id
    AND p.affiliate_id = get_affiliate_id(auth.uid())
  )
);

-- Owner pode ver tudo
CREATE POLICY "Owner can manage all questionnaire history"
ON public.proposal_questionnaire_history
FOR ALL
USING (is_owner(auth.uid()))
WITH CHECK (is_owner(auth.uid()));

-- Inserir nichos iniciais
INSERT INTO public.business_niches (name, slug, description, icon, display_order, base_questions) VALUES
(
  'Barbearia',
  'barbearia',
  'Barbearias, salões masculinos e estúdios de barba',
  'Scissors',
  1,
  '[
    {"id": "q1", "question": "Quantos profissionais trabalham na sua barbearia?", "type": "select", "options": ["1-2", "3-5", "6-10", "Mais de 10"]},
    {"id": "q2", "question": "Você já usa algum sistema de agendamento?", "type": "select", "options": ["Não, uso papel/WhatsApp", "Sim, mas é básico", "Sim, completo"]},
    {"id": "q3", "question": "Qual seu maior desafio hoje?", "type": "text"},
    {"id": "q4", "question": "Quantos clientes você atende por semana aproximadamente?", "type": "select", "options": ["Menos de 50", "50-100", "100-200", "Mais de 200"]},
    {"id": "q5", "question": "Você faz marketing digital atualmente?", "type": "select", "options": ["Não faço", "Só Instagram/Facebook", "Faço campanhas pagas", "Tenho equipe de marketing"]}
  ]'::jsonb
),
(
  'Clínica Estética',
  'clinica-estetica',
  'Clínicas de estética, spa e tratamentos de beleza',
  'Sparkles',
  2,
  '[
    {"id": "q1", "question": "Quantos profissionais atendem na clínica?", "type": "select", "options": ["1-3", "4-8", "9-15", "Mais de 15"]},
    {"id": "q2", "question": "Quais tipos de procedimentos vocês oferecem?", "type": "multiselect", "options": ["Faciais", "Corporais", "Depilação", "Massagem", "Outros"]},
    {"id": "q3", "question": "Como você gerencia seus agendamentos hoje?", "type": "text"},
    {"id": "q4", "question": "Qual o ticket médio por cliente?", "type": "select", "options": ["Até R$100", "R$100-300", "R$300-500", "Acima de R$500"]},
    {"id": "q5", "question": "Você tem dificuldade em fidelizar clientes?", "type": "select", "options": ["Sim, muito", "Um pouco", "Não, tenho boa fidelização"]}
  ]'::jsonb
),
(
  'Consultório Médico',
  'consultorio-medico',
  'Consultórios médicos, clínicas e especialidades',
  'Stethoscope',
  3,
  '[
    {"id": "q1", "question": "Qual a especialidade principal do consultório?", "type": "text"},
    {"id": "q2", "question": "Quantos médicos atendem no local?", "type": "select", "options": ["1", "2-3", "4-6", "Mais de 6"]},
    {"id": "q3", "question": "Vocês trabalham com convênios?", "type": "select", "options": ["Não, só particular", "Sim, alguns", "Sim, vários"]},
    {"id": "q4", "question": "Como é feito o agendamento hoje?", "type": "text"},
    {"id": "q5", "question": "Qual seu maior problema com gestão de pacientes?", "type": "text"}
  ]'::jsonb
),
(
  'Academia/Fitness',
  'academia',
  'Academias, estúdios de pilates, crossfit e personal trainers',
  'Dumbbell',
  4,
  '[
    {"id": "q1", "question": "Qual o tamanho da sua academia?", "type": "select", "options": ["Pequena (até 100 alunos)", "Média (100-300)", "Grande (300-500)", "Muito grande (500+)"]},
    {"id": "q2", "question": "Vocês oferecem aulas em grupo?", "type": "select", "options": ["Não", "Sim, poucas", "Sim, várias modalidades"]},
    {"id": "q3", "question": "Como você controla a frequência dos alunos?", "type": "text"},
    {"id": "q4", "question": "Qual seu maior desafio com retenção de alunos?", "type": "text"},
    {"id": "q5", "question": "Você usa algum app para seus alunos?", "type": "select", "options": ["Não uso", "Sim, básico", "Sim, completo"]}
  ]'::jsonb
),
(
  'Restaurante/Food Service',
  'restaurante',
  'Restaurantes, lanchonetes, cafeterias e delivery',
  'UtensilsCrossed',
  5,
  '[
    {"id": "q1", "question": "Qual o tipo do seu estabelecimento?", "type": "select", "options": ["Restaurante à la carte", "Self-service", "Fast food", "Delivery", "Cafeteria"]},
    {"id": "q2", "question": "Quantas mesas/lugares você tem?", "type": "select", "options": ["Até 20", "20-50", "50-100", "Mais de 100", "Só delivery"]},
    {"id": "q3", "question": "Você trabalha com delivery próprio?", "type": "select", "options": ["Não faço delivery", "Só iFood/Rappi", "Tenho entregadores próprios", "Ambos"]},
    {"id": "q4", "question": "Qual seu maior problema operacional hoje?", "type": "text"},
    {"id": "q5", "question": "Você tem controle de estoque eficiente?", "type": "select", "options": ["Não tenho", "Faço manual", "Tenho sistema"]}
  ]'::jsonb
),
(
  'Escritório/Serviços',
  'escritorio',
  'Escritórios de advocacia, contabilidade, arquitetura e consultoria',
  'Briefcase',
  6,
  '[
    {"id": "q1", "question": "Qual o segmento do seu escritório?", "type": "select", "options": ["Advocacia", "Contabilidade", "Arquitetura", "Consultoria", "Outro"]},
    {"id": "q2", "question": "Quantos profissionais trabalham no escritório?", "type": "select", "options": ["1-3", "4-10", "11-20", "Mais de 20"]},
    {"id": "q3", "question": "Como você gerencia seus projetos/casos?", "type": "text"},
    {"id": "q4", "question": "Você tem dificuldade em captar novos clientes?", "type": "select", "options": ["Sim, muito", "Um pouco", "Não, tenho bom fluxo"]},
    {"id": "q5", "question": "Qual ferramenta você mais usa no dia a dia?", "type": "text"}
  ]'::jsonb
);