import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, User, UserCircle, Upload, Check, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

type AvatarType = 'male' | 'female' | 'custom';

// Basic profanity filter
const badWords = ['merda', 'porra', 'caralho', 'foda', 'puta', 'idiota', 'burro'];
const containsProfanity = (text: string): boolean => {
  const lower = text.toLowerCase();
  return badWords.some(word => lower.includes(word));
};

const FeedbackPage = () => {
  const [shopOwnerId, setShopOwnerId] = useState<string | null>(null);
  const [shopName, setShopName] = useState('Barber Studio');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [avatarType, setAvatarType] = useState<AvatarType>('male');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Fetch shop info on mount
  useEffect(() => {
    const fetchShopInfo = async () => {
      // Get shop settings to find the owner
      const { data: shopData } = await supabase
        .from('shop_settings')
        .select('name, user_id')
        .limit(1)
        .maybeSingle();

      if (shopData) {
        setShopName(shopData.name || 'Barber Studio');
        if (shopData.user_id) {
          setShopOwnerId(shopData.user_id);
        }
      }

      // If no user_id in shop_settings, try to find an admin
      if (!shopData?.user_id) {
        const { data: adminData } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['super_admin', 'admin'])
          .limit(1)
          .single();

        if (adminData) {
          setShopOwnerId(adminData.user_id);
        }
      }
    };

    fetchShopInfo();
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        setAvatarType('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (rating === 0) {
      newErrors.push('Por favor, selecione uma avaliação de 1 a 5 estrelas');
    }

    if (!feedbackText.trim()) {
      newErrors.push('Por favor, escreva seu feedback');
    } else if (feedbackText.length > 500) {
      newErrors.push('O feedback deve ter no máximo 500 caracteres');
    } else if (containsProfanity(feedbackText)) {
      newErrors.push('Por favor, evite linguagem inadequada');
    }

    if (!isAnonymous && !name.trim()) {
      newErrors.push('Por favor, insira seu nome ou marque como anônimo');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!shopOwnerId) {
      setErrors(['Erro ao identificar a barbearia. Tente novamente mais tarde.']);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: shopOwnerId,
          name: isAnonymous ? 'Anônimo' : name.trim(),
          rating,
          text: feedbackText.trim(),
          avatar_type: isAnonymous ? 'male' : avatarType,
          avatar_url: avatarType === 'custom' ? avatarUrl : null,
          is_anonymous: isAnonymous,
          status: 'new',
        });

      if (error) {
        console.error('Error submitting feedback:', error);
        setErrors(['Erro ao enviar avaliação. Tente novamente.']);
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setErrors(['Erro ao enviar avaliação. Tente novamente.']);
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setName('');
    setIsAnonymous(false);
    setFeedbackText('');
    setAvatarType('male');
    setAvatarUrl('');
    setIsSuccess(false);
    setErrors([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container-narrow flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold">{shopName}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center max-w-md mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3">Obrigado!</h2>
              <p className="text-muted-foreground mb-8">
                Sua avaliação foi enviada com sucesso. Agradecemos seu feedback!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={resetForm}>
                  Enviar outra avaliação
                </Button>
                <Button asChild variant="hero">
                  <Link to="/">Voltar ao site</Link>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-lg"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Deixe sua avaliação</h1>
                <p className="text-muted-foreground">
                  Sua opinião é muito importante para nós!
                </p>
              </div>

              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
                {/* Avatar Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Escolha seu avatar</label>
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => { setAvatarType('male'); setAvatarUrl(''); }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        avatarType === 'male' && !avatarUrl
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAvatarType('female'); setAvatarUrl(''); }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        avatarType === 'female' && !avatarUrl
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      <UserCircle className="w-6 h-6" />
                    </button>
                    <label
                      className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden ${
                        avatarType === 'custom' && avatarUrl
                          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium mb-3">Sua avaliação *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Text */}
                <div>
                  <label className="block text-sm font-medium mb-2">Seu feedback *</label>
                  <Textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Conte-nos sobre sua experiência..."
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {feedbackText.length}/500 caracteres
                  </p>
                </div>

                {/* Name / Anonymous */}
                <div>
                  <label className="block text-sm font-medium mb-2">Seu nome</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Digite seu nome"
                    disabled={isAnonymous}
                    className={isAnonymous ? 'opacity-50' : ''}
                  />
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">Avaliar como anônimo</span>
                  </label>
                </div>

                {/* Errors */}
                <AnimatePresence>
                  {errors.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-destructive/10 border border-destructive/30 rounded-lg p-4"
                    >
                      {errors.map((error, i) => (
                        <p key={i} className="text-sm text-destructive flex items-center gap-2">
                          <X className="w-4 h-4 shrink-0" />
                          {error}
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || !shopOwnerId}
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                    />
                  ) : (
                    'Enviar Avaliação'
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default FeedbackPage;
