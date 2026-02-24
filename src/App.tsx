import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import EmergencyServices from "./pages/EmergencyServices";
import Services from "./pages/Services";
import Announcements from "./pages/Announcements";
import Contact from "./pages/Contact";
import MyRequests from "./pages/MyRequests";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/project">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth/*" element={<Auth />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/emergency" element={<EmergencyServices />} />
          <Route path="/my-requests" element={<MyRequests />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
