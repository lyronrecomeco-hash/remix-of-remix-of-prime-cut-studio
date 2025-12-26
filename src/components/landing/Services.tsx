import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Scissors, Brush, Crown, Zap, Palette, Sparkles } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, any> = {
  Scissors,
  Brush,
  Crown,
  Zap,
  Palette,
  Sparkles,
};

const Services = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { services } = useApp();

  return (
    <section id="servicos" className="section-padding bg-secondary/30" ref={ref}>
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">
            Nossos Serviços
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
            Cuidados que fazem
            <br />
            <span className="text-gradient">a diferença</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Cada serviço é executado com técnica apurada e atenção aos detalhes. 
            Do clássico ao contemporâneo, sempre com resultado impecável.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Scissors;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 group hover:border-primary/30 transition-all duration-300 glow-border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    R$ {service.price}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    ⏱ {service.duration} min
                  </span>
                  <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
                    <Link to="/agendar">Agendar</Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
