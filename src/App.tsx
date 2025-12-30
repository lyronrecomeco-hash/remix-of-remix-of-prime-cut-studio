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
import { useSecurityProtection } from "@/hooks/useSecurityProtection";
import MobileBottomNav from "@/components/MobileBottomNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";

// Lazy loading de páginas para code splitting
const Index = lazy(() => import("./pages/Index"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

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
          // Reload the page to get the new version
          window.location.reload();
        }
      });

      // Check for updates every 60 seconds
      setInterval(() => {
        registration.update();
      }, 60000);

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

  return (
    <>
      <Toaster />
      <Sonner />
      <UpgradeModal />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
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
            <Route path="/email-confirmado" element={<EmailConfirmed />} />
            <Route path="/confirmar-email" element={<ConfirmarEmail />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/termos" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<PoliticaDePrivacidade />} />
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
