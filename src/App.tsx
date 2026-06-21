import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Layout/Navigation';
import Homepage from './components/Homepage/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import ClassList from './components/Classes/ClassList';
import PackageList from './components/Packages/PackageList';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallBanner from './components/PWAInstallBanner';
import NetworkStatusBar from './components/NetworkStatusBar';
import ClassManagement from './components/Admin/ClassManagement';
import UserManagement from './components/Admin/UserManagement';
import BookingManagement from './components/Admin/BookingManagement';
import PackageManagement from './components/Admin/PackageManagement';
import PaymentManagement from './components/Admin/PaymentManagement';
import AdminDashboard from './components/Admin/AdminDashboard';
import NotificationSettings from './components/Notifications/NotificationSettings';
import { register } from './utils/serviceWorkerRegistration';
import './App.css';

function PublicLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-aura-cream">
      <header className="bg-aura-ivory border-b border-aura-sand/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={() => navigate('/')}
              className="text-lg font-bold text-aura-bark font-serif"
            >
              AURA
            </button>
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-sm font-medium text-aura-bark hover:bg-aura-sand/20 rounded-lg transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 text-sm font-medium text-aura-bark hover:bg-aura-sand/20 rounded-lg transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 text-sm font-medium bg-aura-bark text-aura-ivory rounded-lg hover:bg-aura-umber transition-colors"
                  >
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={<Homepage />} />

      {/* Public class & package browsing (no login required) */}
      <Route
        path="/classes"
        element={
          <PublicLayout>
            <ClassList />
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
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
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
          <ProtectedRoute>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <PaymentManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/marketing"
        element={
          <ProtectedRoute>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <AdminDashboard />
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
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-aura-cream">
          <NetworkStatusBar />
          <OfflineIndicator />
          <PWAInstallBanner />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
