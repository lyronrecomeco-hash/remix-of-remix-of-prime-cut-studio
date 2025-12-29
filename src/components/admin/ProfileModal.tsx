import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Upload, Check, Loader2 } from 'lucide-react';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Predefined avatars
const maleAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=George&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffd5dc',
];

const femaleAvatars = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia&backgroundColor=d1d4f9',
];

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<'male' | 'female'>('male');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setSelectedAvatar(data.avatar_url);
      setAvatarType((data.avatar_type as 'male' | 'female') || 'male');
      if (data.avatar_url && !data.avatar_url.includes('dicebear')) {
        setCustomAvatarUrl(data.avatar_url);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setCustomAvatarUrl(publicUrl);
      setSelectedAvatar(publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const profileData = {
        user_id: user.id,
        avatar_url: selectedAvatar,
        avatar_type: avatarType,
      };

      if (existing) {
        await supabase
          .from('user_profiles')
          .update(profileData)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_profiles')
          .insert(profileData);
      }

      toast.success('Perfil atualizado!');
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Meu Perfil" size="md">
      <ModalBody className="space-y-6">
        {/* Current Avatar */}
        <div className="text-center">
          <Avatar className="w-24 h-24 mx-auto border-4 border-primary/20">
            {selectedAvatar ? (
              <AvatarImage src={selectedAvatar} />
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <p className="text-sm text-muted-foreground mt-2">
            Escolha um avatar ou faça upload
          </p>
        </div>

        {/* Avatar Type Toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={avatarType === 'male' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAvatarType('male')}
          >
            <User className="w-4 h-4 mr-1" />
            Masculino
          </Button>
          <Button
            variant={avatarType === 'female' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAvatarType('female')}
          >
            <User className="w-4 h-4 mr-1" />
            Feminino
          </Button>
        </div>

        {/* Avatar Grid */}
        <div>
          <p className="text-sm font-medium mb-3">Avatares disponíveis</p>
          <div className="grid grid-cols-4 gap-3">
            {(avatarType === 'male' ? maleAvatars : femaleAvatars).map((avatar, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedAvatar(avatar);
                  setCustomAvatarUrl(null);
                }}
                className={`relative p-1 rounded-xl border-2 transition-all ${
                  selectedAvatar === avatar
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={avatar}
                  alt={`Avatar ${idx + 1}`}
                  className="w-full aspect-square rounded-lg"
                />
                {selectedAvatar === avatar && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Custom Upload */}
        <div>
          <p className="text-sm font-medium mb-3">Ou faça upload</p>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-secondary/30">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Clique para enviar (máx 2MB)
                </span>
              </>
            )}
          </label>
          {customAvatarUrl && (
            <div className="mt-3 flex items-center gap-2">
              <Avatar className="w-10 h-10">
                <AvatarImage src={customAvatarUrl} />
              </Avatar>
              <span className="text-sm text-muted-foreground">Imagem personalizada</span>
              <Button
                size="sm"
                variant={selectedAvatar === customAvatarUrl ? 'default' : 'outline'}
                onClick={() => setSelectedAvatar(customAvatarUrl)}
              >
                {selectedAvatar === customAvatarUrl ? 'Selecionado' : 'Usar esta'}
              </Button>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ProfileModal;
