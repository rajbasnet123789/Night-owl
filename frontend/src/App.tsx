import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import TodoPage from "./pages/TodoPage";
import InterviewPage from "./pages/InterviewPage";
import AssessmentsPage from "./pages/AssessmentsPage";
import ProgressPage from "./pages/ProgressPage";
import AchievementsPage from "./pages/AchievementsPage";
import FeedbackPage from "./pages/FeedbackPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/todo" element={<AppLayout><TodoPage /></AppLayout>} />
          <Route path="/interview" element={<AppLayout><InterviewPage /></AppLayout>} />
          <Route path="/assessments" element={<AppLayout><AssessmentsPage /></AppLayout>} />
          <Route path="/progress" element={<AppLayout><ProgressPage /></AppLayout>} />
          <Route path="/achievements" element={<AppLayout><AchievementsPage /></AppLayout>} />
          <Route path="/feedback" element={<AppLayout><FeedbackPage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
