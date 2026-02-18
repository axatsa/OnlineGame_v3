import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClassProvider } from "./context/ClassContext";
import { LangProvider } from "./context/LangContext";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import TeacherDashboard from "./pages/TeacherDashboard";
import ClassManager from "./pages/ClassManager";
import Generator from "./pages/Generator";
import GamesLibrary from "./pages/GamesLibrary";
import Tools from "./pages/Tools";
import TugOfWar from "./pages/games/TugOfWar";
import Jeopardy from "./pages/games/Jeopardy";
import MemoryMatrix from "./pages/games/MemoryMatrix";
import BalanceScales from "./pages/games/BalanceScales";
import WordSearch from "./pages/games/WordSearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LangProvider>
          <ClassProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/classes" element={<ClassManager />} />
              <Route path="/generator" element={<Generator />} />
              <Route path="/games" element={<GamesLibrary />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/games/tug-of-war" element={<TugOfWar />} />
              <Route path="/games/jeopardy" element={<Jeopardy />} />
              <Route path="/games/memory" element={<MemoryMatrix />} />
              <Route path="/games/scales" element={<BalanceScales />} />
              <Route path="/games/word-search" element={<WordSearch />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ClassProvider>
        </LangProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
