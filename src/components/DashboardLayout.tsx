import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import Home from './Homepage/Home';
import ClassList from './Classes/ClassList';
import PackageList from './Packages/PackageList';
import BookingHistory from './Booking/BookingHistory';
import PaymentHistory from './Payment/PaymentHistory';
import AdminDashboardPage from './Admin/AdminDashboardPage';
import ClassManagement from './Admin/ClassManagement';
import UserManagement from './Admin/UserManagement';
import BookingManagement from './Admin/BookingManagement';
import PackageManagement from './Admin/PackageManagement';
import PaymentManagement from './Admin/PaymentManagement';
import MobileBottomNav from './Layout/MobileBottomNav';
import DesktopSidebar from './Layout/DesktopSidebar';
import TabletSidebar from './Layout/TabletSidebar';
import {
  HomeIcon,
  ClassesIcon,
  PackagesIcon,
  BookingsIcon,
  PaymentsIcon,
  DashboardIcon,
  UsersIcon,
} from './Layout/TabIcons';

type TabType = 'home' | 'classes' | 'packages' | 'bookings' | 'payments' | 'admin-dashboard' | 'admin-classes' | 'admin-users' | 'admin-bookings' | 'admin-packages' | 'admin-payments';

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'ADMIN';
    const tabMap: Record<string, TabType> = isAdmin
      ? { home: 'admin-dashboard', dashboard: 'admin-dashboard', classes: 'admin-classes', packages: 'admin-packages', bookings: 'admin-bookings', users: 'admin-users', payments: 'admin-payments' }
      : { home: 'home', classes: 'classes', packages: 'packages', bookings: 'bookings', payments: 'payments' };
    const segments = location.pathname.split('/').filter(Boolean);
    const tab = segments.length > 1 ? segments[1] : null;
    if (tab && tabMap[tab]) {
      setActiveTab(tabMap[tab]);
    } else if (isAdmin) {
      setActiveTab('admin-dashboard');
    }
  }, [location.pathname, user]);

  const isAdmin = user?.role === 'ADMIN';

  const userTabs: TabDef[] = useMemo(() => [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <ClassesIcon className="w-5 h-5" /> },
    { id: 'packages', label: 'Packages', icon: <PackagesIcon className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <BookingsIcon className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <PaymentsIcon className="w-5 h-5" /> },
  ], []);

  const adminTabs: TabDef[] = useMemo(() => [
    { id: 'admin-dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    { id: 'admin-classes', label: 'Classes', icon: <ClassesIcon className="w-5 h-5" /> },
    { id: 'admin-packages', label: 'Packages', icon: <PackagesIcon className="w-5 h-5" /> },
    { id: 'admin-bookings', label: 'Bookings', icon: <BookingsIcon className="w-5 h-5" /> },
    { id: 'admin-users', label: 'Users', icon: <UsersIcon className="w-5 h-5" /> },
    { id: 'admin-payments', label: 'Payments', icon: <PaymentsIcon className="w-5 h-5" /> },
  ], []);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const tabs = isAdmin ? adminTabs : userTabs;

  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    const content = (() => {
      switch (activeTab) {
        case 'home': return <Home />;
        case 'classes': return <ClassList />;
        case 'packages': return <PackageList />;
        case 'bookings': return <BookingHistory />;
        case 'payments': return <PaymentHistory />;
        case 'admin-dashboard': return <AdminDashboardPage />;
        case 'admin-classes': return <ClassManagement />;
        case 'admin-users': return <UserManagement />;
        case 'admin-bookings': return <BookingManagement />;
        case 'admin-packages': return <PackageManagement />;
        case 'admin-payments': return <PaymentManagement />;
        default: return isAdmin ? <AdminDashboardPage /> : <Home />;
      }
    })();

    return (
      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {content}
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar (lg+) */}
      <DesktopSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userName={user.name}
        onLogout={handleLogout}
      />

      {/* Tablet Sidebar (md - lg) */}
      <TabletSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userName={user.name}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header - only visible on mobile */}
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="text-lg font-bold text-purple-600">AURA Yoga</h1>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 pb-20 md:pb-0 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileBottomNav
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default DashboardLayout;
