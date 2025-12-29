import * as React from 'react';
import { Scissors, Calendar, ArrowRight, Star, MapPin, Clock, Phone } from 'lucide-react';

interface ThemePreviewCloneProps {
  themeId: string;
}

const ThemePreviewClone = ({ themeId }: ThemePreviewCloneProps) => {
  return (
    <div className={`theme-${themeId} w-full h-full overflow-hidden bg-background text-foreground`}>
      {/* Mini Hero Section */}
      <div className="relative h-[45%] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background/50 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center px-4">
          <span className="inline-block px-2 py-1 mb-2 text-[8px] font-medium text-primary bg-primary/10 rounded-full border border-primary/20">
            ✂️ Experiência Premium
          </span>
          <h1 className="text-sm font-bold mb-1 leading-tight">
            Seu visual merece
            <br />
            <span className="text-primary">atenção aos detalhes</span>
          </h1>
          <p className="text-[7px] text-muted-foreground mb-2">
            Técnica refinada e atendimento personalizado
          </p>
          <div className="flex gap-1 justify-center">
            <button className="px-2 py-1 text-[6px] bg-primary text-primary-foreground rounded-md flex items-center gap-1">
              <Calendar className="w-2 h-2" />
              Agendar
            </button>
            <button className="px-2 py-1 text-[6px] border border-border rounded-md flex items-center gap-1">
              Serviços
              <ArrowRight className="w-2 h-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Mini Services Section */}
      <div className="h-[35%] bg-secondary/30 p-3">
        <div className="text-center mb-2">
          <span className="text-primary text-[6px] font-medium uppercase">Serviços</span>
          <h2 className="text-[9px] font-bold">
            Cuidados que fazem <span className="text-primary">diferença</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { name: 'Corte', price: 'R$ 45', icon: Scissors },
            { name: 'Barba', price: 'R$ 35', icon: Scissors },
            { name: 'Combo', price: 'R$ 70', icon: Star },
          ].map((service) => (
            <div key={service.name} className="bg-background/50 border border-border/50 rounded-lg p-1.5 text-center">
              <div className="w-4 h-4 mx-auto mb-1 rounded bg-primary/10 flex items-center justify-center">
                <service.icon className="w-2 h-2 text-primary" />
              </div>
              <div className="text-[7px] font-semibold">{service.name}</div>
              <div className="text-[6px] text-primary font-bold">{service.price}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Footer */}
      <div className="h-[20%] bg-background border-t border-border/50 p-2">
        <div className="flex items-center justify-between text-[6px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-2 h-2 text-primary" />
            <span>Centro, SP</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-2 h-2 text-primary" />
            <span>9h-20h</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-2 h-2 text-primary" />
            <span>Contato</span>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[5px] text-muted-foreground">© 2024 Barbearia Premium</span>
        </div>
      </div>
    </div>
  );
};

export default ThemePreviewClone;
