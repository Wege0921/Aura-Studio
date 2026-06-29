import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Layout/Navigation';
import PublicHeader from './components/Layout/PublicHeader';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallBanner from './components/PWAInstallBanner';
import NetworkStatusBar from './components/NetworkStatusBar';
import MobileBottomTabs from './components/Layout/MobileBottomTabs';
import { register } from './utils/serviceWorkerRegistration';
import './App.css';

// Lazy-loaded routes — split into separate JS chunks
const Homepage = lazy(() => import('./components/Homepage/LandingPage'));
const Login = lazy(() => import('./components/Auth/Login'));
const Register = lazy(() => import('./components/Auth/Register'));
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const PackageList = lazy(() => import('./components/Packages/PackageList'));
const ClassList = lazy(() => import('./components/Classes/ClassList'));
const ClassDetail = lazy(() => import('./components/Classes/ClassDetail'));
const ContactPage = lazy(() => import('./components/Homepage/ContactPage'));
const NotificationSettings = lazy(() => import('./components/Notifications/NotificationSettings'));
const ClassManagement = lazy(() => import('./components/Admin/ClassManagement'));
const UserManagement = lazy(() => import('./components/Admin/UserManagement'));
const BookingManagement = lazy(() => import('./components/Admin/BookingManagement'));
const PackageManagement = lazy(() => import('./components/Admin/PackageManagement'));
const Analytics = lazy(() => import('./components/Admin/Analytics'));
const MarketingDashboard = lazy(() => import('./components/Admin/MarketingDashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // cache for 2 minutes
      gcTime: 1000 * 60 * 10,         // garbage collect after 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-aura-bark">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-sand"></div>
    </div>
  );
}

function PublicLayout({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className="min-h-screen bg-aura-bark pb-24 md:pb-0">
      <PublicHeader />
      {fullWidth ? (
        children
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      )}
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<PublicLayout fullWidth><Homepage /></PublicLayout>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<PublicLayout fullWidth><Homepage /></PublicLayout>} />

      {/* Public package browsing (no login required) */}
      <Route
        path="/classes"
        element={
          <PublicLayout>
            <ClassList />
          </PublicLayout>
        }
      />
      <Route
        path="/classes/:id"
        element={
          <PublicLayout>
            <ClassDetail />
          </PublicLayout>
        }
      />
      <Route
        path="/packages"
        element={
          <PublicLayout>
            <PackageList />
          </PublicLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <PublicLayout>
            <ContactPage />
          </PublicLayout>
        }
      />

      {/* Protected dashboard */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />

      {/* Redirect old protected routes */}
      <Route path="/my-bookings" element={<Navigate to="/dashboard/bookings" replace />} />
      <Route path="/my-payments" element={<Navigate to="/dashboard/payments" replace />} />
      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <ClassManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <UserManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <BookingManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/packages"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <PackageManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <Analytics />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/marketing"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <MarketingDashboard />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <NotificationSettings />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    // Register service worker
    register({
      onSuccess: (registration) => {
        console.log('Service worker registered successfully');
      },
      onUpdate: (registration) => {
        console.log('Service worker updated');
        if (window.confirm('New version available! Reload to update?')) {
          window.location.reload();
        }
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-aura-bark">
          <NetworkStatusBar />
          <OfflineIndicator />
          <PWAInstallBanner />
          <AppRoutes />
          <MobileBottomTabs />
        </div>
      </Router>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
