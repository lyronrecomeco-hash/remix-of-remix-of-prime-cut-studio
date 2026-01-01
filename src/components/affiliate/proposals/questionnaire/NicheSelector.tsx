import { 
  Scissors, 
  Sparkles, 
  Stethoscope, 
  Dumbbell, 
  UtensilsCrossed, 
  Briefcase,
  Building2,
  LucideIcon
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { BusinessNiche } from './types';

const iconMap: Record<string, LucideIcon> = {
  Scissors,
  Sparkles,
  Stethoscope,
  Dumbbell,
  UtensilsCrossed,
  Briefcase,
  Building2,
};

interface NicheSelectorProps {
  niches: BusinessNiche[];
  onSelect: (niche: BusinessNiche) => void;
}

export function NicheSelector({ niches, onSelect }: NicheSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Qual é o segmento da empresa?
        </h3>
        <p className="text-muted-foreground">
          Selecione o nicho que melhor representa o negócio do cliente
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {niches.map((niche) => {
          const IconComponent = niche.icon ? iconMap[niche.icon] || Building2 : Building2;
          
          return (
            <Card
              key={niche.id}
              className="bg-card border-border hover:border-primary cursor-pointer transition-all hover:shadow-lg group"
              onClick={() => onSelect(niche)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="w-7 h-7 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground mb-1">
                  {niche.name}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {niche.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
