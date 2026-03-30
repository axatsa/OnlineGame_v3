import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ClassProvider } from "./context/ClassContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { LangProvider } from "./context/LangContext";
import Login from "./pages/auth/Login";
import AdminPanel from "./pages/dashboard/AdminPanel";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import ClassManager from "./pages/ClassManager";
import Generator from "./pages/tools/Generator";
import GamesLibrary from "./pages/library/GamesLibrary";
import Tools from "./pages/tools/Tools";
import TugOfWar from "./pages/games/TugOfWar";
import Jeopardy from "./pages/games/Jeopardy";
import MemoryMatrix from "./pages/games/MemoryMatrix";
import BalanceScales from "./pages/games/BalanceScales";
import WordSearch from "./pages/games/WordSearch";
import Crossword from "./pages/games/Crossword";
import Profile from "./pages/dashboard/Profile";
import Library from "./pages/library/Library";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthListener = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handleAuthError = () => {
      navigate("/login");
    };
    window.addEventListener("auth:unauthorized", handleAuthError);
    return () => window.removeEventListener("auth:unauthorized", handleAuthError);
  }, [navigate]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthListener />
        <AuthProvider>
          <LangProvider>
            <ClassProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />

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
                    <ErrorBoundary fallbackTitle="Generator error">
                      <Generator />
                    </ErrorBoundary>
                  </ProtectedRoute>
                } />
                <Route path="/games" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <ErrorBoundary fallbackTitle="Games library error">
                      <GamesLibrary />
                    </ErrorBoundary>
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
                <Route path="/library" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Library />
                  </ProtectedRoute>
                } />

                {/* Game Routes - Also Protected for Teacher */}
                <Route path="/games/tug-of-war" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Tug of War error"><TugOfWar /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/jeopardy" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Jeopardy error"><Jeopardy /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/memory" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Memory game error"><MemoryMatrix /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/scales" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Balance scales error"><BalanceScales /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/word-search" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Word search error"><WordSearch /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/crossword" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Crossword error"><Crossword /></ErrorBoundary></ProtectedRoute>} />

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
