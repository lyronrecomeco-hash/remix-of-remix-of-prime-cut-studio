import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

const CTA = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { shopSettings } = useApp();

  const whatsappLink = `https://wa.me/${shopSettings.whatsapp}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre os serviços.')}`;

  return (
    <section className="section-padding bg-secondary/30 relative overflow-hidden" ref={ref}>
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
      
      <div className="container-narrow relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Pronto para elevar
            <br />
            <span className="text-gradient">seu estilo?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Reserve seu horário em poucos cliques e tenha a certeza de um atendimento 
            pontual e personalizado. Sua experiência começa antes mesmo de chegar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="hero" size="xl">
              <Link to="/agendar">
                <Calendar className="w-5 h-5" />
                Agendar Agora
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="xl">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5" />
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
