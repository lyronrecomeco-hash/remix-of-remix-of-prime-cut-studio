import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Menu, X, Calendar, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { href: '#sobre', label: 'Sobre' },
  { href: '#servicos', label: 'Serviços' },
  { href: '#galeria', label: 'Galeria' },
  { href: '#localizacao', label: 'Localização' },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { shopSettings, hasClientAppointments } = useApp();
  const { isAdmin, isSuperAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHomePage = location.pathname === '/';
  const hasAppointments = hasClientAppointments();
  const showAdminLink = isAdmin || isSuperAdmin;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || !isHomePage
            ? 'bg-background/95 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        }`}
      >
        <div className="container-narrow flex items-center justify-between h-16 md:h-20 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
            <span className="text-lg font-bold hidden sm:inline">{shopSettings.name}</span>
          </Link>

          {/* Desktop Nav */}
          {isHomePage && (
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          {/* CTA */}
          <div className="flex items-center gap-2">
            {hasAppointments && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link to="/meus-agendamentos">
                  <ClipboardList className="w-4 h-4" />
                  Meus Agendamentos
                </Link>
              </Button>
            )}
            {showAdminLink && (
              <Button asChild variant="ghost" size="sm" className="hidden md:flex">
                <Link to="/admin">
                  Painel Admin
                </Link>
              </Button>
            )}
            <Button asChild variant="hero" size="sm" className="hidden sm:flex">
              <Link to="/agendar">
                <Calendar className="w-4 h-4" />
                Agendar
              </Link>
            </Button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg bg-secondary"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 bg-background/98 backdrop-blur-lg border-b border-border md:hidden"
          >
            <nav className="container py-6 flex flex-col gap-4">
              {isHomePage &&
                navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    {link.label}
                  </a>
                ))}
              {hasAppointments && (
                <Link 
                  to="/meus-agendamentos" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center gap-2"
                >
                  <ClipboardList className="w-5 h-5" />
                  Meus Agendamentos
                </Link>
              )}
              {showAdminLink && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Painel Administrativo
                </Link>
              )}
              <Button asChild variant="hero" size="lg" className="mt-2">
                <Link to="/agendar" onClick={() => setIsMobileMenuOpen(false)}>
                  <Calendar className="w-4 h-4" />
                  Agendar Agora
                </Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
