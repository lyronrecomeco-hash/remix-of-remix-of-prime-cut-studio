import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireSuperAdmin = false 
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { user, isLoading, isAdmin, isSuperAdmin, role } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in
    if (!user) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // No role assigned
    if (!role) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Requires super admin but user is not
    if (requireSuperAdmin && !isSuperAdmin) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Requires admin but user is not
    if (requireAdmin && !isAdmin) {
      navigate('/admin/login', { replace: true });
      return;
    }
  }, [user, isLoading, isAdmin, isSuperAdmin, role, requireAdmin, requireSuperAdmin, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or not authorized
  if (!user || !role) {
    return null;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
