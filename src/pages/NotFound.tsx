import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, Scissors, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md"
      >
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Scissors className="w-12 h-12 text-primary" />
          </motion.div>
        </div>
        
        <h1 className="text-7xl font-bold text-gradient mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8">
          Parece que você se perdeu. A página que você procura não existe ou foi movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/">
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/agendar">
              <ArrowLeft className="w-4 h-4" />
              Agendar Horário
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
