import { Home, Calendar, ClipboardList, User, MessageSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, label: 'Início' },
  { href: '/agendar', icon: Calendar, label: 'Agendar' },
  { href: '/meus-agendamentos', icon: ClipboardList, label: 'Meus' },
  { href: '/avaliar', icon: MessageSquare, label: 'Avaliar' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  
  // Don't show on admin panel
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border md:hidden mobile-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex flex-col items-center gap-1 py-2 px-4 relative"
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <span className={`text-[10px] font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
