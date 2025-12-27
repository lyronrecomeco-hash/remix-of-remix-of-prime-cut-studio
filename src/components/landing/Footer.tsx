import { Scissors, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { shopSettings } = useApp();

  // Build social links from settings
  const instagramLink = shopSettings.social?.instagram?.startsWith('http') 
    ? shopSettings.social.instagram 
    : shopSettings.social?.instagram 
      ? `https://instagram.com/${shopSettings.social.instagram.replace('@', '')}` 
      : '#';
      
  const facebookLink = shopSettings.social?.facebook?.startsWith('http')
    ? shopSettings.social.facebook
    : shopSettings.social?.facebook
      ? `https://facebook.com/${shopSettings.social.facebook}`
      : '#';

  return (
    <footer className="bg-card border-t border-border">
      <div className="container-narrow section-padding py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold">{shopSettings.name}</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              {shopSettings.tagline}. Atendimento premium com agendamento online 
              para sua comodidade.
            </p>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold mb-4">Horários</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Seg - Sex: {shopSettings.hours.weekdays}</p>
              <p>Sábado: {shopSettings.hours.saturday}</p>
              <p>Domingo: {shopSettings.hours.sunday}</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{shopSettings.phone}</p>
              <p className="text-xs">{shopSettings.address}</p>
            </div>
            
            {/* Social */}
            <div className="flex gap-3 mt-4">
              <a 
                href={instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a 
                href={facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a 
                href={`https://wa.me/${shopSettings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>© {currentYear} {shopSettings.name}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;