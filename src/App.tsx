import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import GuidesIndex from "./pages/GuidesIndex";
import GuidePage from "./pages/GuidePage";
import WikiIndex from "./pages/WikiIndex";
import WikiPage from "./pages/WikiPage";
import Glossary from "./pages/Glossary";
import Bestiary from "./pages/Bestiary";
import Changelog from "./pages/Changelog";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import UsernameRequiredDialog from "./components/UsernameRequiredDialog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProfileProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <UsernameRequiredDialog />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/game" element={<Index />} />
            <Route path="/guides" element={<GuidesIndex />} />
            <Route path="/guides/:slug" element={<GuidePage />} />
            <Route path="/wiki" element={<WikiIndex />} />
            <Route path="/wiki/glossaire" element={<Glossary />} />
            <Route path="/wiki/bestiaire" element={<Bestiary />} />
            <Route path="/wiki/:slug" element={<WikiPage />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
