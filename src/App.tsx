import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Layout/Navigation';
import Homepage from './components/Homepage/Homepage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import OfflineIndicator from './components/OfflineIndicator';
import ClassManagement from './components/Admin/ClassManagement';
import UserManagement from './components/Admin/UserManagement';
import BookingManagement from './components/Admin/BookingManagement';
import PackageManagement from './components/Admin/PackageManagement';
import PaymentManagement from './components/Admin/PaymentManagement';
import AdminDashboard from './components/Admin/AdminDashboard';
import NotificationSettings from './components/Notifications/NotificationSettings';
import { register, registerInstallPrompt, registerNetworkStatusDetector } from './utils/serviceWorkerRegistration';
import './App.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        user ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Homepage />
        )
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/home" element={
        user ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Homepage />
        )
      } />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
      {/* Redirect old routes to new dashboard */}
      <Route path="/packages" element={<Navigate to="/dashboard/packages" replace />} />
      <Route path="/classes" element={<Navigate to="/dashboard/classes" replace />} />
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
        // Show update notification to user
        if (window.confirm('New version available! Reload to update?')) {
          window.location.reload();
        }
      }
    });

    // Register PWA install prompt
    registerInstallPrompt();

    // Register network status detector
    registerNetworkStatusDetector();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <OfflineIndicator />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
