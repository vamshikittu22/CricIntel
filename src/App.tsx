import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PlayerProfile from "./pages/PlayerProfile";
import Compare from "./pages/Compare";
import MatchHistory from "./pages/MatchHistory";
import Matches from "./pages/Matches";
import MatchDetails from "./pages/MatchDetails";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import MatchAnalysis from "./pages/MatchAnalysis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/player/:id/history" element={<MatchHistory />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/match/:matchId" element={<MatchAnalysis />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
