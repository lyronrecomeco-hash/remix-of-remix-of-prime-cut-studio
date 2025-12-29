import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut, Crown, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ProfileMenuProps {
  onOpenProfile: () => void;
  onOpenAccount: () => void;
}

const ProfileMenu = ({ onOpenProfile, onOpenAccount }: ProfileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { currentPlan } = useSubscription();

  const getPlanBadge = () => {
    if (!currentPlan) return { label: 'FREE', color: 'bg-muted text-muted-foreground' };
    switch (currentPlan.name) {
      case 'lifetime':
        return { label: 'VITALÍCIO', color: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black' };
      case 'premium':
        return { label: 'PREMIUM', color: 'bg-primary text-primary-foreground' };
      default:
        return { label: 'FREE', color: 'bg-muted text-muted-foreground' };
    }
  };

  const planBadge = getPlanBadge();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors touch-manipulation overflow-hidden"
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-12 w-64 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
            >
              {/* User Info Header */}
              <div className="p-4 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email || 'Usuário'}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${planBadge.color}`}>
                      {planBadge.label === 'VITALÍCIO' && <Crown className="w-3 h-3" />}
                      {planBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Meu Perfil</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAccount();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Minha Conta</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sair da conta</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;
