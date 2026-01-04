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
  Shield
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
  // Backend config is managed internally - users don't need to configure
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

  // Start status polling
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
    // Use instance backend config or defaults
    const url = backendUrl || 'http://localhost:3001';
    const token = backendToken || 'genesis-auto-token';

    await startConnection(instance.id, url, token, () => {
      onRefresh();
    });
  };

  const handleDisconnect = async () => {
    const url = backendUrl || 'http://localhost:3001';
    const token = backendToken || 'genesis-auto-token';
    await disconnect(instance.id, url, token);
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

      const url = backendUrl || 'http://localhost:3001';
      const token = backendToken || 'genesis-auto-token';

      const response = await fetch(`${url}/api/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
              : "bg-gradient-to-r from-muted/50 via-muted/30 to-transparent"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                isConnected 
                  ? "bg-green-500/20 shadow-lg shadow-green-500/20" 
                  : isConnecting
                    ? "bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "bg-muted"
              )}>
                {isConnecting ? (
                  <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                ) : isConnected ? (
                  <Wifi className="w-7 h-7 text-green-500" />
                ) : (
                  <WifiOff className="w-7 h-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">Conexão WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected 
                    ? liveStatus.phoneNumber || 'Conectado' 
                    : isConnecting 
                      ? 'Aguardando leitura do QR Code...'
                      : 'Clique para conectar sua instância'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {isConnecting && (
                <Badge variant="secondary" className="gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Conectando
                </Badge>
              )}
              {isConnected && (
                <Badge variant="secondary" className="gap-1.5 bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conectado
                </Badge>
              )}
              {!isConnected && !isConnecting && liveStatus.isStale && (
                <Badge variant="secondary" className="gap-1.5 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 px-3 py-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Verificando
                </Badge>
              )}
              {!isConnected && !isConnecting && !liveStatus.isStale && (
                <Badge variant="secondary" className="gap-1.5 bg-muted text-muted-foreground border-border px-3 py-1.5">
                  <WifiOff className="w-3.5 h-3.5" />
                  Desconectado
                </Badge>
              )}
            </div>
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
                {/* QR Code Display */}
                {connectionState.qrCode ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center py-8"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-xl" />
                      <div className="relative bg-white p-5 rounded-2xl shadow-2xl border-4 border-primary/20">
                        <img
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
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">
                          Tentativa {connectionState.attempts}/180
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* Placeholder when not connecting */
                  !isConnecting && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center py-10"
                    >
                      <div className="relative">
                        <div className="w-48 h-48 rounded-2xl bg-muted/50 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                          <QrCode className="w-20 h-20 text-muted-foreground/30" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border shadow-lg">
                            <p className="text-sm font-medium text-muted-foreground">
                              Clique para conectar
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="grid grid-cols-3 gap-4 mt-8 w-full max-w-md">
                        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <Zap className="w-5 h-5 text-primary" />
                          <span className="text-xs text-center text-muted-foreground">Conexão Rápida</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <Shield className="w-5 h-5 text-primary" />
                          <span className="text-xs text-center text-muted-foreground">100% Seguro</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                          <RefreshCw className="w-5 h-5 text-primary" />
                          <span className="text-xs text-center text-muted-foreground">Auto Reconexão</span>
                        </div>
                      </div>
                    </motion.div>
                  )
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
                <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Instância conectada com sucesso!</p>
                    <p className="text-xs text-muted-foreground">
                      {liveStatus.phoneNumber || 'Pronto para enviar mensagens'}
                    </p>
                  </div>
                </div>

                {/* Quick Test */}
                <div className="p-4 rounded-xl bg-muted/30 border">
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {connectionState.error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl"
            >
              <p className="text-sm text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {connectionState.error}
              </p>
            </motion.div>
          )}

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
