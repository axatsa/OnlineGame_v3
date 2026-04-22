import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { OverloadCountdown } from "@/components/OverloadCountdown";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ClassProvider } from "./context/ClassContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";
import Login from "./pages/auth/Login";
import JoinWithInvite from "./pages/auth/JoinWithInvite";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
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
import HistoryPage from "./pages/dashboard/HistoryPage";
import Library from "./pages/library/Library";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import DemoGenerator from "./pages/DemoGenerator";
import Checkout from "./pages/payment/Checkout";
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFail from "./pages/payment/PaymentFail";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OverloadCountdown />
      <BrowserRouter>
        <AuthProvider>
          <ClassProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<JoinWithInvite />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/demo" element={<DemoGenerator />} />

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
                <Route path="/history" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <HistoryPage />
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

                {/* Payment Routes */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </ClassProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
