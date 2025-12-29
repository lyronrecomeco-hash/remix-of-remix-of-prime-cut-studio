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
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import BookingDirect from "./pages/BookingDirect";
import MyAppointments from "./pages/MyAppointments";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
import FeedbackPage from "./pages/FeedbackPage";
import OwnerPanel from "./pages/OwnerPanel";
import EmailConfirmed from "./pages/EmailConfirmed";
import ConfirmarEmail from "./pages/ConfirmarEmail";
import RedefinirSenha from "./pages/RedefinirSenha";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <MobileBottomNav />
      </BrowserRouter>
    </>
  );
};

const App = () => (
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
);

export default App;
