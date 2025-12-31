import { useState } from 'react';
import { 
  Sparkles, 
  Image, 
  FileText, 
  Loader2,
  Download,
  Copy,
  Check,
  Wand2,
  RefreshCw,
  MessageSquare,
  Instagram,
  Facebook,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIContentGeneratorProps {
  affiliateCode: string;
}

const AIContentGenerator = ({ affiliateCode }: AIContentGeneratorProps) => {
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageType, setImageType] = useState('banner');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [textPrompt, setTextPrompt] = useState('');
  const [textType, setTextType] = useState('whatsapp');
  const [generatedText, setGeneratedText] = useState('');
  const [textLoading, setTextLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error('Digite uma descrição para a imagem');
      return;
    }

    setImageLoading(true);
    setGeneratedImage(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-affiliate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ prompt: imagePrompt, type: imageType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar imagem');
      }

      setGeneratedImage(data.imageUrl);
      toast.success('Imagem gerada com sucesso!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar imagem');
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateText = async () => {
    if (!textPrompt.trim()) {
      toast.error('Digite uma descrição para o texto');
      return;
    }

    setTextLoading(true);
    setGeneratedText('');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-affiliate-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ prompt: textPrompt, type: textType, affiliateCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar texto');
      }

      setGeneratedText(data.text);
      toast.success('Texto gerado com sucesso!');
    } catch (error) {
      console.error('Error generating text:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar texto');
    } finally {
      setTextLoading(false);
    }
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success('Texto copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `material-${Date.now()}.png`;
    link.click();
    toast.success('Download iniciado!');
  };

  const imageSuggestions = [
    'Banner de promoção de sistema para barbearias com desconto',
    'Arte para stories sobre gestão de agendamentos',
    'Post para Instagram sobre automatização de barbearia',
    'Banner profissional para WhatsApp marketing'
  ];

  const textSuggestions = [
    'Convite para conhecer o sistema de gestão',
    'Promoção de teste grátis do sistema',
    'Benefícios de usar tecnologia na barbearia',
    'Depoimento sobre facilidade de agendamento'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 rounded-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Gerador de Conteúdo com IA</h2>
            <p className="text-muted-foreground text-sm">
              Crie imagens e textos profissionais para suas campanhas de marketing
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="image" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-secondary/50">
          <TabsTrigger value="image" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Image className="w-4 h-4" />
            Gerar Imagem
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="w-4 h-4" />
            Gerar Texto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-primary" />
                Criar Imagem com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Tipo de Imagem</Label>
                <Select value={imageType} onValueChange={setImageType}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner (16:9)</SelectItem>
                    <SelectItem value="story">Story (9:16)</SelectItem>
                    <SelectItem value="post">Post Quadrado (1:1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Descreva a imagem que deseja</Label>
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Ex: Banner promocional mostrando um smartphone com o aplicativo de agendamento de barbearia"
                  className="bg-input border-border min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {imageSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setImagePrompt(suggestion)}
                      className="text-xs px-3 py-1.5 bg-secondary/50 rounded-full text-foreground hover:bg-primary/20 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateImage}
                disabled={imageLoading || !imagePrompt.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {imageLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando imagem...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Imagem
                  </>
                )}
              </Button>

              {generatedImage && (
                <div className="mt-4 space-y-3">
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={generatedImage} alt="Imagem gerada" className="w-full h-auto" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={downloadImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Imagem
                    </Button>
                    <Button onClick={() => { setGeneratedImage(null); handleGenerateImage(); }} variant="outline" className="border-border">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Criar Texto com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Tipo de Texto</Label>
                <Select value={textType} onValueChange={setTextType}>
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        WhatsApp
                      </span>
                    </SelectItem>
                    <SelectItem value="instagram">
                      <span className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </span>
                    </SelectItem>
                    <SelectItem value="facebook">
                      <span className="flex items-center gap-2">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </span>
                    </SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        E-mail Marketing
                      </span>
                    </SelectItem>
                    <SelectItem value="story">
                      <span className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Story
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Sobre o que deseja criar?</Label>
                <Textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="Ex: Convite para testar o sistema de agendamento online para barbearias"
                  className="bg-input border-border min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Sugestões:</p>
                <div className="flex flex-wrap gap-2">
                  {textSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setTextPrompt(suggestion)}
                      className="text-xs px-3 py-1.5 bg-secondary/50 rounded-full text-foreground hover:bg-primary/20 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerateText}
                disabled={textLoading || !textPrompt.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {textLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando texto...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Texto
                  </>
                )}
              </Button>

              {generatedText && (
                <div className="mt-4 space-y-3">
                  <div className="bg-secondary/50 rounded-lg p-4 text-sm text-foreground whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {generatedText}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={copyText} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copiar Texto
                        </>
                      )}
                    </Button>
                    <Button onClick={() => { setGeneratedText(''); handleGenerateText(); }} variant="outline" className="border-border">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentGenerator;
