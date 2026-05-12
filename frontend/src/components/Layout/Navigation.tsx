import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/user/dashboard' },
    { name: 'Classes', href: '/classes' },
    { name: 'Packages', href: '/packages' },
    { name: 'My Bookings', href: '/my-bookings' },
    { name: 'My Payments', href: '/my-payments' },
  ];

  const adminNavigationItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard' },
    { name: 'Classes', href: '/classes' },
    { name: 'Packages', href: '/packages' },
    { name: 'My Bookings', href: '/my-bookings' },
    { name: 'My Payments', href: '/my-payments' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-purple-600">AURA Yoga</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user && (
              <>
                {(user.role === 'ADMIN' ? adminNavigationItems : navigationItems).map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
                  <span className="text-sm text-gray-600">Welcome, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-purple-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {user && (
              <>
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">Welcome, {user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {(user.role === 'ADMIN' ? adminNavigationItems : navigationItems).map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-gray-700 hover:text-purple-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
