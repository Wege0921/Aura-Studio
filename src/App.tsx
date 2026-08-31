import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
// TODO(shop): uncomment to re-enable the cart provider.
// import { ShopCartProvider } from './contexts/ShopCartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Layout/Navigation';
import PublicHeader from './components/Layout/PublicHeader';
import OfflineIndicator from './components/OfflineIndicator';
import PWAInstallBanner from './components/PWAInstallBanner';
import NetworkStatusBar from './components/NetworkStatusBar';
import MobileBottomTabs from './components/Layout/MobileBottomTabs';
import { register, unregisterInDevelopment } from './utils/serviceWorkerRegistration';
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

// Shop routes (lazy-loaded) — COMMENTED OUT while shop is hidden from customers.
// Uncomment when ready to re-enable the storefront.
// const ShopLanding = lazy(() => import('./components/Shop/ShopLanding'));
// const ShopCategoryPage = lazy(() => import('./components/Shop/ShopCategoryPage'));
// const ProductDetail = lazy(() => import('./components/Shop/ProductDetail'));
// const CartPage = lazy(() => import('./components/Shop/CartPage'));
// const CheckoutPage = lazy(() => import('./components/Shop/CheckoutPage'));
// const OrderConfirmationPage = lazy(() => import('./components/Shop/OrderConfirmationPage'));
// const MyOrders = lazy(() => import('./components/Shop/MyOrders'));
// const CartDrawer = lazy(() => import('./components/Shop/CartDrawer'));
const ShopProductManagement = lazy(() => import('./components/Admin/ShopProductManagement'));
const ShopCategoryManagement = lazy(() => import('./components/Admin/ShopCategoryManagement'));
const ShopOrderManagement = lazy(() => import('./components/Admin/ShopOrderManagement'));
const ShopAnalytics = lazy(() => import('./components/Admin/ShopAnalytics'));

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
    <div className="flex items-center justify-center min-h-screen bg-canvas">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-edge"></div>
    </div>
  );
}

function PublicLayout({ children, fullWidth = false }: { children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`min-h-screen bg-canvas pb-24 md:pb-0 ${fullWidth ? '' : 'pt-[68px] max-[920px]:pt-[63px]'}`}>
      <PublicHeader />
      {fullWidth ? (
        children
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 md:py-6">
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

      {/* ---------------------------------------------------------------
        SHOP — public browsing routes.
        COMMENTED OUT while shop is hidden from customers.
        Uncomment (and un-comment the Shop lazy imports above and the
        ShopCartProvider/CartDrawer below) to re-enable the storefront.
      ---------------------------------------------------------------- */}
      {/*
      <Route
        path="/shop"
        element={
          <PublicLayout>
            <ShopLanding />
          </PublicLayout>
        }
      />
      <Route
        path="/shop/all"
        element={
          <PublicLayout>
            <ShopCategoryPage />
          </PublicLayout>
        }
      />
      <Route
        path="/shop/:category"
        element={
          <PublicLayout>
            <ShopCategoryPage />
          </PublicLayout>
        }
      />
      <Route
        path="/shop/product/:slug"
        element={
          <PublicLayout>
            <ProductDetail />
          </PublicLayout>
        }
      />
      <Route
        path="/cart"
        element={
          <PublicLayout>
            <CartPage />
          </PublicLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <PublicLayout>
            <CheckoutPage />
          </PublicLayout>
        }
      />
      <Route
        path="/shop/orders/:id"
        element={
          <PublicLayout>
            <OrderConfirmationPage />
          </PublicLayout>
        }
      />
      */}

      {/* Shop admin — protected */}
      <Route
        path="/admin/shop/products"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <ShopProductManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shop/categories"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <ShopCategoryManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shop/orders"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <ShopOrderManagement />
              </div>
            </main>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/shop/analytics"
        element={
          <ProtectedRoute adminOnly>
            <Navigation />
            <main className="pt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <ShopAnalytics />
              </div>
            </main>
          </ProtectedRoute>
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
    // A service worker cached by a previous production build hijacks the dev
    // server and causes an endless HMR reload loop, so remove it in development.
    unregisterInDevelopment();

    // Register service worker
    let reloading = false;
    const reloadOnce = () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    };

    register({
      onSuccess: (registration) => {
        console.log('Service worker registered successfully');
      },
      onUpdate: (registration) => {
        console.log('Service worker updated');
        // Auto-reload in PWA context where confirm dialogs may not show
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener('controllerchange', reloadOnce);
        } else {
          reloadOnce();
        }
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <AuthProvider>
      {/* TODO(shop): wrap with <ShopCartProvider> ... </ShopCartProvider> and
          render <CartDrawer /> when re-enabling the storefront. */}
      <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-canvas">
          <NetworkStatusBar />
          <OfflineIndicator />
          <PWAInstallBanner />
          <AppRoutes />
          <MobileBottomTabs />
          {/* TODO(shop): render <CartDrawer /> inside a <Suspense> here.
              <Suspense fallback={null}>
                <CartDrawer />
              </Suspense>
          */}
        </div>
      </Router>
      </ErrorBoundary>
    </AuthProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
