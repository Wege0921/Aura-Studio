import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Layout/Navigation';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ClassList from './components/Classes/ClassList';
import PackageList from './components/Packages/PackageList';
import PaymentForm from './components/Payment/PaymentForm';
import BookingHistory from './components/Booking/BookingHistory';
import PaymentHistory from './components/Payment/PaymentHistory';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminDashboardPage from './components/Admin/AdminDashboardPage';
import UserDashboard from './components/User/UserDashboard';
import ClassManagement from './components/Admin/ClassManagement';
import PackageManagement from './components/Admin/PackageManagement';
import BookingManagement from './components/Admin/BookingManagement';
import PaymentManagement from './components/Admin/PaymentManagement';
import UserManagement from './components/Admin/UserManagement';
import NotificationSettings from './components/Notifications/NotificationSettings';
import OfflineIndicator from './components/OfflineIndicator';
import { register, registerInstallPrompt, registerNetworkStatusDetector } from './utils/serviceWorkerRegistration';
import './App.css';

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
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <Dashboard />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/packages" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <PackageList />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payment/:packageId" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <PaymentForm 
                        amount={0} // This would be populated from route params
                        packageId="" // This would be populated from route params
                        packageName="" // This would be populated from route params
                      />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <BookingHistory />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-payments" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <div className="text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Payments</h2>
                        <p className="text-gray-600">Your payment history will appear here</p>
                      </div>
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classes" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <ClassList />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <AdminDashboardPage />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/dashboard" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <UserDashboard />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-bookings" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <BookingHistory />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-payments" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="pt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                      <PaymentHistory />
                    </div>
                  </main>
                </ProtectedRoute>
              } 
            />
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
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
