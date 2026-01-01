import { useState, useRef } from 'react';
import { User, Mail, Phone, Key, Percent, Camera, Upload, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  whatsapp?: string;
  affiliate_code: string;
  commission_rate_monthly: number;
  commission_rate_lifetime: number;
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  pix_key: string | null;
  pix_type: string | null;
  status: string;
  created_at?: string;
}

interface AffiliateProfileCompleteProps {
  affiliate: Affiliate;
  onRefresh?: () => void;
}

const defaultAvatars = [
  { id: 'male1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4', label: 'Masculino 1' },
  { id: 'male2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John&backgroundColor=c0aede', label: 'Masculino 2' },
  { id: 'male3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob&backgroundColor=d1d4f9', label: 'Masculino 3' },
  { id: 'female1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=ffdfbf', label: 'Feminino 1' },
  { id: 'female2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana&backgroundColor=ffd5dc', label: 'Feminino 2' },
  { id: 'female3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julia&backgroundColor=c0aede', label: 'Feminino 3' },
];

const AffiliateProfileComplete = ({ affiliate, onRefresh }: AffiliateProfileCompleteProps) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => {
    const stored = localStorage.getItem(`affiliate_avatar_${affiliate.id}`);
    return stored || defaultAvatars[0].url;
  });
  const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPixTypeLabel = (type: string | null) => {
    if (!type) return '-';
    const labels: Record<string, string> = {
      cpf: 'CPF',
      cnpj: 'CNPJ',
      email: 'E-mail',
      phone: 'Telefone',
      random: 'Chave Aleatória'
    };
    return labels[type] || type;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${affiliate.id}-${Date.now()}.${fileExt}`;
      const filePath = `affiliate-avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setUploadedAvatar(publicUrl);
      setSelectedAvatar(publicUrl);
      toast.success('Avatar carregado com sucesso!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao carregar avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setSelectedAvatar(url);
    setUploadedAvatar(null);
  };

  const handleSaveAvatar = () => {
    setIsSaving(true);
    try {
      localStorage.setItem(`affiliate_avatar_${affiliate.id}`, selectedAvatar);
      toast.success('Avatar salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar avatar');
    } finally {
      setIsSaving(false);
    }
  };

  const profileFields = [
    { label: 'Nome Completo', value: affiliate.name, icon: User },
    { label: 'E-mail', value: affiliate.email, icon: Mail },
    { label: 'WhatsApp', value: affiliate.whatsapp || '-', icon: Phone },
    { label: 'Código de Afiliado', value: affiliate.affiliate_code, icon: Key },
    { label: 'Comissão Mensal', value: `${affiliate.commission_rate_monthly}%`, icon: Percent },
    { label: 'Comissão Vitalício', value: `${affiliate.commission_rate_lifetime}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Meu Perfil</h2>
        <p className="text-muted-foreground mt-1">
          Personalize seu perfil e visualize suas informações
        </p>
      </div>

      {/* Avatar Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Meu Avatar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Avatar */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={selectedAvatar} alt={affiliate.name} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {affiliate.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center sm:text-left">
                Escolha um avatar pré-definido ou faça upload de sua própria foto
              </p>
              <div className="flex gap-2 justify-center sm:justify-start">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  Upload
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveAvatar}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </div>

          {/* Avatar Options */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Avatares disponíveis:</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {defaultAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleSelectAvatar(avatar.url)}
                  className={`relative p-1 rounded-full transition-all ${
                    selectedAvatar === avatar.url
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'hover:ring-2 hover:ring-muted-foreground/30 hover:ring-offset-2 hover:ring-offset-background'
                  }`}
                >
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={avatar.url} alt={avatar.label} />
                    <AvatarFallback>{avatar.label.charAt(0)}</AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profileFields.map((field, index) => {
              const Icon = field.icon;
              return (
                <div
                  key={index}
                  className="p-4 bg-secondary/30 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <p className="text-sm text-muted-foreground">{field.label}</p>
                  </div>
                  <p className="font-medium text-foreground">{field.value}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* PIX Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Dados para Pagamento (PIX)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Tipo de Chave</p>
              <p className="font-medium text-foreground">
                {getPixTypeLabel(affiliate.pix_type)}
              </p>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-2">Chave PIX</p>
              <p className="font-medium text-foreground">
                {affiliate.pix_key || 'Não cadastrada'}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Para alterar seus dados de pagamento, entre em contato com o suporte.
          </p>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Percent className="w-5 h-5 text-primary" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
              <p className="text-xl font-bold text-green-500">
                {formatCurrency(affiliate.available_balance)}
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <p className="text-sm text-muted-foreground mb-1">Saldo Pendente</p>
              <p className="text-xl font-bold text-yellow-500">
                {formatCurrency(affiliate.pending_balance)}
              </p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">Total Ganho</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(affiliate.total_earnings)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateProfileComplete;
