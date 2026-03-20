import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Profile from "./pages/Profile";
import Summon from "./pages/Summon";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import UsernameRequiredDialog from "./components/UsernameRequiredDialog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/summon" element={<Summon />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
