import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff,
  Send,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  const [backendUrl, setBackendUrl] = useState(instance.backend_url || 'http://localhost:3001');
  const [backendToken, setBackendToken] = useState(instance.backend_token || '');
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
    if (!backendUrl || !backendToken) {
      toast.error('Preencha a URL e o Token do backend');
      return;
    }

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
      // Format phone number
      let phone = testNumber.replace(/\D/g, '');
      if (!phone.startsWith('55') && phone.length <= 11) {
        phone = `55${phone}`;
      }

      const message = `🔔 *Sua instância está conectada com sucesso!*

Esta é uma mensagem de teste para verificar se o sistema está funcionando corretamente.

✅ *Sistema:* Genesis Pro
📱 *Enviado via:* Genesis Pro`;

      // Try to send via backend
      if (backendUrl && backendToken) {
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

        toast.success('Mensagem de teste enviada com sucesso!');
      } else {
        toast.error('Configure o backend para enviar mensagens');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar teste';
      toast.error(message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const isConnected = liveStatus.status === 'connected' && !liveStatus.isStale;
  const isConnecting = connectionState.isConnecting || connectionState.isPolling;

  const getStatusBadge = () => {
    if (isConnecting) {
      return (
        <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20">
          <Loader2 className="w-3 h-3 animate-spin" />
          Conectando...
        </Badge>
      );
    }

    if (isConnected) {
      return (
        <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-600 border-green-500/20">
          <Wifi className="w-3 h-3" />
          Conectado
        </Badge>
      );
    }

    if (liveStatus.isStale && liveStatus.status === 'connected') {
      return (
        <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
          <AlertCircle className="w-3 h-3" />
          Verificando...
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-600 border-red-500/20">
        <WifiOff className="w-3 h-3" />
        Desconectado
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Connection Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              Conexão WhatsApp
            </CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            {isConnected
              ? `Conectado: ${liveStatus.phoneNumber || 'Número não identificado'}`
              : 'Configure o backend e escaneie o QR Code para conectar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Backend Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">URL do Backend</Label>
              <Input
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3001"
                disabled={isConnecting}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Token do Backend</Label>
              <Input
                type="password"
                value={backendToken}
                onChange={(e) => setBackendToken(e.target.value)}
                placeholder="Seu token de autenticação"
                disabled={isConnecting}
              />
            </div>
          </div>

          {/* QR Code Display */}
          <AnimatePresence mode="wait">
            {connectionState.qrCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center py-6"
              >
                <div className="bg-white p-4 rounded-xl shadow-lg">
                  <img
                    src={connectionState.qrCode}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Abra o WhatsApp no seu celular e escaneie o código
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tentativa {connectionState.attempts} de 180
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {connectionState.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                {connectionState.error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {!isConnected && !isConnecting && (
              <Button onClick={handleConnect} className="gap-2">
                <QrCode className="w-4 h-4" />
                Gerar QR Code
              </Button>
            )}

            {isConnecting && (
              <Button variant="outline" onClick={() => disconnect(instance.id)} className="gap-2">
                <XCircle className="w-4 h-4" />
                Cancelar
              </Button>
            )}

            {isConnected && (
              <Button variant="outline" onClick={handleDisconnect} className="gap-2 text-destructive">
                <WifiOff className="w-4 h-4" />
                Desconectar
              </Button>
            )}

            <Button variant="ghost" onClick={onRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Message Card */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Enviar Teste
              </CardTitle>
              <CardDescription>
                Envie uma mensagem de teste para verificar se tudo está funcionando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  placeholder="11999999999"
                  className="flex-1"
                />
                <Button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testNumber.trim()}
                  className="gap-2"
                >
                  {isSendingTest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar Teste
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Digite o número com DDD (ex: 11999999999)
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
