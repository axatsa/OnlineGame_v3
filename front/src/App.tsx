import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { OverloadCountdown } from "@/components/OverloadCountdown";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import { ClassProvider } from "./context/ClassContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Eager imports (critical path or minimal size)
import Login from "./pages/auth/Login";
import JoinWithInvite from "./pages/auth/JoinWithInvite";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

// Lazy imports (heavy or route-specific)
const AdminPanel = lazy(() => import("./pages/dashboard/AdminPanel"));
const TeacherDashboard = lazy(() => import("./pages/dashboard/TeacherDashboard"));
const ClassManager = lazy(() => import("./pages/ClassManager"));
const Generator = lazy(() => import("./pages/tools/Generator"));
const GamesLibrary = lazy(() => import("./pages/library/GamesLibrary"));
const Tools = lazy(() => import("./pages/tools/Tools"));
const TugOfWar = lazy(() => import("./pages/games/TugOfWar"));
const Jeopardy = lazy(() => import("./pages/games/Jeopardy"));
const MemoryMatrix = lazy(() => import("./pages/games/MemoryMatrix"));
const BalanceScales = lazy(() => import("./pages/games/BalanceScales"));
const WordSearch = lazy(() => import("./pages/games/WordSearch"));
const Crossword = lazy(() => import("./pages/games/Crossword"));
const Hangman = lazy(() => import("./pages/games/Hangman"));
const SpellingBee = lazy(() => import("./pages/games/SpellingBee"));
const MathPuzzle = lazy(() => import("./pages/games/MathPuzzle"));
const WordTranslate = lazy(() => import("./pages/games/WordTranslate"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const HistoryPage = lazy(() => import("./pages/dashboard/HistoryPage"));
const Library = lazy(() => import("./pages/library/Library"));
const MaterialsPage = lazy(() => import("./pages/library/MaterialsPage"));
const DemoGenerator = lazy(() => import("./pages/DemoGenerator"));
const Checkout = lazy(() => import("./pages/payment/Checkout"));
const ShareResource = lazy(() => import("./pages/ShareResource"));
const PaymentSuccess = lazy(() => import("./pages/payment/PaymentSuccess"));
const PaymentFail = lazy(() => import("./pages/payment/PaymentFail"));
const OrgAdminDashboard = lazy(() => import("./pages/dashboard/OrgAdminDashboard"));
const AnalyticsPage = lazy(() => import("./pages/dashboard/AnalyticsPage"));

// Suspense loading fallback
const RouteLoadingFallback = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OverloadCountdown />
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <ClassProvider>
              <Suspense fallback={<RouteLoadingFallback />}>
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

                {/* Org Admin Routes */}
                <Route path="/org-admin" element={
                  <ProtectedRoute allowedRoles={["org_admin"]}>
                    <OrgAdminDashboard />
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
                  <ProtectedRoute allowedRoles={["teacher", "super_admin", "org_admin"]}>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute allowedRoles={["teacher", "org_admin"]}>
                    <HistoryPage />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute allowedRoles={["teacher", "org_admin"]}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } />
                <Route path="/library" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <Library />
                  </ProtectedRoute>
                } />
                <Route path="/materials" element={
                  <ProtectedRoute allowedRoles={["teacher"]}>
                    <MaterialsPage />
                  </ProtectedRoute>
                } />

                {/* Game Routes - Also Protected for Teacher */}
                <Route path="/games/tug-of-war" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Tug of War error"><TugOfWar /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/jeopardy" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Jeopardy error"><Jeopardy /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/memory" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Memory game error"><MemoryMatrix /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/scales" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Balance scales error"><BalanceScales /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/word-search" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Word search error"><WordSearch /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/crossword" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Crossword error"><Crossword /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/hangman" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="Hangman error"><Hangman /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/spelling" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="SpellingBee error"><SpellingBee /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/math-puzzle" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="MathPuzzle error"><MathPuzzle /></ErrorBoundary></ProtectedRoute>} />
                <Route path="/games/word-translate" element={<ProtectedRoute allowedRoles={["teacher"]}><ErrorBoundary fallbackTitle="WordTranslate error"><WordTranslate /></ErrorBoundary></ProtectedRoute>} />

                {/* Public share route — no auth */}
                <Route path="/share/:logId" element={<ShareResource />} />

                {/* Payment Routes */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/fail" element={<PaymentFail />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </ClassProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
