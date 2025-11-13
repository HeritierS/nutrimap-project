import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChildrenListPage from "./pages/ChildrenListPage";
import NewChildPage from "./pages/NewChildPage";
import ChildDetailPage from "./pages/ChildDetailPage";
import MapViewPage from "./pages/MapViewPage";
import ReportsPage from "./pages/ReportsPage";
import ConversationsPage from "./pages/ConversationsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

const App = () => {  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="children" element={<ChildrenListPage />} />
                  <Route path="conversations" element={
                    <ProtectedRoute allowedRoles={[ 'chw', 'nutritionist' ]}>
                      <ConversationsPage />
                    </ProtectedRoute>
                  } />
                  <Route 
                    path="children/new" 
                    element={
                      <ProtectedRoute allowedRoles={['chw']}>
                        <NewChildPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="children/:id" element={<ChildDetailPage />} />
                  <Route path="map" element={<MapViewPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route 
                    path="admin/users" 
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminUsersPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
