import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
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
  InstructorIcon,
  AnalyticsIcon,
  ProfileIcon,
  WaitlistIcon,
  CalendarIcon,
  ContentIcon,
} from './Layout/TabIcons';
import ThemeToggle from './ThemeToggle';

// Lazy-loaded — each loads only when its tab is first opened
const UserDashboard = lazy(() => import('./User/UserDashboard'));
const ProfilePage = lazy(() => import('./User/ProfilePage'));
const PackageList = lazy(() => import('./Packages/PackageList'));
const ClassList = lazy(() => import('./Classes/ClassList'));
const PaymentHistory = lazy(() => import('./Payment/PaymentHistory'));
const BookingHistory = lazy(() => import('./Booking/BookingHistory'));
const MyWaitlist = lazy(() => import('./User/MyWaitlist'));
const CalendarView = lazy(() => import('./Classes/CalendarView'));
const AdminDashboardPage = lazy(() => import('./Admin/AdminDashboardPage'));
const ClassManagement = lazy(() => import('./Admin/ClassManagement'));
const UserManagement = lazy(() => import('./Admin/UserManagement'));
const BookingManagement = lazy(() => import('./Admin/BookingManagement'));
const PackageManagement = lazy(() => import('./Admin/PackageManagement'));
const PaymentManagement = lazy(() => import('./Admin/PaymentManagement'));
const InstructorManagement = lazy(() => import('./Admin/InstructorManagement'));
const Analytics = lazy(() => import('./Admin/Analytics'));
const SiteContentManagement = lazy(() => import('./Admin/SiteContentManagement'));
const MyOrders = lazy(() => import('./Shop/MyOrders'));
const ShopProductManagement = lazy(() => import('./Admin/ShopProductManagement'));
const ShopCategoryManagement = lazy(() => import('./Admin/ShopCategoryManagement'));
const ShopOrderManagement = lazy(() => import('./Admin/ShopOrderManagement'));
const ShopAnalytics = lazy(() => import('./Admin/ShopAnalytics'));

type TabType = 'home' | 'classes' | 'packages' | 'bookings' | 'payments' | 'waitlist' | 'profile' | 'calendar' | 'shop-orders' | 'admin-dashboard' | 'admin-classes' | 'admin-users' | 'admin-bookings' | 'admin-packages' | 'admin-payments' | 'admin-instructors' | 'admin-analytics' | 'admin-content' | 'admin-shop-products' | 'admin-shop-categories' | 'admin-shop-orders' | 'admin-shop-analytics';

interface TabDef {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

// A NavSection is either a direct link (single item) or a collapsible group
// of related pages. This keeps the sidebar scannable as features grow.
type NavSection =
  | { type: 'item'; id: TabType; label: string; icon: React.ReactNode }
  | { type: 'group'; id: string; label: string; icon: React.ReactNode; children: TabDef[] };

// Flatten sections into a simple tab list (for MobileBottomNav, etc.)
const flattenSections = (sections: NavSection[]): TabDef[] => {
  const result: TabDef[] = [];
  for (const s of sections) {
    if (s.type === 'item') {
      result.push({ id: s.id, label: s.label, icon: s.icon });
    } else {
      result.push(...s.children);
    }
  }
  return result;
};

// Find which group (if any) contains the active tab
const findActiveGroupId = (sections: NavSection[], activeTab: string): string | null => {
  for (const s of sections) {
    if (s.type === 'group' && s.children.some((c) => c.id === activeTab)) {
      return s.id;
    }
  }
  return null;
};

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('aura-view-mode') as 'admin' | 'user') || 'admin';
    }
    return 'admin';
  });

  useEffect(() => {
    const handleClickOutside = () => setShowMobileMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === 'ADMIN';
    const tabMap: Record<string, TabType> = isAdmin
      ? { home: 'admin-dashboard', dashboard: 'admin-dashboard', classes: 'admin-classes', packages: 'admin-packages', bookings: 'admin-bookings', users: 'admin-users', payments: 'admin-payments', instructors: 'admin-instructors', analytics: 'admin-analytics', content: 'admin-content', 'shop-products': 'admin-shop-products', 'shop-orders': 'admin-shop-orders', 'shop-categories': 'admin-shop-categories', 'shop-analytics': 'admin-shop-analytics' }
      : { home: 'home', classes: 'classes', packages: 'packages', bookings: 'bookings', payments: 'payments', waitlist: 'waitlist', profile: 'profile', calendar: 'calendar', 'shop-orders': 'shop-orders' };
    const segments = location.pathname.split('/').filter(Boolean);
    const tab = segments.length > 1 ? segments[1] : null;
    if (tab && tabMap[tab]) {
      setActiveTab(tabMap[tab]);
    } else if (isAdmin) {
      setActiveTab(viewMode === 'admin' ? 'admin-dashboard' : 'home');
    }
  }, [location.pathname, user, viewMode]);

  const isAdmin = user?.role === 'ADMIN';

  const userTabs: TabDef[] = useMemo(() => [
    { id: 'home', label: 'Home', icon: <HomeIcon className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <ClassesIcon className="w-5 h-5" /> },
    { id: 'calendar', label: 'Schedule', icon: <CalendarIcon className="w-5 h-5" /> },
    { id: 'packages', label: 'Packages', icon: <PackagesIcon className="w-5 h-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <BookingsIcon className="w-5 h-5" /> },
    { id: 'shop-orders', label: 'My Orders', icon: <PackagesIcon className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <PaymentsIcon className="w-5 h-5" /> },
    { id: 'waitlist', label: 'Waitlist', icon: <WaitlistIcon className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <ProfileIcon className="w-5 h-5" /> },
  ], []);

  const adminSections: NavSection[] = useMemo(() => [
    // Overview
    { type: 'item', id: 'admin-dashboard', label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    // Academy
    {
      type: 'group',
      id: 'academy',
      label: 'Academy',
      icon: <ClassesIcon className="w-5 h-5" />,
      children: [
        { id: 'admin-classes', label: 'Classes', icon: <ClassesIcon className="w-5 h-5" /> },
        { id: 'admin-packages', label: 'Packages', icon: <PackagesIcon className="w-5 h-5" /> },
        { id: 'admin-bookings', label: 'Bookings', icon: <BookingsIcon className="w-5 h-5" /> },
        { id: 'admin-instructors', label: 'Instructors', icon: <InstructorIcon className="w-5 h-5" /> },
      ],
    },
    // Users
    { type: 'item', id: 'admin-users', label: 'Users', icon: <UsersIcon className="w-5 h-5" /> },
    // Commerce
    {
      type: 'group',
      id: 'commerce',
      label: 'Commerce',
      icon: <PackagesIcon className="w-5 h-5" />,
      children: [
        { id: 'admin-shop-products', label: 'Products', icon: <PackagesIcon className="w-5 h-5" /> },
        { id: 'admin-shop-orders', label: 'Orders', icon: <BookingsIcon className="w-5 h-5" /> },
        { id: 'admin-shop-categories', label: 'Categories', icon: <ContentIcon className="w-5 h-5" /> },
        { id: 'admin-shop-analytics', label: 'Shop Analytics', icon: <AnalyticsIcon className="w-5 h-5" /> },
      ],
    },
    // Finance
    { type: 'item', id: 'admin-payments', label: 'Payments', icon: <PaymentsIcon className="w-5 h-5" /> },
    // Analytics
    { type: 'item', id: 'admin-analytics', label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5" /> },
    // Content
    { type: 'item', id: 'admin-content', label: 'Content', icon: <ContentIcon className="w-5 h-5" /> },
  ], []);

  // Flat list for backward-compat uses (mobile bottom nav, etc.)
  const adminTabs: TabDef[] = useMemo(() => flattenSections(adminSections), [adminSections]);

  // Admin on dashboard should always be in admin mode
  useEffect(() => {
    if (isAdmin && viewMode !== 'admin') {
      setViewMode('admin');
      localStorage.setItem('aura-view-mode', 'admin');
      setActiveTab('admin-dashboard');
    }
  }, [isAdmin, viewMode]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // For admin: use grouped sections. For user: wrap flat tabs as single-item sections.
  const sections: NavSection[] = isAdmin && viewMode === 'admin'
    ? adminSections
    : userTabs.map((t) => ({ type: 'item' as const, id: t.id, label: t.label, icon: t.icon }));
  const tabs = isAdmin && viewMode === 'admin' ? adminTabs : userTabs;

  const toggleViewMode = () => {
    const next = viewMode === 'admin' ? 'user' : 'admin';
    setViewMode(next);
    localStorage.setItem('aura-view-mode', next);
    if (next === 'user') {
      navigate('/');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleTabChange = (tabId: string) => {
    if (tabId === 'home') {
      navigate('/');
      return;
    }
    setActiveTab(tabId as TabType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    if (activeTab === 'home') {
      return isAdmin ? <AdminDashboardPage onTabChange={handleTabChange} /> : <UserDashboard />;
    }

    // Redirect non-admin users away from admin tabs
    if (!isAdmin && activeTab.startsWith('admin-')) {
      return <UserDashboard />;
    }

    const content = (() => {
      switch (activeTab) {
        case 'classes': return <ClassList />;
        case 'packages': return <PackageList />;
        case 'bookings': return <BookingHistory />;
        case 'payments': return <PaymentHistory />;
        case 'waitlist': return <MyWaitlist />;
        case 'profile': return <ProfilePage />;
        case 'calendar': return <CalendarView />;
        case 'shop-orders': return <MyOrders />;
        case 'admin-dashboard': return <AdminDashboardPage onTabChange={handleTabChange} />;
        case 'admin-classes': return <ClassManagement />;
        case 'admin-users': return <UserManagement />;
        case 'admin-bookings': return <BookingManagement />;
        case 'admin-packages': return <PackageManagement />;
        case 'admin-payments': return <PaymentManagement />;
        case 'admin-instructors': return <InstructorManagement />;
        case 'admin-analytics': return <Analytics />;
        case 'admin-content': return <SiteContentManagement />;
        case 'admin-shop-products': return <ShopProductManagement />;
        case 'admin-shop-categories': return <ShopCategoryManagement />;
        case 'admin-shop-orders': return <ShopOrderManagement />;
        case 'admin-shop-analytics': return <ShopAnalytics />;
        default: return isAdmin ? <AdminDashboardPage onTabChange={handleTabChange} /> : <UserDashboard />;
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
    <>
      <div className="aura-dashboard h-screen max-h-screen bg-aura-bark flex overflow-hidden">
        {/* Desktop Sidebar (lg+) */}
        <DesktopSidebar
          sections={sections}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userName={user.name}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
        />

        {/* Tablet Sidebar (md - lg) */}
        <TabletSidebar
          sections={sections}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          userName={user.name}
          onLogout={handleLogout}
          isAdmin={isAdmin}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Header - only visible on mobile */}
          <header className="md:hidden dashboard-header bg-aura-bark border-b border-aura-umber sticky top-0 z-40 safe-top">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={toggleViewMode}
                    className="text-[10px] font-medium px-2 py-1 rounded bg-aura-sand/10 text-aura-sand border border-aura-umber"
                  >
                    {viewMode === 'admin' ? 'Admin' : 'User'}
                  </button>
                )}
                <img src="/Aura-header-black.png" alt="AURA" className="h-7 w-auto" />
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMobileMenu(prev => !prev); }}
                  className="w-8 h-8 rounded-full bg-aura-sand/20 flex items-center justify-center touch-manipulation"
                  type="button"
                >
                  <span className="text-sm font-semibold text-aura-ivory">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </button>
                {showMobileMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-aura-ink border border-aura-umber rounded-lg shadow-lg z-50 py-1">
                    <button
                      onClick={() => { handleTabChange('profile'); setShowMobileMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                    >
                      <svg className="w-4 h-4 mr-2 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { toggleViewMode(); setShowMobileMenu(false); }}
                        className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
                      >
                        {viewMode === 'user' ? (
                          <>
                            <svg className="w-4 h-4 mr-2 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Switch to Admin
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2 text-aura-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Switch to User
                          </>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-aura-umber/30"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>
          </header>

          {/* Mobile Sub-header — hamburger menu below header for all users */}
          <div className="md:hidden dashboard-subheader bg-aura-bark/80 border-b border-aura-umber px-4 py-2 flex items-center gap-3 z-30">
              <button
                onClick={() => setShowMobileDrawer(true)}
                className="p-1.5 text-aura-cream hover:text-aura-ivory hover:bg-aura-sand/10 rounded-lg transition-colors touch-manipulation flex items-center gap-2"
                aria-label="Open menu"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-xs font-medium">Menu</span>
              </button>
            </div>

          {/* Content */}
          <div ref={contentRef} className="flex-1 content-safe-bottom overflow-y-auto overscroll-contain">
            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-aura-umber"></div>
              </div>
            }>
              {renderContent()}
            </Suspense>
          </div>
        </div>

        {/* Mobile Bottom Tab Bar — sidebar-only items excluded on mobile */}
        <MobileBottomNav
          tabs={tabs.filter((t) => ['classes', 'packages', 'calendar', 'payments', 'waitlist', 'admin-classes', 'admin-packages', 'admin-instructors', 'admin-analytics', 'admin-users', 'admin-shop-categories', 'admin-shop-analytics', 'admin-payments', 'admin-content'].indexOf(t.id) === -1)}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Mobile Drawer — outside flex layout to prevent iOS Safari fixed-position bugs */}
      {showMobileDrawer && (
        <div className="md:hidden fixed top-14 left-0 right-0 bottom-0 z-50 flex touch-manipulation">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setShowMobileDrawer(false)}
          />
          <aside className="w-64 bg-aura-ink border-l border-aura-umber flex flex-col h-full max-h-full">
            <div className="flex items-center justify-between h-14 px-4 border-b border-aura-umber shrink-0">
              <h2 className="text-lg font-bold text-aura-ivory font-serif">Menu</h2>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className="p-2 text-aura-cream hover:text-aura-ivory hover:bg-aura-sand/10 rounded-lg transition-colors"
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain">
              <MobileDrawerNav
                sections={sections}
                activeTab={activeTab}
                onTabChange={(id) => { handleTabChange(id); setShowMobileDrawer(false); }}
              />
            </nav>
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-aura-umber shrink-0">
              <button
                onClick={() => { handleLogout(); setShowMobileDrawer(false); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-aura-ivory hover:bg-aura-sand/10 rounded-lg transition-colors min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardLayout;

// ---------- Mobile Drawer Navigation (grouped) ----------
// Renders collapsible parent menus for sections with multiple children.
// Auto-expands the group containing the active tab.
const MobileDrawerNav: React.FC<{
  sections: NavSection[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ sections, activeTab, onTabChange }) => {
  const activeGroupId = findActiveGroupId(sections, activeTab);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(activeGroupId ? [activeGroupId] : [])
  );

  // Keep the active group expanded when the active tab changes
  useEffect(() => {
    if (activeGroupId) {
      setExpandedGroups((prev) => new Set(prev).add(activeGroupId));
    }
  }, [activeGroupId]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      {sections.map((s) => {
        if (s.type === 'item') {
          const isActive = activeTab === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onTabChange(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors duration-200 min-h-[44px] ${
                isActive
                  ? 'bg-aura-sand/20 text-aura-ivory'
                  : 'text-aura-cream hover:bg-aura-umber/40 hover:text-aura-ivory'
              }`}
            >
              {s.icon}
              <span>{s.label}</span>
            </button>
          );
        }

        // Group
        const isExpanded = expandedGroups.has(s.id);
        const hasActiveChild = s.children.some((c) => c.id === activeTab);
        return (
          <div key={s.id} className="space-y-1">
            <button
              onClick={() => toggleGroup(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-colors duration-200 min-h-[44px] ${
                hasActiveChild
                  ? 'text-aura-ivory'
                  : 'text-aura-cream hover:bg-aura-umber/40 hover:text-aura-ivory'
              }`}
            >
              {s.icon}
              <span className="flex-1 text-left">{s.label}</span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExpanded && (
              <div className="ml-4 pl-3 border-l border-aura-umber/50 space-y-1">
                {s.children.map((child) => {
                  const isActive = activeTab === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => onTabChange(child.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium font-sans transition-colors duration-200 min-h-[40px] ${
                        isActive
                          ? 'bg-aura-sand/20 text-aura-ivory'
                          : 'text-aura-sand hover:bg-aura-umber/40 hover:text-aura-ivory'
                      }`}
                    >
                      {child.icon}
                      <span>{child.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
