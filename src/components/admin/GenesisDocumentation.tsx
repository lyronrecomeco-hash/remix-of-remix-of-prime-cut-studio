import React, { useState } from 'react';
import { 
  Book, 
  Calendar, 
  Users, 
  Scissors, 
  DollarSign, 
  BarChart3, 
  Target, 
  Palmtree,
  Clock,
  Image,
  MessageSquare,
  Megaphone,
  AlertTriangle,
  Lock,
  Settings,
  Shield,
  MessageCircle,
  Webhook,
  Database,
  Bell,
  ChevronRight,
  Search,
  Home,
  Smartphone,
  Globe,
  Zap,
  CheckCircle,
  Info,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocSection {
  id: string;
  title: string;
  icon: React.ElementType;
  content: DocContent[];
}

interface DocContent {
  subtitle?: string;
  text?: string;
  list?: string[];
  tip?: string;
}

const documentationSections: DocSection[] = [
  {
    id: 'overview',
    title: 'Visão Geral',
    icon: Home,
    content: [
      {
        subtitle: 'Bem-vindo ao Genesis',
        text: 'O Genesis é um sistema completo de gestão para barbearias, projetado para otimizar todos os aspectos do seu negócio.',
      },
      {
        subtitle: 'Principais Recursos',
        text: 'O sistema oferece:',
        list: [
          'Gestão completa de agendamentos',
          'Controle financeiro detalhado',
          'Sistema de fila de espera inteligente',
          'Marketing automatizado via WhatsApp',
          'Dashboard com métricas em tempo real',
          'Gestão de barbeiros e serviços',
          'Sistema de feedbacks e avaliações',
          'Logs de auditoria para segurança'
        ]
      },
      {
        text: 'Navegue pelo menu lateral para acessar cada módulo do sistema.',
        tip: 'Use a barra de busca acima para encontrar rapidamente o que procura.'
      }
    ]
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Calendar,
    content: [
      {
        subtitle: 'Painel Principal',
        text: 'O Dashboard é sua central de controle, exibindo métricas importantes do dia e da semana.',
      },
      {
        subtitle: 'Métricas Disponíveis',
        text: 'Visualize em tempo real:',
        list: [
          'Agendamentos do dia',
          'Faturamento diário e semanal',
          'Taxa de ocupação dos barbeiros',
          'Próximos clientes na fila',
          'Alertas de sobrecarga'
        ]
      },
      {
        text: 'Clique nos cards para navegar diretamente para a seção correspondente.',
        tip: 'O Dashboard atualiza automaticamente a cada 60 segundos.'
      }
    ]
  },
  {
    id: 'agenda',
    title: 'Agenda',
    icon: Calendar,
    content: [
      {
        subtitle: 'Gestão de Agendamentos',
        text: 'Controle todos os agendamentos da sua barbearia em um único lugar.',
      },
      {
        subtitle: 'Funcionalidades',
        text: 'Na agenda você pode:',
        list: [
          'Visualizar agendamentos por data',
          'Filtrar por status (pendente, confirmado, concluído, cancelado)',
          'Confirmar, cancelar ou concluir atendimentos',
          'Ver detalhes do cliente e serviço',
          'Acompanhar o limite diário de agendamentos'
        ]
      },
      {
        subtitle: 'Status dos Agendamentos',
        text: 'Os agendamentos possuem os seguintes status:',
        list: [
          'Pendente: Aguardando confirmação',
          'Confirmado: Cliente confirmou presença',
          'Em Atendimento: Cliente está sendo atendido',
          'Concluído: Atendimento finalizado',
          'Cancelado: Agendamento cancelado'
        ],
        tip: 'Clientes recebem notificações automáticas a cada mudança de status.'
      }
    ]
  },
  {
    id: 'fila',
    title: 'Fila de Espera',
    icon: Users,
    content: [
      {
        subtitle: 'Sistema de Fila Inteligente',
        text: 'Gerencie clientes que chegam sem agendamento ou que precisam aguardar.',
      },
      {
        subtitle: 'Como Funciona',
        text: 'O sistema de fila permite:',
        list: [
          'Adicionar clientes à fila de espera',
          'Ver tempo estimado de espera',
          'Chamar próximo cliente automaticamente',
          'Marcar cliente como "a caminho"',
          'Notificar clientes via WhatsApp quando chegar a vez'
        ]
      },
      {
        text: 'Configure o tamanho máximo da fila nas Configurações.',
        tip: 'Clientes podem acompanhar sua posição na fila pelo celular.'
      }
    ]
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: DollarSign,
    content: [
      {
        subtitle: 'Dashboard Financeiro',
        text: 'Acompanhe toda a movimentação financeira da sua barbearia.',
      },
      {
        subtitle: 'Relatórios Disponíveis',
        text: 'Visualize:',
        list: [
          'Faturamento diário, semanal e mensal',
          'Comparativo com períodos anteriores',
          'Ticket médio por atendimento',
          'Receita por barbeiro',
          'Serviços mais rentáveis',
          'Gráficos de evolução'
        ]
      },
      {
        tip: 'Exporte relatórios em PDF para análise detalhada.'
      }
    ]
  },
  {
    id: 'desempenho',
    title: 'Desempenho',
    icon: BarChart3,
    content: [
      {
        subtitle: 'Análise de Performance',
        text: 'Monitore o desempenho individual de cada barbeiro.',
      },
      {
        subtitle: 'Métricas por Barbeiro',
        text: 'Acompanhe:',
        list: [
          'Total de atendimentos',
          'Taxa de conclusão',
          'Faturamento individual',
          'Avaliação média dos clientes',
          'Serviço mais executado',
          'Clientes novos vs recorrentes'
        ]
      },
      {
        tip: 'Use esses dados para bonificações e feedback da equipe.'
      }
    ]
  },
  {
    id: 'metas',
    title: 'Metas',
    icon: Target,
    content: [
      {
        subtitle: 'Sistema de Metas',
        text: 'Defina e acompanhe metas mensais para sua equipe.',
      },
      {
        subtitle: 'Tipos de Metas',
        text: 'Configure metas para:',
        list: [
          'Faturamento total',
          'Número de atendimentos',
          'Novos clientes',
          'Taxa de retorno de clientes',
          'Metas individuais por barbeiro'
        ]
      },
      {
        subtitle: 'Bonificações',
        text: 'Defina valores de bônus para metas atingidas e motive sua equipe.',
        tip: 'Metas claras aumentam a produtividade em até 25%.'
      }
    ]
  },
  {
    id: 'folgas',
    title: 'Folgas e Férias',
    icon: Palmtree,
    content: [
      {
        subtitle: 'Gestão de Ausências',
        text: 'Controle folgas, férias e afastamentos da equipe.',
      },
      {
        subtitle: 'Funcionalidades',
        text: 'O sistema permite:',
        list: [
          'Registrar folgas programadas',
          'Agendar férias com antecedência',
          'Bloquear horários automaticamente',
          'Aprovar ou recusar solicitações',
          'Histórico completo de ausências'
        ]
      },
      {
        tip: 'Clientes não conseguirão agendar com barbeiros em folga.'
      }
    ]
  },
  {
    id: 'horarios',
    title: 'Horários',
    icon: Clock,
    content: [
      {
        subtitle: 'Gestão de Horários',
        text: 'Configure horários de funcionamento e disponibilidade.',
      },
      {
        subtitle: 'Configurações',
        text: 'Defina:',
        list: [
          'Horário de abertura e fechamento',
          'Horário de almoço',
          'Dias de funcionamento',
          'Horários especiais por barbeiro',
          'Bloqueio de horários específicos'
        ]
      },
      {
        tip: 'Horários bloqueados não aparecem para agendamento online.'
      }
    ]
  },
  {
    id: 'servicos',
    title: 'Serviços',
    icon: Scissors,
    content: [
      {
        subtitle: 'Catálogo de Serviços',
        text: 'Gerencie todos os serviços oferecidos pela barbearia.',
      },
      {
        subtitle: 'Para cada serviço, defina',
        text: '',
        list: [
          'Nome e descrição',
          'Preço',
          'Duração estimada',
          'Ícone representativo',
          'Visibilidade (ativo/inativo)'
        ]
      },
      {
        tip: 'Serviços inativos não aparecem no agendamento online.'
      }
    ]
  },
  {
    id: 'galeria',
    title: 'Galeria',
    icon: Image,
    content: [
      {
        subtitle: 'Galeria de Fotos',
        text: 'Exiba seus melhores trabalhos no site.',
      },
      {
        subtitle: 'Gerenciamento',
        text: 'Você pode:',
        list: [
          'Fazer upload de imagens (máx 5MB)',
          'Adicionar imagens via URL',
          'Definir títulos e descrições',
          'Ordenar imagens',
          'Remover imagens antigas'
        ]
      },
      {
        tip: 'Use fotos de alta qualidade para impressionar clientes.'
      }
    ]
  },
  {
    id: 'feedbacks',
    title: 'Feedbacks',
    icon: MessageSquare,
    content: [
      {
        subtitle: 'Avaliações de Clientes',
        text: 'Receba e gerencie avaliações dos seus clientes.',
      },
      {
        subtitle: 'Funcionalidades',
        text: 'O sistema de feedbacks permite:',
        list: [
          'Receber avaliações de 1 a 5 estrelas',
          'Ler comentários dos clientes',
          'Publicar feedbacks no site',
          'Arquivar feedbacks antigos',
          'Copiar link de avaliação para enviar aos clientes'
        ]
      },
      {
        tip: 'Envie solicitação de avaliação após cada atendimento.'
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing',
    icon: Megaphone,
    content: [
      {
        subtitle: 'Campanhas de Marketing',
        text: 'Envie mensagens promocionais via WhatsApp.',
      },
      {
        subtitle: 'Recursos',
        text: 'O módulo de marketing oferece:',
        list: [
          'Criação de campanhas',
          'Importação de contatos',
          'Templates personalizados',
          'Agendamento de envios',
          'Geração de mensagens com IA',
          'Relatório de envios',
          'Proteção anti-spam integrada'
        ]
      },
      {
        subtitle: 'Configurações de Segurança',
        text: 'Proteja sua conta com:',
        list: [
          'Limite diário de mensagens',
          'Delay entre envios',
          'Horários permitidos para envio',
          'Warmup progressivo'
        ],
        tip: 'Respeite as políticas do WhatsApp para evitar bloqueios.'
      }
    ]
  },
  {
    id: 'logs',
    title: 'Logs de Auditoria',
    icon: AlertTriangle,
    content: [
      {
        subtitle: 'Rastreabilidade Total',
        text: 'Monitore todas as ações realizadas no sistema.',
      },
      {
        subtitle: 'O que é registrado',
        text: 'Os logs capturam:',
        list: [
          'Logins e logouts',
          'Criação e alteração de dados',
          'Exclusões',
          'Mudanças de status em agendamentos',
          'Alterações em serviços',
          'Ações na fila de espera'
        ]
      },
      {
        subtitle: 'Configuração',
        text: 'Em Configurações > Segurança, você pode ativar/desativar cada tipo de log.',
        tip: 'Os logs são essenciais para segurança e compliance.'
      }
    ]
  },
  {
    id: 'usuarios',
    title: 'Usuários',
    icon: Lock,
    content: [
      {
        subtitle: 'Gestão de Usuários',
        text: 'Controle quem tem acesso ao painel administrativo.',
      },
      {
        subtitle: 'Níveis de Acesso',
        text: 'O sistema possui três níveis:',
        list: [
          'Super Admin: Acesso total ao sistema',
          'Admin: Acesso administrativo sem gerenciar outros admins',
          'Barbeiro: Acesso limitado às suas informações'
        ]
      },
      {
        subtitle: 'Segurança',
        text: 'Para cada usuário você pode:',
        list: [
          'Definir data de expiração do acesso',
          'Ativar/desativar conta',
          'Resetar senha',
          'Ver histórico de logins'
        ],
        tip: 'Revogue acessos imediatamente ao desligar colaboradores.'
      }
    ]
  },
  {
    id: 'config',
    title: 'Configurações',
    icon: Settings,
    content: [
      {
        subtitle: 'Central de Configurações',
        text: 'Personalize todos os aspectos do sistema.',
      },
      {
        subtitle: 'Seções Disponíveis',
        text: '',
        list: [
          'Tema: Cores e aparência do sistema',
          'Barbearia: Nome, endereço, telefone',
          'Link Agendamento: URL exclusiva para clientes',
          'Segurança: 2FA, timeout, logs',
          'Redes Sociais: Instagram, Facebook, WhatsApp',
          'Backup: Exportar e importar dados',
          'Textos do Site: Personalizar conteúdo do site',
          'ChatPro: Integração com WhatsApp',
          'Templates: Mensagens automáticas',
          'API: Webhooks e integrações',
          'Menu Admin: Estilo do menu lateral'
        ]
      }
    ]
  },
  {
    id: 'integracao',
    title: 'Integrações',
    icon: Webhook,
    content: [
      {
        subtitle: 'Conecte com Outros Sistemas',
        text: 'O Genesis suporta diversas integrações.',
      },
      {
        subtitle: 'Integrações Disponíveis',
        text: '',
        list: [
          'ChatPro: Envio de mensagens via WhatsApp',
          'Webhooks: Notificações para sistemas externos',
          'Push Notifications: Alertas no navegador',
          'API REST: Para desenvolvedores'
        ]
      },
      {
        subtitle: 'Webhooks',
        text: 'Configure URLs para receber notificações quando eventos ocorrem:',
        list: [
          'Novo agendamento',
          'Agendamento confirmado',
          'Agendamento cancelado',
          'Atendimento concluído'
        ],
        tip: 'Webhooks permitem automações avançadas com outras ferramentas.'
      }
    ]
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    icon: Shield,
    content: [
      {
        subtitle: 'Proteção de Dados',
        text: 'O Genesis possui múltiplas camadas de segurança.',
      },
      {
        subtitle: 'Recursos de Segurança',
        text: '',
        list: [
          'Autenticação em duas etapas (2FA)',
          'Timeout automático de sessão',
          'Limite de tentativas de login',
          'Lista de IPs permitidos',
          'Exigência de senha forte',
          'Logs de auditoria completos',
          'Backup criptografado'
        ]
      },
      {
        subtitle: 'Alertas de Segurança',
        text: 'Receba notificações push para:',
        list: [
          'Novos logins',
          'Tentativas de login falhas',
          'Alterações em configurações críticas'
        ],
        tip: 'Ative alertas push para monitoramento em tempo real.'
      }
    ]
  },
  {
    id: 'mobile',
    title: 'App Mobile',
    icon: Smartphone,
    content: [
      {
        subtitle: 'Acesso pelo Celular',
        text: 'O Genesis é um PWA (Progressive Web App) totalmente responsivo.',
      },
      {
        subtitle: 'Como Instalar',
        text: '',
        list: [
          'Acesse o sistema pelo navegador do celular',
          'Toque em "Adicionar à tela inicial"',
          'O app será instalado como um ícone',
          'Use como um app nativo'
        ]
      },
      {
        subtitle: 'Recursos Mobile',
        text: '',
        list: [
          'Interface otimizada para toque',
          'Notificações push',
          'Funciona offline (modo limitado)',
          'Pull-to-refresh para atualizar dados'
        ],
        tip: 'Instale o app para acesso rápido e notificações.'
      }
    ]
  },
  {
    id: 'site',
    title: 'Site Público',
    icon: Globe,
    content: [
      {
        subtitle: 'Sua Presença Online',
        text: 'O Genesis inclui um site público profissional.',
      },
      {
        subtitle: 'Seções do Site',
        text: '',
        list: [
          'Hero: Banner principal com CTA',
          'Sobre: Descrição da barbearia',
          'Serviços: Catálogo com preços',
          'Galeria: Fotos dos trabalhos',
          'Depoimentos: Feedbacks dos clientes',
          'Localização: Mapa e endereço',
          'Rodapé: Redes sociais e contato'
        ]
      },
      {
        text: 'Personalize todos os textos em Configurações > Textos do Site.',
        tip: 'Um site bem configurado aumenta a confiança dos clientes.'
      }
    ]
  },
  {
    id: 'dicas',
    title: 'Dicas Rápidas',
    icon: Zap,
    content: [
      {
        subtitle: 'Maximize sua Produtividade',
        text: 'Aproveite ao máximo o sistema.',
      },
      {
        subtitle: 'Atalhos e Truques',
        text: '',
        list: [
          'Use o menu colapsável para mais espaço',
          'Ative notificações push para alertas',
          'Configure templates de mensagem com IA',
          'Faça backups semanais',
          'Monitore logs de auditoria regularmente',
          'Defina metas mensais para a equipe',
          'Use o link direto de agendamento para clientes VIP'
        ]
      },
      {
        subtitle: 'Boas Práticas',
        text: '',
        list: [
          'Confirme agendamentos no início do dia',
          'Responda feedbacks negativos rapidamente',
          'Mantenha a galeria atualizada',
          'Revise preços periodicamente',
          'Treine sua equipe no uso do sistema'
        ],
        tip: 'Consistência no uso do sistema gera melhores resultados.'
      }
    ]
  }
];

export default function GenesisDocumentation() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = searchQuery
    ? documentationSections.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.some(c => 
          c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.list?.some(l => l.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : documentationSections;

  const currentSection = documentationSections.find(s => s.id === activeSection);
  const currentIndex = documentationSections.findIndex(s => s.id === activeSection);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setActiveSection(documentationSections[currentIndex - 1].id);
    }
  };

  const goToNext = () => {
    if (currentIndex < documentationSections.length - 1) {
      setActiveSection(documentationSections[currentIndex + 1].id);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Book className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Documentação Genesis</h2>
            <p className="text-sm text-muted-foreground">Guia completo do sistema</p>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Sidebar - Index */}
        <div className="w-64 flex-shrink-0 flex flex-col min-h-0">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 h-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-4">
              {filteredSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSearchQuery('');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{section.title}</span>
                    {activeSection === section.id && (
                      <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4">
            {currentSection && (
              <div className="space-y-6 pb-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  {(() => {
                    const Icon = currentSection.icon;
                    return <Icon className="w-6 h-6 text-primary" />;
                  })()}
                  <h3 className="text-xl font-bold">{currentSection.title}</h3>
                </div>

                {currentSection.content.map((content, idx) => (
                  <div key={idx} className="space-y-3">
                    {content.subtitle && (
                      <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        {content.subtitle}
                      </h4>
                    )}

                    {content.text && (
                      <p className="text-muted-foreground leading-relaxed">
                        {content.text}
                      </p>
                    )}

                    {content.list && (
                      <ul className="space-y-2 ml-4">
                        {content.list.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {content.tip && (
                      <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-primary">
                          <strong>Dica:</strong> {content.tip}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} de {documentationSections.length}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex === documentationSections.length - 1}
              className="gap-2"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
