import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
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
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LangProvider>
            <ClassProvider>
              <Routes>
                <Route path="/" element={<Login />} />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                } />

                {/* Teacher Routes */}
                <Route path="/teacher" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/classes" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <ClassManager />
                  </ProtectedRoute>
                } />
                <Route path="/generator" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Generator />
                  </ProtectedRoute>
                } />
                <Route path="/games" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <GamesLibrary />
                  </ProtectedRoute>
                } />
                <Route path="/tools" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Tools />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute allowedRoles={["teacher", "super_admin"]}>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Game Routes - Also Protected for Teacher */}
                <Route path="/games/tug-of-war" element={<ProtectedRoute allowedRoles={["teacher"]}><TugOfWar /></ProtectedRoute>} />
                <Route path="/games/jeopardy" element={<ProtectedRoute allowedRoles={["teacher"]}><Jeopardy /></ProtectedRoute>} />
                <Route path="/games/memory" element={<ProtectedRoute allowedRoles={["teacher"]}><MemoryMatrix /></ProtectedRoute>} />
                <Route path="/games/scales" element={<ProtectedRoute allowedRoles={["teacher"]}><BalanceScales /></ProtectedRoute>} />
                <Route path="/games/word-search" element={<ProtectedRoute allowedRoles={["teacher"]}><WordSearch /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ClassProvider>
          </LangProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
