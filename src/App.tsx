import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { GalleryProvider } from "@/contexts/GalleryContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { CRMProvider } from "@/contexts/CRMContext";
import { useSecurityProtection } from "@/hooks/useSecurityProtection";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast as notify } from "sonner";

// Lazy loading de páginas para code splitting
const Index = lazy(() => import("./pages/Index"));
const GenesisLanding = lazy(() => import("./pages/GenesisLanding"));
const Booking = lazy(() => import("./pages/Booking"));
const BookingDirect = lazy(() => import("./pages/BookingDirect"));
const MyAppointments = lazy(() => import("./pages/MyAppointments"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const OwnerPanel = lazy(() => import("./pages/OwnerPanel"));
const EmailConfirmed = lazy(() => import("./pages/EmailConfirmed"));
const ConfirmarEmail = lazy(() => import("./pages/ConfirmarEmail"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const TermosDeUso = lazy(() => import("./pages/TermosDeUso"));
const PoliticaDePrivacidade = lazy(() => import("./pages/PoliticaDePrivacidade"));
const Docs = lazy(() => import("./pages/Docs"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AffiliateLogin = lazy(() => import("./pages/AffiliateLogin"));
const AffiliatePanel = lazy(() => import("./pages/AffiliatePanel"));
const CRMLogin = lazy(() => import("./pages/CRMLogin"));
const CRMPanel = lazy(() => import("./pages/CRMPanel"));
const CRMTokenLogin = lazy(() => import("./pages/CRMTokenLogin"));
const ProposalPage = lazy(() => import("./pages/ProposalPage"));
const WADocsPage = lazy(() => import("./pages/WADocsPage"));

// QueryClient com retry logic e cache otimizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Loading component para Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Register Service Worker for PWA
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('Service Worker registered:', registration.scope);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New content available, please refresh.');
              // Auto-activate new service worker
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_UPDATED') {
          console.log('SW Updated to version:', event.data.version);

          // Evita recarregamentos inesperados (especialmente no CRM)
          const isCrm = window.location.pathname.startsWith('/crmpainel');
          if (isCrm) {
            notify('Atualização disponível', {
              description: 'Clique para atualizar quando for conveniente.',
              action: {
                label: 'Atualizar',
                onClick: () => window.location.reload(),
              },
            });
            return;
          }

          // Para o restante do app, mantém atualização manual (sem auto reload)
          notify('Atualização disponível', {
            description: 'Clique para atualizar.',
            action: {
              label: 'Atualizar',
              onClick: () => window.location.reload(),
            },
          });
        }
      });

      // Check for updates (menos agressivo para evitar interrupções)
      setInterval(() => {
        registration.update();
      }, 10 * 60 * 1000);

    } catch (error) {
      console.log('Service Worker registration failed:', error);
    }
  }
};

// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
  }
};

const AppContent = () => {
  useSecurityProtection();

  useEffect(() => {
    registerServiceWorker();
    requestNotificationPermission();
  }, []);

  // Check if accessing via docs subdomain
  const isDocsSubdomain = window.location.hostname === 'docs.genesishub.cloud';
  const isAffiliateSubdomain = window.location.hostname === 'parceiros.genesishub.cloud';

  // If on docs subdomain, show only the Docs page
  if (isDocsSubdomain) {
    return (
      <>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="*" element={<Docs />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </>
    );
  }

  // If on affiliate subdomain, show only affiliate pages
  if (isAffiliateSubdomain) {
    return (
      <>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<AffiliateLogin />} />
              <Route path="/login" element={<AffiliateLogin />} />
              <Route path="/painel" element={<AffiliatePanel />} />
              <Route path="*" element={<AffiliateLogin />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <UpgradeModal />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<GenesisLanding />} />
            <Route path="/barbearia" element={<Index />} />
            <Route path="/agendar" element={<Booking />} />
            <Route path="/agendamento-direto" element={<BookingDirect />} />
            <Route path="/meus-agendamentos" element={<MyAppointments />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/avaliar" element={<FeedbackPage />} />
            <Route path="/owner" element={<OwnerPanel />} />
            <Route path="/proposta/:slug" element={<ProposalPage />} />
            <Route path="/email-confirmado" element={<EmailConfirmed />} />
            <Route path="/confirmar-email" element={<ConfirmarEmail />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/docs/whatsapp-api" element={<WADocsPage />} />
            <Route path="/afiliado/login" element={<AffiliateLogin />} />
            <Route path="/afiliado" element={<AffiliatePanel />} />
            <Route path="/crm/login" element={<CRMProvider><CRMLogin /></CRMProvider>} />
            <Route path="/crm/token" element={<CRMProvider><CRMTokenLogin /></CRMProvider>} />
            <Route path="/crmpainel" element={<CRMProvider><CRMPanel /></CRMProvider>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <MobileBottomNav />
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <AppProvider>
            <GalleryProvider>
              <FeedbackProvider>
                <NotificationProvider>
                  <TooltipProvider>
                    <AppContent />
                  </TooltipProvider>
                </NotificationProvider>
              </FeedbackProvider>
            </GalleryProvider>
          </AppProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
