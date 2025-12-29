import React, { useState } from 'react';
import { 
  Book, 
  Shield,
  Megaphone,
  Webhook,
  Bell,
  ChevronRight,
  Search,
  Smartphone,
  Zap,
  Info,
  ArrowLeft,
  ArrowRight,
  Key,
  AlertTriangle,
  Users,
  HelpCircle
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
  warning?: string;
}

const documentationSections: DocSection[] = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros Passos',
    icon: Zap,
    content: [
      {
        subtitle: 'Configuração Inicial Obrigatória',
        text: 'Antes de começar a usar o sistema, você precisa configurar:',
        list: [
          'Dados da Barbearia: Nome, endereço, telefone e WhatsApp em Configurações > Barbearia',
          'Horários de Funcionamento: Defina dias e horários em Configurações > Horários',
          'Serviços: Cadastre seus serviços com preços e duração em Serviços',
          'Barbeiros: Adicione sua equipe com fotos e especialidades'
        ],
        tip: 'Sem essas configurações, o agendamento online não funcionará corretamente.'
      },
      {
        subtitle: 'Ordem Recomendada',
        list: [
          '1. Configure dados da barbearia',
          '2. Defina horários de funcionamento',
          '3. Cadastre serviços',
          '4. Adicione barbeiros',
          '5. Configure horários individuais dos barbeiros',
          '6. Teste um agendamento pelo site público'
        ]
      }
    ]
  },
  {
    id: 'whatsapp',
    title: 'Integração WhatsApp',
    icon: Megaphone,
    content: [
      {
        subtitle: 'Como Configurar o ChatPro',
        text: 'O ChatPro permite enviar mensagens automáticas aos clientes. Para ativar:',
        list: [
          '1. Acesse Configurações > ChatPro',
          '2. Insira o Instance ID (fornecido pelo ChatPro)',
          '3. Insira o Token da API',
          '4. Defina o endpoint base (geralmente: https://api.chatpro.com.br)',
          '5. Clique em Salvar e teste a conexão'
        ],
        warning: 'O número do WhatsApp deve estar conectado ao ChatPro antes de configurar aqui.'
      },
      {
        subtitle: 'Mensagens Automáticas',
        text: 'Configure templates em Configurações > Templates de Mensagens:',
        list: [
          'Confirmação de Agendamento: Enviada quando cliente agenda',
          'Lembrete: Enviada X horas antes do horário',
          'Chamada da Fila: Quando chega a vez do cliente',
          'Agradecimento: Após conclusão do atendimento'
        ],
        tip: 'Use as variáveis {nome}, {data}, {hora}, {servico}, {barbeiro} nos templates.'
      },
      {
        subtitle: 'Proteção Anti-Bloqueio',
        text: 'Para evitar que o WhatsApp bloqueie seu número:',
        list: [
          'Mantenha delay entre mensagens (mínimo 10 segundos)',
          'Use warmup progressivo para contas novas',
          'Respeite os limites diários configurados',
          'Envie apenas em horários comerciais',
          'Evite mensagens muito longas ou com muitos links'
        ],
        warning: 'Ignorar essas regras pode resultar em bloqueio permanente do número!'
      }
    ]
  },
  {
    id: 'marketing',
    title: 'Campanhas de Marketing',
    icon: Megaphone,
    content: [
      {
        subtitle: 'Enviando Campanhas em Massa',
        text: 'Para criar uma campanha:',
        list: [
          '1. Acesse a aba Marketing',
          '2. Clique em "Nova Campanha"',
          '3. Importe contatos (CSV ou base de clientes)',
          '4. Escreva a mensagem ou use IA para gerar',
          '5. Agende ou envie imediatamente'
        ]
      },
      {
        subtitle: 'Limites de Segurança',
        text: 'Configurações importantes em Marketing > Configurações:',
        list: [
          'Limite diário: Máximo de mensagens por dia',
          'Delay mínimo/máximo: Tempo entre cada envio',
          'Horário permitido: Janela de envio (ex: 8h às 20h)',
          'Pausa automática: A cada X mensagens, pausa Y segundos',
          'Warmup: Aumenta limite gradualmente para contas novas'
        ],
        tip: 'Comece com limite baixo (50/dia) e aumente gradualmente.'
      }
    ]
  },
  {
    id: 'seguranca',
    title: 'Segurança do Sistema',
    icon: Shield,
    content: [
      {
        subtitle: 'Níveis de Acesso',
        text: 'O sistema possui três perfis de usuário:',
        list: [
          'Super Admin: Acesso total, pode gerenciar outros admins',
          'Admin: Acesso administrativo, não gerencia usuários',
          'Barbeiro: Vê apenas seus próprios dados e agenda'
        ],
        warning: 'Somente Super Admins podem criar ou remover outros usuários.'
      },
      {
        subtitle: 'Configurações de Segurança',
        text: 'Em Configurações > Segurança você encontra:',
        list: [
          'Timeout de Sessão: Tempo até deslogar automaticamente',
          'Tentativas de Login: Máximo antes de bloquear temporariamente',
          'Logs de Auditoria: Registra todas as ações do sistema',
          'Lista de IPs: Restringe acesso a IPs específicos (opcional)'
        ]
      },
      {
        subtitle: 'Logs de Auditoria',
        text: 'Os logs registram automaticamente:',
        list: [
          'Logins e tentativas falhas',
          'Criação, edição e exclusão de dados',
          'Mudanças de status em agendamentos',
          'Alterações em configurações'
        ],
        tip: 'Revise os logs periodicamente para detectar atividades suspeitas.'
      }
    ]
  },
  {
    id: 'usuarios',
    title: 'Gestão de Usuários',
    icon: Users,
    content: [
      {
        subtitle: 'Criando Novos Usuários',
        text: 'Para adicionar um novo usuário ao sistema:',
        list: [
          '1. Acesse Configurações > Usuários',
          '2. Clique em "Novo Usuário"',
          '3. Preencha email, nome e senha temporária',
          '4. Selecione o nível de acesso',
          '5. Defina data de expiração (opcional)'
        ]
      },
      {
        subtitle: 'Data de Expiração',
        text: 'Útil para acessos temporários:',
        list: [
          'Barbeiros em período de experiência',
          'Consultores externos',
          'Acessos de demonstração'
        ],
        tip: 'Após expirar, o usuário não consegue mais fazer login.'
      },
      {
        subtitle: 'Desativando Usuários',
        text: 'Para revogar acesso sem excluir o histórico:',
        list: [
          'Clique no botão de desativar na lista de usuários',
          'O usuário perde acesso imediatamente',
          'Dados e histórico são preservados',
          'Pode ser reativado posteriormente'
        ],
        warning: 'Sempre desative usuários ao desligar colaboradores!'
      }
    ]
  },
  {
    id: 'webhooks',
    title: 'Webhooks e Integrações',
    icon: Webhook,
    content: [
      {
        subtitle: 'O que são Webhooks?',
        text: 'Webhooks enviam dados automaticamente para outros sistemas quando eventos ocorrem no Genesis.',
      },
      {
        subtitle: 'Eventos Disponíveis',
        text: 'Você pode configurar webhooks para:',
        list: [
          'Novo agendamento criado',
          'Agendamento confirmado',
          'Agendamento cancelado',
          'Atendimento concluído',
          'Cliente adicionado à fila'
        ]
      },
      {
        subtitle: 'Como Configurar',
        list: [
          '1. Acesse Configurações > API',
          '2. Encontre o evento desejado',
          '3. Cole a URL do webhook de destino',
          '4. Ative o webhook',
          '5. Teste usando o botão de teste'
        ],
        tip: 'Use webhooks para integrar com Zapier, Make, ou sistemas próprios.'
      }
    ]
  },
  {
    id: 'notificacoes',
    title: 'Notificações Push',
    icon: Bell,
    content: [
      {
        subtitle: 'Ativando Notificações',
        text: 'Para receber alertas no navegador/celular:',
        list: [
          '1. Clique no ícone de sino no painel',
          '2. Permita notificações quando solicitado',
          '3. Configure quais alertas deseja receber'
        ]
      },
      {
        subtitle: 'Tipos de Alertas',
        list: [
          'Novo agendamento recebido',
          'Cliente chegou na fila',
          'Alerta de sobrecarga (muitos agendamentos)',
          'Tentativas de login suspeitas'
        ]
      },
      {
        subtitle: 'Solução de Problemas',
        text: 'Se não estiver recebendo notificações:',
        list: [
          'Verifique se o navegador permite notificações',
          'Em celulares, instale o app na tela inicial',
          'Verifique se não está no modo "Não perturbe"',
          'Tente desativar e reativar as notificações'
        ]
      }
    ]
  },
  {
    id: 'pwa',
    title: 'Instalando no Celular',
    icon: Smartphone,
    content: [
      {
        subtitle: 'Por que Instalar?',
        text: 'Instalando como app você ganha:',
        list: [
          'Acesso rápido pela tela inicial',
          'Notificações push funcionando',
          'Interface em tela cheia',
          'Funciona mesmo com internet instável'
        ]
      },
      {
        subtitle: 'Como Instalar (Android)',
        list: [
          '1. Acesse o sistema pelo Chrome',
          '2. Toque nos 3 pontinhos (menu)',
          '3. Selecione "Adicionar à tela inicial"',
          '4. Confirme o nome do app',
          '5. Pronto! O ícone aparecerá na tela inicial'
        ]
      },
      {
        subtitle: 'Como Instalar (iPhone)',
        list: [
          '1. Acesse o sistema pelo Safari',
          '2. Toque no ícone de compartilhar',
          '3. Role e toque em "Adicionar à Tela de Início"',
          '4. Confirme o nome do app',
          '5. O ícone aparecerá na tela inicial'
        ],
        warning: 'No iPhone, deve ser feito pelo Safari, não pelo Chrome.'
      }
    ]
  },
  {
    id: 'backup',
    title: 'Backup e Restauração',
    icon: Key,
    content: [
      {
        subtitle: 'Exportando Dados',
        text: 'Em Configurações > Backup você pode:',
        list: [
          'Exportar todas as configurações',
          'Exportar lista de clientes',
          'Exportar histórico de agendamentos',
          'Gerar relatórios em PDF'
        ]
      },
      {
        subtitle: 'Importando Dados',
        text: 'Formatos aceitos:',
        list: [
          'Configurações: arquivo JSON do próprio Genesis',
          'Contatos: CSV com colunas "nome" e "telefone"'
        ],
        warning: 'Importar configurações sobrescreve as atuais!'
      }
    ]
  },
  {
    id: 'problemas',
    title: 'Problemas Comuns',
    icon: HelpCircle,
    content: [
      {
        subtitle: 'Agendamento não aparece',
        text: 'Possíveis causas:',
        list: [
          'Filtro de data/status ativo - limpe os filtros',
          'Barbeiro em folga no dia selecionado',
          'Horário fora do expediente configurado'
        ]
      },
      {
        subtitle: 'WhatsApp não envia mensagens',
        text: 'Verifique:',
        list: [
          'ChatPro está configurado e conectado',
          'Token da API está correto',
          'Número do cliente está no formato correto (DDI+DDD+número)',
          'Template de mensagem está ativo',
          'Limite diário não foi atingido'
        ]
      },
      {
        subtitle: 'Notificações não funcionam',
        text: 'Soluções:',
        list: [
          'Permita notificações no navegador',
          'Instale o app na tela inicial (celulares)',
          'Desative bloqueadores de anúncios',
          'Verifique se Push está ativo nas configurações'
        ]
      },
      {
        subtitle: 'Sistema lento',
        text: 'O que fazer:',
        list: [
          'Limpe o cache do navegador',
          'Feche outras abas',
          'Verifique sua conexão com internet',
          'Tente outro navegador (recomendamos Chrome)'
        ]
      }
    ]
  },
  {
    id: 'suporte',
    title: 'Suporte Técnico',
    icon: AlertTriangle,
    content: [
      {
        subtitle: 'Antes de Pedir Ajuda',
        text: 'Verifique:',
        list: [
          'Se o problema persiste após atualizar a página',
          'Se outros usuários têm o mesmo problema',
          'Se há algum alerta no painel de notificações',
          'Se todas as configurações estão corretas'
        ]
      },
      {
        subtitle: 'Informações para Suporte',
        text: 'Ao solicitar ajuda, informe:',
        list: [
          'Descrição detalhada do problema',
          'Passos para reproduzir o erro',
          'Navegador e dispositivo usado',
          'Capturas de tela do erro (se houver)',
          'Horário aproximado que ocorreu'
        ],
        tip: 'Quanto mais detalhes, mais rápido conseguimos ajudar!'
      }
    ]
  }
];

export default function GenesisDocumentation() {
  const [activeSection, setActiveSection] = useState('primeiros-passos');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = searchQuery
    ? documentationSections.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.content.some(c => 
          c.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header fixo */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Book className="w-7 h-7 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Documentação Genesis</h2>
            <p className="text-sm text-muted-foreground">Guia essencial do sistema</p>
          </div>
        </div>
      </div>

      {/* Container principal com scroll contido */}
      <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Sidebar fixa */}
        <div className="w-64 flex-shrink-0 flex flex-col overflow-hidden">
          <div className="mb-4 flex-shrink-0">
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

        {/* Content com scroll próprio */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="pr-4">
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
                        <h4 className="text-lg font-semibold text-foreground">
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

                      {content.warning && (
                        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-destructive">
                            <strong>Atenção:</strong> {content.warning}
                          </p>
                        </div>
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
            </div>
          </ScrollArea>

          {/* Navigation fixo no rodapé */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-auto flex-shrink-0">
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
