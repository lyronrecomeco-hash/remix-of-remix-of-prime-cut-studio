import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Shield, Scale, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TermosDeUso = () => {
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
            <FileText className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold">Termos de Uso</h1>
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
              <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
            <p className="text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Introduction */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              1. Aceitação dos Termos
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                Ao acessar e utilizar a plataforma Genesis ("Plataforma"), você ("Usuário") concorda em cumprir e ficar vinculado aos presentes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar a Plataforma.
              </p>
              <p>
                Estes Termos de Uso são regidos pela legislação brasileira, em especial pelo Código Civil (Lei nº 10.406/2002), Código de Defesa do Consumidor (Lei nº 8.078/1990), Marco Civil da Internet (Lei nº 12.965/2014) e Lei Geral de Proteção de Dados Pessoais - LGPD (Lei nº 13.709/2018).
              </p>
            </div>
          </section>

          {/* Service Description */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">2. Descrição do Serviço</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                O Genesis é uma plataforma SaaS (Software as a Service) de gestão para barbearias e salões de beleza, oferecendo funcionalidades de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Agendamento online de serviços</li>
                <li>Gestão de clientes e barbeiros</li>
                <li>Controle financeiro e relatórios</li>
                <li>Integração com WhatsApp para notificações</li>
                <li>Marketing automatizado</li>
                <li>Galeria de trabalhos</li>
              </ul>
            </div>
          </section>

          {/* Registration */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">3. Cadastro e Conta</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>3.1.</strong> Para utilizar a Plataforma, o Usuário deve criar uma conta fornecendo informações verdadeiras, completas e atualizadas.</p>
              <p><strong>3.2.</strong> Cada pessoa física ou jurídica pode criar apenas UMA conta na Plataforma. Tentativas de criação de múltiplas contas resultarão em bloqueio.</p>
              <p><strong>3.3.</strong> O Usuário é responsável pela segurança de sua senha e por todas as atividades realizadas em sua conta.</p>
              <p><strong>3.4.</strong> O Usuário deve notificar imediatamente a administração da Plataforma sobre qualquer uso não autorizado de sua conta.</p>
              <p><strong>3.5.</strong> Nos termos do Art. 18 da LGPD, o Usuário tem direito a:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Confirmação da existência de tratamento de seus dados</li>
                <li>Acesso aos seus dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Portabilidade dos dados a outro fornecedor de serviço</li>
                <li>Eliminação dos dados pessoais tratados com o consentimento</li>
              </ul>
            </div>
          </section>

          {/* Plans and Payment */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">4. Planos e Pagamentos</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>4.1. Período de Teste:</strong> Novos usuários têm direito a um período de teste gratuito de 7 (sete) dias corridos, contados a partir da confirmação do cadastro.</p>
              <p><strong>4.2. Planos Pagos:</strong> Após o período de teste, o Usuário pode optar por:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Plano Premium:</strong> Assinatura mensal com acesso a todas as funcionalidades</li>
                <li><strong>Plano Vitalício:</strong> Pagamento único com acesso permanente a todas as funcionalidades</li>
              </ul>
              <p><strong>4.3.</strong> Os valores dos planos estão sujeitos a alterações, sendo garantido ao Usuário ativo o valor contratado até o término do ciclo de cobrança atual.</p>
              <p><strong>4.4.</strong> Conforme o Art. 49 do CDC, o consumidor pode desistir do contrato no prazo de 7 (sete) dias a contar da assinatura ou do ato de recebimento do produto ou serviço (direito de arrependimento).</p>
            </div>
          </section>

          {/* Refund Policy */}
          <section className="glass-card rounded-xl p-6 border-2 border-amber-500/30">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              5. Política de Reembolso
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>5.1. Direito de Arrependimento:</strong> Conforme previsto no Art. 49 do CDC, o Usuário tem direito ao reembolso integral no prazo de 7 (sete) dias corridos após a contratação de qualquer plano pago.</p>
              <p><strong>5.2.</strong> Após o período de 7 dias:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Plano Premium (mensal):</strong> Não há reembolso proporcional. O acesso permanece até o fim do período pago.</li>
                <li><strong>Plano Vitalício:</strong> Não há reembolso após os 7 dias de arrependimento, salvo vícios ou defeitos não sanados.</li>
              </ul>
              <p><strong>5.3.</strong> Para solicitar reembolso dentro do prazo legal, o Usuário deve entrar em contato através do WhatsApp oficial da Plataforma.</p>
              <p><strong>5.4.</strong> O reembolso será processado no prazo de até 30 (trinta) dias úteis, utilizando o mesmo meio de pagamento da compra original.</p>
            </div>
          </section>

          {/* Responsibilities */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">6. Responsabilidades e Obrigações</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>6.1. Responsabilidades do Usuário:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Utilizar a Plataforma de forma lícita e ética</li>
                <li>Não compartilhar credenciais de acesso com terceiros</li>
                <li>Manter seus dados cadastrais atualizados</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
                <li>Não utilizar a Plataforma para fins ilegais ou abusivos</li>
              </ul>
              <p><strong>6.2. Responsabilidades da Plataforma:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Manter a disponibilidade do serviço (SLA de 99% mensal)</li>
                <li>Proteger os dados dos Usuários conforme a LGPD</li>
                <li>Fornecer suporte técnico em horário comercial</li>
                <li>Comunicar alterações nos termos com 30 dias de antecedência</li>
              </ul>
            </div>
          </section>

          {/* Data Protection */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              7. Proteção de Dados (LGPD)
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>7.1.</strong> A Plataforma atua como Controladora dos dados pessoais dos Usuários e como Operadora dos dados dos clientes das barbearias.</p>
              <p><strong>7.2.</strong> Os dados pessoais coletados são utilizados exclusivamente para:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Prestação dos serviços contratados</li>
                <li>Comunicação sobre a conta e serviços</li>
                <li>Cumprimento de obrigações legais</li>
                <li>Melhoria dos serviços oferecidos</li>
              </ul>
              <p><strong>7.3.</strong> A Plataforma implementa medidas técnicas e organizacionais apropriadas para proteger os dados pessoais contra acesso não autorizado, perda ou destruição.</p>
              <p><strong>7.4.</strong> Os dados são armazenados em servidores seguros com criptografia e backup regular.</p>
              <p><strong>7.5.</strong> O Usuário pode solicitar a exclusão de seus dados a qualquer momento, ressalvadas as obrigações legais de retenção.</p>
            </div>
          </section>

          {/* Prohibited Uses */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">8. Usos Proibidos</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>É expressamente proibido:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usar a Plataforma para enviar spam ou mensagens não solicitadas</li>
                <li>Tentar acessar contas de outros usuários</li>
                <li>Realizar engenharia reversa ou tentar extrair o código fonte</li>
                <li>Utilizar bots, crawlers ou ferramentas automatizadas não autorizadas</li>
                <li>Violar direitos de terceiros ou leis aplicáveis</li>
                <li>Inserir conteúdo ilegal, difamatório ou ofensivo</li>
                <li>Sobrecarregar intencionalmente a infraestrutura da Plataforma</li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">9. Propriedade Intelectual</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>9.1.</strong> Todos os direitos de propriedade intelectual sobre a Plataforma, incluindo código, design, marcas e conteúdo, pertencem exclusivamente ao Genesis ou seus licenciadores.</p>
              <p><strong>9.2.</strong> O Usuário recebe uma licença limitada, não exclusiva e revogável para utilizar a Plataforma conforme estes Termos.</p>
              <p><strong>9.3.</strong> O conteúdo inserido pelo Usuário permanece de sua propriedade, concedendo à Plataforma licença para armazená-lo e processá-lo conforme necessário para a prestação do serviço.</p>
            </div>
          </section>

          {/* Termination */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">10. Rescisão e Suspensão</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>10.1.</strong> O Usuário pode cancelar sua conta a qualquer momento através das configurações do painel.</p>
              <p><strong>10.2.</strong> A Plataforma pode suspender ou encerrar contas que violem estes Termos, sem prejuízo de outras medidas legais cabíveis.</p>
              <p><strong>10.3.</strong> Em caso de cancelamento, os dados serão mantidos por 30 dias para eventual recuperação, sendo então permanentemente excluídos.</p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">11. Limitação de Responsabilidade</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>11.1.</strong> A Plataforma não se responsabiliza por:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Interrupções causadas por fatores externos (manutenção, falhas de terceiros)</li>
                <li>Perdas decorrentes de uso indevido pelo Usuário</li>
                <li>Danos causados por integrações de terceiros (WhatsApp, etc.)</li>
                <li>Conteúdo inserido por Usuários ou seus clientes</li>
              </ul>
              <p><strong>11.2.</strong> A responsabilidade máxima da Plataforma é limitada ao valor pago pelo Usuário nos últimos 12 meses.</p>
            </div>
          </section>

          {/* Modifications */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">12. Alterações nos Termos</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>12.1.</strong> A Plataforma pode alterar estes Termos a qualquer momento, notificando os Usuários com 30 dias de antecedência.</p>
              <p><strong>12.2.</strong> O uso continuado da Plataforma após as alterações implica aceitação dos novos termos.</p>
              <p><strong>12.3.</strong> Caso não concorde com as alterações, o Usuário pode cancelar sua conta antes da entrada em vigor.</p>
            </div>
          </section>

          {/* Applicable Law */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">13. Lei Aplicável e Foro</h2>
            <div className="space-y-3 text-muted-foreground">
              <p><strong>13.1.</strong> Estes Termos são regidos pela legislação da República Federativa do Brasil.</p>
              <p><strong>13.2.</strong> Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias decorrentes destes Termos, ressalvado o direito do consumidor de optar pelo foro de seu domicílio, nos termos do Art. 101, I, do CDC.</p>
            </div>
          </section>

          {/* Contact */}
          <section className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">14. Contato</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Para dúvidas, sugestões ou exercício de direitos, entre em contato:</p>
              <div className="p-4 rounded-xl bg-secondary/50 mt-4">
                <p><strong>Genesis - Sistema de Gestão para Barbearias</strong></p>
                <p>E-mail: contato@genesishub.cloud</p>
                <p>WhatsApp: (11) 99999-9999</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="text-center py-8 text-muted-foreground text-sm">
            <p>© {new Date().getFullYear()} Genesis. Todos os direitos reservados.</p>
            <p className="mt-2">
              Ao utilizar nossa plataforma, você concorda com estes Termos de Uso e nossa{' '}
              <Link to="/privacidade" className="text-primary hover:underline">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermosDeUso;
