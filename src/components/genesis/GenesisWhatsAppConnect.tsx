import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Send,
  AlertCircle,
  Zap,
  Shield,
  Radio,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGenesisWhatsAppConnection } from './hooks/useGenesisWhatsAppConnection';
import { cn } from '@/lib/utils';

interface Instance {
  id: string;
  name: string;
  phone_number?: string;
  status: string;
  backend_url?: string;
  backend_token?: string;
  last_heartbeat?: string;
  effective_status?: string;
}

interface GenesisWhatsAppConnectProps {
  instance: Instance;
  onRefresh: () => void;
}

export function GenesisWhatsAppConnect({ instance, onRefresh }: GenesisWhatsAppConnectProps) {
  const backendUrl = instance.backend_url || 'http://localhost:3001';
  const backendToken = instance.backend_token || 'genesis-auto-token';
  
  const [liveStatus, setLiveStatus] = useState({
    status: instance.status,
    phoneNumber: instance.phone_number,
    isStale: false,
  });
  const [testNumber, setTestNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  const {
    connectionState,
    startConnection,
    disconnect,
    startStatusPolling,
    stopStatusPolling,
  } = useGenesisWhatsAppConnection();

  useEffect(() => {
    startStatusPolling(instance.id, (status) => {
      setLiveStatus({
        status: status.status,
        phoneNumber: status.phoneNumber,
        isStale: status.isStale,
      });
    });

    return () => stopStatusPolling();
  }, [instance.id, startStatusPolling, stopStatusPolling]);

  const handleConnect = async () => {
    await startConnection(instance.id, backendUrl, backendToken, () => {
      onRefresh();
    });
  };

  const handleDisconnect = async () => {
    await disconnect(instance.id, backendUrl, backendToken);
    onRefresh();
  };

  const handleSendTest = async () => {
    if (!testNumber.trim()) {
      toast.error('Digite o número de destino');
      return;
    }

    if (liveStatus.status !== 'connected') {
      toast.error('Instância não está conectada');
      return;
    }

    setIsSendingTest(true);

    try {
      let phone = testNumber.replace(/\D/g, '');
      if (!phone.startsWith('55') && phone.length <= 11) {
        phone = `55${phone}`;
      }

      const message = `🚀 *Teste Genesis Auto*

Sua instância está conectada e funcionando perfeitamente!

✅ Status: Ativo
📱 Sistema: Genesis Auto`;

      const response = await fetch(`${backendUrl}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendToken}`,
        },
        body: JSON.stringify({
          instanceId: instance.id,
          to: phone,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Erro ao enviar mensagem');
      }

      toast.success('Mensagem enviada com sucesso!');
      setTestNumber('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar teste';
      toast.error(message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const isConnected = liveStatus.status === 'connected' && !liveStatus.isStale;
  const isConnecting = connectionState.isConnecting || connectionState.isPolling;
  const phase = connectionState.phase;

  // Phase indicator text
  const getPhaseText = () => {
    switch (phase) {
      case 'validating': return 'Verificando servidor...';
      case 'generating': return 'Gerando QR Code...';
      case 'waiting': return 'Aguardando leitura...';
      case 'connected': return 'Conectado!';
      case 'error': return 'Erro na conexão';
      default: return 'Clique para conectar';
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-card via-card to-muted/30">
      <CardContent className="p-0">
        {/* Status Header */}
        <div className={cn(
          "p-6 transition-all duration-500",
          isConnected 
            ? "bg-gradient-to-r from-green-500/10 via-green-500/5 to-transparent" 
            : isConnecting
              ? "bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent"
              : phase === 'error'
                ? "bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent"
                : "bg-gradient-to-r from-muted/50 via-muted/30 to-transparent"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500",
                  isConnected 
                    ? "bg-green-500/20 shadow-lg shadow-green-500/20" 
                    : isConnecting
                      ? "bg-blue-500/20 shadow-lg shadow-blue-500/20"
                      : phase === 'error'
                        ? "bg-red-500/20"
                        : "bg-muted"
                )}
                animate={isConnecting ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 1.5, repeat: isConnecting ? Infinity : 0 }}
              >
                {phase === 'validating' && (
                  <Radio className="w-7 h-7 text-blue-500 animate-pulse" />
                )}
                {phase === 'generating' && (
                  <Sparkles className="w-7 h-7 text-blue-500 animate-pulse" />
                )}
                {phase === 'waiting' && (
                  <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                )}
                {(phase === 'connected' || isConnected) && (
                  <Wifi className="w-7 h-7 text-green-500" />
                )}
                {phase === 'error' && (
                  <XCircle className="w-7 h-7 text-red-500" />
                )}
                {phase === 'idle' && !isConnected && (
                  <WifiOff className="w-7 h-7 text-muted-foreground" />
                )}
              </motion.div>
              <div>
                <h3 className="font-bold text-lg">Conexão WhatsApp</h3>
                <motion.p 
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-muted-foreground"
                >
                  {isConnected 
                    ? liveStatus.phoneNumber || 'Conectado' 
                    : getPhaseText()}
                </motion.p>
              </div>
            </div>

            {/* Status Badge */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${isConnected}-${isConnecting}-${phase}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                {isConnecting && (
                  <Badge variant="secondary" className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {phase === 'validating' ? 'Verificando' : phase === 'generating' ? 'Gerando' : 'Conectando'}
                  </Badge>
                )}
                {isConnected && (
                  <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Conectado
                  </Badge>
                )}
                {phase === 'error' && (
                  <Badge variant="secondary" className="gap-1.5 bg-red-500/10 text-red-600 border-red-500/20 px-3 py-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Erro
                  </Badge>
                )}
                {!isConnected && !isConnecting && phase !== 'error' && liveStatus.isStale && (
                  <Badge variant="secondary" className="gap-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Verificando
                  </Badge>
                )}
                {!isConnected && !isConnecting && phase === 'idle' && !liveStatus.isStale && (
                  <Badge variant="secondary" className="gap-1.5 bg-muted text-muted-foreground border-border px-3 py-1.5">
                    <WifiOff className="w-3.5 h-3.5" />
                    Desconectado
                  </Badge>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 pt-2">
          {/* QR Code Section */}
          <AnimatePresence mode="wait">
            {!isConnected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Loading States */}
                {(phase === 'validating' || phase === 'generating') && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-12"
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      {phase === 'validating' ? (
                        <Radio className="w-10 h-10 text-blue-500" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-blue-500" />
                      )}
                    </motion.div>
                    <p className="mt-4 text-sm font-medium">
                      {phase === 'validating' ? 'Verificando servidor local...' : 'Gerando QR Code...'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {phase === 'validating' 
                        ? 'Conectando ao backend' 
                        : 'Aguarde um momento'}
                    </p>
                  </motion.div>
                )}

                {/* QR Code Display */}
                {connectionState.qrCode && phase === 'waiting' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div className="relative">
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-xl"
                        animate={{ opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <div className="relative bg-white p-5 rounded-2xl shadow-2xl border-4 border-primary/20">
                        <motion.img
                          key={connectionState.qrCode}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          src={connectionState.qrCode}
                          alt="QR Code"
                          className="w-56 h-56 sm:w-64 sm:h-64"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center space-y-2">
                      <p className="text-sm font-medium">
                        Escaneie o código com o WhatsApp
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Abra o WhatsApp → Menu → Aparelhos conectados → Conectar
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <motion.div 
                          className="w-2 h-2 rounded-full bg-blue-500"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-xs text-muted-foreground">
                          Aguardando... ({Math.floor(connectionState.attempts / 60)}:{String(connectionState.attempts % 60).padStart(2, '0')})
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Placeholder when idle */}
                {phase === 'idle' && !isConnecting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center py-10"
                  >
                    <motion.div 
                      className="relative cursor-pointer group"
                      whileHover={{ scale: 1.02 }}
                      onClick={handleConnect}
                    >
                      <div className="w-48 h-48 rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                        <QrCode className="w-20 h-20 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div 
                          className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-lg group-hover:shadow-xl transition-shadow"
                          whileHover={{ y: -2 }}
                        >
                          <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                            Clique para conectar
                          </p>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md">
                      {[
                        { icon: Zap, label: 'Conexão Rápida' },
                        { icon: Shield, label: '100% Seguro' },
                        { icon: RefreshCw, label: 'Auto Reconexão' },
                      ].map((feature, i) => (
                        <motion.div 
                          key={feature.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30"
                        >
                          <feature.icon className="w-5 h-5 text-primary" />
                          <span className="text-xs text-center text-muted-foreground">{feature.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Connected State - Test Message */}
          <AnimatePresence>
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 py-4"
              >
                <motion.div 
                  className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Instância conectada com sucesso!</p>
                    <p className="text-xs text-muted-foreground">
                      {liveStatus.phoneNumber || 'Pronto para enviar mensagens'}
                    </p>
                  </div>
                </motion.div>

                {/* Quick Test */}
                <motion.div 
                  className="p-4 rounded-xl bg-muted/30 border"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar mensagem de teste
                  </Label>
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={testNumber}
                      onChange={(e) => setTestNumber(e.target.value)}
                      placeholder="11999999999"
                      className="flex-1 bg-background"
                    />
                    <Button
                      onClick={handleSendTest}
                      disabled={isSendingTest || !testNumber.trim()}
                      size="sm"
                      className="gap-2 px-4"
                    >
                      {isSendingTest ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Enviar
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          <AnimatePresence>
            {connectionState.error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
              >
                <p className="text-sm text-destructive flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  {connectionState.error}
                </p>
                <p className="text-xs text-muted-foreground mt-2 ml-6">
                  Verifique se o script local está rodando em http://localhost:3001
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t">
            {!isConnected && !isConnecting && (
              <Button onClick={handleConnect} className="gap-2 flex-1 sm:flex-none" size="lg">
                <QrCode className="w-5 h-5" />
                Conectar WhatsApp
              </Button>
            )}

            {isConnecting && (
              <Button 
                variant="outline" 
                onClick={() => disconnect(instance.id)} 
                className="gap-2 flex-1 sm:flex-none"
                size="lg"
              >
                <XCircle className="w-5 h-5" />
                Cancelar
              </Button>
            )}

            {isConnected && (
              <Button 
                variant="outline" 
                onClick={handleDisconnect} 
                className="gap-2 text-destructive hover:text-destructive flex-1 sm:flex-none"
                size="lg"
              >
                <WifiOff className="w-5 h-5" />
                Desconectar
              </Button>
            )}

            <Button variant="ghost" onClick={onRefresh} size="icon" className="shrink-0">
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
