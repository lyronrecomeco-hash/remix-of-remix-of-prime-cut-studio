import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { Award, Clock, Heart, Shield } from 'lucide-react';

const features = [
  {
    icon: Award,
    title: 'Expertise Comprovada',
    description: 'Profissionais treinados com as técnicas mais atuais do mercado',
  },
  {
    icon: Clock,
    title: 'Respeito ao seu Tempo',
    description: 'Agendamento inteligente para você ser atendido no horário marcado',
  },
  {
    icon: Heart,
    title: 'Experiência Única',
    description: 'Ambiente pensado para seu conforto e relaxamento',
  },
  {
    icon: Shield,
    title: 'Qualidade Garantida',
    description: 'Produtos selecionados e higiene rigorosa em cada atendimento',
  },
];

const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="sobre" className="section-padding bg-background" ref={ref}>
      <div className="container-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium tracking-wider uppercase">
            Sobre Nós
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6">
            Onde tradição encontra
            <br />
            <span className="text-gradient">excelência moderna</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Construímos nossa reputação cliente por cliente, corte por corte. 
            Aqui você não é apenas mais um — você é nossa prioridade. 
            Cada visita é uma oportunidade de superar suas expectativas.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-6 text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
