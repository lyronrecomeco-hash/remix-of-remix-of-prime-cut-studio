import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  MessageCircle, 
  QrCode, 
  Settings, 
  CheckCircle,
  ExternalLink,
  Copy,
  Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface WelcomeSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const slides = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Genesis! 🎉',
    subtitle: 'Sistema completo para sua barbearia',
    content: (
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Scissors className="w-12 h-12 text-primary" />
        </div>
        <p className="text-muted-foreground text-center max-w-md mx-auto">
          Você está prestes a transformar a gestão da sua barbearia. 
          Vamos configurar tudo para você começar a usar imediatamente!
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3 rounded-xl bg-secondary/50 text-center">
            <div className="text-2xl font-bold text-primary">7 dias</div>
            <div className="text-xs text-muted-foreground">Teste grátis</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 text-center">
            <div className="text-2xl font-bold text-primary">100%</div>
            <div className="text-xs text-muted-foreground">Funcional</div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 mt-4">
          <p className="text-sm text-center text-green-400">
            ✅ <strong>Modo gratuito disponível!</strong> Use profissionalmente sem pagar nada. 
            ChatPro e recursos essenciais inclusos.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'chatpro-intro',
    title: 'Integração com WhatsApp',
    subtitle: 'Notifique seus clientes automaticamente',
    content: (
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
          <MessageCircle className="w-12 h-12 text-green-500" />
        </div>
        <p className="text-muted-foreground text-center max-w-md mx-auto">
          O Genesis usa o <strong>ChatPro</strong> para enviar mensagens automáticas 
          de confirmação, lembrete e muito mais direto no WhatsApp dos seus clientes.
        </p>
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-center text-green-400">
            💡 Você precisará de uma conta no ChatPro para usar esta função
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'chatpro-create',
    title: 'Criar conta no ChatPro',
    subtitle: 'Passo 1: Registre-se na plataforma',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</div>
            <div>
              <p className="font-medium">Acesse o site do ChatPro</p>
              <p className="text-sm text-muted-foreground">Clique no botão abaixo para abrir o site</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open('https://app.chatpro.com.br/register', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir ChatPro
          </Button>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</div>
            <div>
              <p className="font-medium">Crie sua conta</p>
              <p className="text-sm text-muted-foreground">Preencha seus dados e crie uma conta gratuita</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">3</div>
            <div>
              <p className="font-medium">Escolha um plano</p>
              <p className="text-sm text-muted-foreground">Recomendamos o plano básico para começar</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'chatpro-instance',
    title: 'Criar Instância',
    subtitle: 'Passo 2: Configure sua instância WhatsApp',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-secondary/50 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</div>
            <div>
              <p className="font-medium">Acesse o painel do ChatPro</p>
              <p className="text-sm text-muted-foreground">Faça login na sua conta</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</div>
            <div>
              <p className="font-medium">Clique em "Instâncias"</p>
              <p className="text-sm text-muted-foreground">No menu lateral, encontre a opção Instâncias</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">3</div>
            <div>
              <p className="font-medium">Crie uma nova instância</p>
              <p className="text-sm text-muted-foreground">Clique em "+ Nova Instância" e dê um nome (ex: MinhaBarber)</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm text-amber-400">
            ⚠️ <strong>Importante:</strong> Anote o ID da instância que aparecerá após criar
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'chatpro-qr',
    title: 'Conectar WhatsApp',
    subtitle: 'Passo 3: Escaneie o QR Code',
    content: (
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <QrCode className="w-12 h-12 text-primary" />
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</div>
            <div>
              <p className="font-medium">Na instância criada, clique em "Conectar"</p>
              <p className="text-sm text-muted-foreground">Um QR Code será exibido na tela</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</div>
            <div>
              <p className="font-medium">Abra o WhatsApp no seu celular</p>
              <p className="text-sm text-muted-foreground">Use o número da sua barbearia</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">3</div>
            <div>
              <p className="font-medium">Vá em Dispositivos conectados</p>
              <p className="text-sm text-muted-foreground">Menu → Dispositivos conectados → Conectar dispositivo</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold shrink-0">4</div>
            <div>
              <p className="font-medium">Escaneie o QR Code</p>
              <p className="text-sm text-muted-foreground">Aponte a câmera para o QR Code na tela do ChatPro</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'chatpro-token',
    title: 'Obter Token da API',
    subtitle: 'Passo 4: Copie suas credenciais',
    content: (
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Settings className="w-12 h-12 text-primary" />
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</div>
            <div>
              <p className="font-medium">Acesse as configurações da instância</p>
              <p className="text-sm text-muted-foreground">Clique no ícone de engrenagem ao lado da instância</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</div>
            <div>
              <p className="font-medium">Encontre o "Token da API"</p>
              <p className="text-sm text-muted-foreground">Na aba de configurações, procure por Token ou API Key</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold shrink-0">3</div>
            <div>
              <p className="font-medium">Copie o Token e o ID da Instância</p>
              <p className="text-sm text-muted-foreground">Você vai precisar deles no próximo passo</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            📝 <strong>Guarde essas informações:</strong> Token da API e ID da Instância
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'chatpro-config',
    title: 'Configurar no Genesis',
    subtitle: 'Passo 5: Cole as credenciais',
    content: (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">1</div>
            <div>
              <p className="font-medium">Vá em Configurações → ChatPro</p>
              <p className="text-sm text-muted-foreground">No menu do painel, acesse as configurações</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">2</div>
            <div>
              <p className="font-medium">Cole o ID da Instância</p>
              <p className="text-sm text-muted-foreground">No campo "ID da Instância"</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">3</div>
            <div>
              <p className="font-medium">Cole o Token da API</p>
              <p className="text-sm text-muted-foreground">No campo "Token da API"</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 font-bold shrink-0">4</div>
            <div>
              <p className="font-medium">Ative a integração</p>
              <p className="text-sm text-muted-foreground">Clique no botão para ativar e teste enviando uma mensagem</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'complete',
    title: 'Tudo Pronto! 🚀',
    subtitle: 'Sua barbearia está configurada',
    content: (
      <div className="space-y-4">
        <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-green-500/30 to-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <p className="text-muted-foreground text-center max-w-md mx-auto">
          Você completou a configuração inicial! Agora você pode explorar todas as 
          funcionalidades do Genesis e começar a atender seus clientes.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3 rounded-xl bg-secondary/50 text-center">
            <div className="text-lg font-bold text-primary">Agenda</div>
            <div className="text-xs text-muted-foreground">Gerencie horários</div>
          </div>
          <div className="p-3 rounded-xl bg-secondary/50 text-center">
            <div className="text-lg font-bold text-primary">Marketing</div>
            <div className="text-xs text-muted-foreground">Campanhas WhatsApp</div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 mt-4">
          <p className="text-sm text-center text-primary">
            💡 <strong>Dica:</strong> Configure o ChatPro em Configurações → ChatPro para ativar notificações automáticas
          </p>
        </div>
      </div>
    ),
  },
];

const WelcomeSetupModal = ({ isOpen, onComplete }: WelcomeSetupModalProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { user } = useAuth();
  const { notify } = useNotification();
  
  const isLastSlide = currentSlide === slides.length - 1;
  const isFirstSlide = currentSlide === 0;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstSlide) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (user) {
      try {
        // First check if record exists
        const { data: existing } = await supabase
          .from('admin_settings')
          .select('id')
          .eq('setting_type', `welcome_completed_${user.id}`)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          // Update existing record
          await supabase
            .from('admin_settings')
            .update({
              settings: { completed: true, completedAt: new Date().toISOString() }
            })
            .eq('id', existing.id);
        } else {
          // Insert new record with user_id
          await supabase
            .from('admin_settings')
            .insert({
              setting_type: `welcome_completed_${user.id}`,
              settings: { completed: true, completedAt: new Date().toISOString() },
              user_id: user.id
            });
        }
      } catch (e) {
        console.error('Error saving welcome completion:', e);
      }
    }
    onComplete();
    notify.success('Configuração concluída!', 'Bem-vindo ao Genesis');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/95 backdrop-blur-md"
        />

        {/* Modal */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-xl max-h-[90vh] flex flex-col"
          >
            <div className="glass-card rounded-2xl overflow-hidden border border-primary/30 flex flex-col max-h-full">
              {/* Progress bar */}
              <div className="h-1 bg-secondary">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Header */}
              <div className="p-6 pb-2 text-center shrink-0">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{currentSlide + 1}</span>
                  <span>/</span>
                  <span>{slides.length}</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {slides[currentSlide].subtitle}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {slides[currentSlide].content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="p-6 pt-4 border-t border-border shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <Button
                    variant="ghost"
                    onClick={handlePrev}
                    disabled={isFirstSlide}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Anterior
                  </Button>

                  <div className="flex gap-1.5">
                    {slides.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === currentSlide ? 'bg-primary' : 'bg-secondary'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="hero"
                    onClick={handleNext}
                    className="gap-2"
                  >
                    {isLastSlide ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Começar
                      </>
                    ) : (
                      <>
                        Próximo
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default WelcomeSetupModal;
