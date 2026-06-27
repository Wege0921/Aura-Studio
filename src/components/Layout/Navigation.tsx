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
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Classes', href: '/classes' },
    { name: 'Packages', href: '/packages' },
  ];

  const adminNavigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Classes', href: '/classes' },
    { name: 'Packages', href: '/packages' },
  ];

  return (
    <nav className="bg-aura-bark shadow-lg sticky top-0 z-50 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src="/Aura-header-black.png" alt="AURA" className="h-8 w-auto" />
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
                    className="text-aura-sand hover:text-aura-clay px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                ))}
                <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-aura-sand/10">
                  <span className="text-sm text-aura-sand/70">Welcome, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-aura-clay text-aura-ink px-3 py-1 rounded-md text-sm font-medium hover:bg-aura-sand transition-colors duration-200"
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
              className="inline-flex items-center justify-center p-2 rounded-md text-aura-sand hover:text-aura-clay hover:bg-aura-sand/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-aura-clay"
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
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-aura-bark border-t border-aura-sand/10">
            {user && (
              <>
                <div className="px-3 py-2 border-b border-aura-sand/10">
                  <p className="text-sm font-medium text-aura-ivory">Welcome, {user.name}</p>
                  <p className="text-xs text-aura-sand/50">{user.email}</p>
                </div>
                {(user.role === 'ADMIN' ? adminNavigationItems : navigationItems).map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-aura-sand hover:text-aura-clay hover:bg-aura-sand/5 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-aura-sand hover:text-aura-clay hover:bg-aura-sand/5 block px-3 py-2 rounded-md text-base font-medium"
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
