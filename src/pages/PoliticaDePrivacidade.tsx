import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck, Bell, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin/login">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Política de Privacidade</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Title Section */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Introduction */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              1. Introdução
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Esta Política de Privacidade descreve como o Genesis ("nós", "nosso" ou "Plataforma") coleta, usa, armazena e protege as informações pessoais dos usuários em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
              </p>
              <p>
                Ao utilizar nossa Plataforma, você consente com a coleta e uso de informações conforme descrito nesta política. Se você não concordar com esta política, por favor, não utilize nossos serviços.
              </p>
            </div>
          </section>

          {/* Data Controller */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">2. Controlador de Dados</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>O Controlador de dados pessoais é:</p>
              <div className="p-4 rounded-xl bg-secondary/50 mt-4">
                <p><strong>Genesis Hub</strong></p>
                <p>E-mail: privacidade@genesishub.cloud</p>
                <p>Encarregado de Proteção de Dados (DPO): contato@genesishub.cloud</p>
              </div>
            </div>
          </section>

          {/* Data Collection */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              3. Dados que Coletamos
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-2">3.1. Dados fornecidos diretamente:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone/WhatsApp, senha criptografada</li>
                  <li><strong>Dados da barbearia:</strong> nome do estabelecimento, endereço, horários de funcionamento</li>
                  <li><strong>Dados de clientes:</strong> nome e telefone dos clientes para agendamentos</li>
                  <li><strong>Dados financeiros:</strong> informações de pagamento processadas por terceiros</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-foreground mb-2">3.2. Dados coletados automaticamente:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Dados de acesso:</strong> endereço IP, tipo de navegador, sistema operacional</li>
                  <li><strong>Dados de uso:</strong> páginas acessadas, funcionalidades utilizadas, tempo de sessão</li>
                  <li><strong>Identificadores:</strong> cookies e tokens de sessão</li>
                  <li><strong>Dados de dispositivo:</strong> identificadores únicos para prevenção de fraudes</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Basis */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              4. Bases Legais para o Tratamento (LGPD)
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Tratamos seus dados pessoais com base nas seguintes hipóteses legais previstas no Art. 7º da LGPD:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Execução de contrato (Art. 7º, V):</strong> para prestar os serviços contratados</li>
                <li><strong>Consentimento (Art. 7º, I):</strong> para comunicações de marketing, quando aplicável</li>
                <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para melhorar nossos serviços e prevenir fraudes</li>
                <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> para atender exigências legais e regulatórias</li>
              </ul>
            </div>
          </section>

          {/* Data Usage */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">5. Como Usamos seus Dados</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Utilizamos as informações coletadas para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Fornecer, manter e melhorar nossos serviços</li>
                <li>Processar agendamentos e enviar notificações via WhatsApp</li>
                <li>Enviar comunicações sobre sua conta e serviços</li>
                <li>Prevenir fraudes e garantir a segurança da Plataforma</li>
                <li>Gerar relatórios e análises de uso (dados agregados e anonimizados)</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Responder a solicitações e fornecer suporte</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">6. Compartilhamento de Dados</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>6.1.</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais.</p>
              <p><strong>6.2.</strong> Podemos compartilhar dados com:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Provedores de serviço:</strong> que auxiliam na operação da Plataforma (hospedagem, pagamentos, comunicação)</li>
                <li><strong>Integrações solicitadas:</strong> como ChatPro para envio de mensagens WhatsApp</li>
                <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
              </ul>
              <p><strong>6.3.</strong> Todos os terceiros com acesso a dados são obrigados contratualmente a manter a confidencialidade e segurança.</p>
            </div>
          </section>

          {/* Data Storage */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">7. Armazenamento e Segurança</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>7.1. Localização:</strong> Seus dados são armazenados em servidores seguros localizados no Brasil e/ou em países com nível adequado de proteção de dados.</p>
              <p><strong>7.2. Medidas de segurança:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso</li>
                <li>Controle de acesso baseado em função (RBAC)</li>
                <li>Autenticação segura com hash de senhas</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e plano de recuperação de desastres</li>
                <li>Logs de auditoria de acesso</li>
              </ul>
              <p><strong>7.3. Retenção:</strong> Mantemos seus dados enquanto sua conta estiver ativa. Após cancelamento, os dados são retidos por 30 dias para recuperação e posteriormente eliminados, exceto quando houver obrigação legal de retenção.</p>
            </div>
          </section>

          {/* User Rights */}
          <section className="glass-card rounded-xl p-6 border-2 border-primary/30">
            <h2 className="text-xl font-bold mb-4">8. Seus Direitos (LGPD Art. 18)</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Conforme a LGPD, você tem os seguintes direitos:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">Confirmação e Acesso</p>
                  <p className="text-sm">Confirmar a existência de tratamento e acessar seus dados</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">Correção</p>
                  <p className="text-sm">Corrigir dados incompletos, inexatos ou desatualizados</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">Anonimização/Bloqueio</p>
                  <p className="text-sm">Solicitar anonimização ou bloqueio de dados desnecessários</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">Eliminação</p>
                  <p className="text-sm">Solicitar a exclusão de dados tratados com consentimento</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">Portabilidade</p>
                  <p className="text-sm">Solicitar a portabilidade dos dados a outro fornecedor</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium text-foreground">Revogação</p>
                  <p className="text-sm">Revogar o consentimento a qualquer momento</p>
                </div>
              </div>
              <p className="mt-4">Para exercer seus direitos, entre em contato conosco através do e-mail privacidade@genesishub.cloud. Responderemos em até 15 dias úteis.</p>
            </div>
          </section>

          {/* Cookies */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">9. Cookies e Tecnologias Similares</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>9.1.</strong> Utilizamos cookies para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Cookies essenciais:</strong> necessários para o funcionamento da Plataforma</li>
                <li><strong>Cookies de autenticação:</strong> manter sua sessão ativa</li>
                <li><strong>Cookies de preferências:</strong> lembrar suas configurações</li>
              </ul>
              <p><strong>9.2.</strong> Não utilizamos cookies de terceiros para publicidade.</p>
              <p><strong>9.3.</strong> Você pode configurar seu navegador para recusar cookies, porém isso pode afetar a funcionalidade da Plataforma.</p>
            </div>
          </section>

          {/* WhatsApp Integration */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              10. Integrações com WhatsApp
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>10.1.</strong> A Plataforma permite integração com o WhatsApp através de serviços de terceiros (como ChatPro) para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Enviar confirmações de agendamento</li>
                <li>Enviar lembretes de horário</li>
                <li>Notificar sobre chamadas na fila</li>
                <li>Enviar campanhas de marketing (com consentimento)</li>
              </ul>
              <p><strong>10.2.</strong> Os dados compartilhados com estes serviços são limitados ao necessário para o envio das mensagens (nome e telefone do cliente).</p>
              <p><strong>10.3.</strong> Você é responsável por garantir que possui consentimento dos seus clientes para o envio de mensagens.</p>
            </div>
          </section>

          {/* Children */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">11. Menores de Idade</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>A Plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se tomarmos conhecimento de que coletamos dados de menor, procederemos à eliminação imediata.</p>
            </div>
          </section>

          {/* Data Breach */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              12. Incidentes de Segurança
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>12.1.</strong> Em caso de incidente de segurança que possa acarretar risco ou dano relevante aos titulares, comunicaremos:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>A Autoridade Nacional de Proteção de Dados (ANPD) em prazo razoável</li>
                <li>Os titulares afetados, quando houver risco relevante</li>
              </ul>
              <p><strong>12.2.</strong> A comunicação incluirá: descrição da natureza dos dados afetados, medidas tomadas para reverter ou mitigar os efeitos, e recomendações ao titular.</p>
            </div>
          </section>

          {/* Changes */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">13. Alterações nesta Política</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>13.1.</strong> Podemos atualizar esta Política periodicamente. Alterações significativas serão comunicadas por e-mail ou aviso na Plataforma.</p>
              <p><strong>13.2.</strong> Recomendamos revisar esta página regularmente para manter-se informado.</p>
              <p><strong>13.3.</strong> A data da última atualização está indicada no topo desta página.</p>
            </div>
          </section>

          {/* Contact */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">14. Contato</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Para questões relacionadas a esta Política de Privacidade ou proteção de dados:</p>
              <div className="p-4 rounded-xl bg-secondary/50 mt-4">
                <p><strong>Encarregado de Proteção de Dados (DPO)</strong></p>
                <p>E-mail: privacidade@genesishub.cloud</p>
                <p>WhatsApp: (11) 99999-9999</p>
              </div>
              <p className="mt-4">Você também pode entrar em contato com a Autoridade Nacional de Proteção de Dados (ANPD) em caso de dúvidas ou reclamações: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.gov.br/anpd</a></p>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} Genesis. Todos os direitos reservados.</p>
            <p className="mt-2">
              Ao utilizar nossa plataforma, você concorda com nossa{' '}
              <Link to="/termos" className="text-primary hover:underline">
                Termos de Uso
              </Link>
              {' '}e esta Política de Privacidade.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default PoliticaDePrivacidade;
