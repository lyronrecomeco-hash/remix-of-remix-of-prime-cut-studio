import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
import { GalleryProvider } from "@/contexts/GalleryContext";
import Index from "./pages/Index";
import Booking from "./pages/Booking";
import MyAppointments from "./pages/MyAppointments";
import AdminPanel from "./pages/AdminPanel";
import FeedbackPage from "./pages/FeedbackPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Register Service Worker for PWA
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    });
  }
};

const App = () => {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <GalleryProvider>
          <FeedbackProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/agendar" element={<Booking />} />
                    <Route path="/meus-agendamentos" element={<MyAppointments />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/avaliar" element={<FeedbackPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </FeedbackProvider>
        </GalleryProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
