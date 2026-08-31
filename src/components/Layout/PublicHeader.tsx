import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ThemeToggle';
// TODO(shop): uncomment to re-enable shop cart in the header.
// import { useShopCart } from '../../contexts/ShopCartContext';
// import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import './PublicHeader.css';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  // TODO(shop): uncomment to re-enable shop cart in the header.
  // const { totalItems, openCart } = useShopCart();
  const isAdmin = user?.role === 'ADMIN';
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isLandingPage = location.pathname === '/' || location.pathname === '/home';

  const toggleMenu = () => setMenuOpen((o) => !o);
  const closeMenu = () => setMenuOpen(false);

  const handleBook = () => {
    closeMenu();
    navigate('/packages');
  };

  const handleClasses = () => {
    closeMenu();
    navigate('/classes');
  };

  const handlePackages = () => {
    closeMenu();
    navigate('/packages');
  };

  // const handleShop = () => {
  //   closeMenu();
  //   navigate('/shop');
  // };

  const handleContact = () => {
    closeMenu();
    navigate('/contact');
  };

  const handleLogin = () => {
    closeMenu();
    navigate('/login');
  };

  const handleRegister = () => {
    closeMenu();
    navigate('/register');
  };

  const handleDashboard = () => {
    closeMenu();
    navigate('/dashboard');
  };

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    closeMenu();
    if (isLandingPage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const handleNav = (target: string) => {
    closeMenu();
    if (isLandingPage) {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      switch (target) {
        case 'top':
          navigate('/');
          break;
        case 'pilates':
          navigate('/packages');
          break;
        case 'prenatal':
          navigate('/packages');
          break;
        case 'postpartum':
          navigate('/packages');
          break;
        case 'approach':
          navigate('/');
          break;
        case 'footer':
          navigate('/');
          break;
        default:
          navigate('/');
      }
    }
  };

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  return (
    <div className="public-header">
      {/* Overlay + Drawer */}
      <div className={`ph-overlay ${menuOpen ? 'ph-open' : ''}`} onClick={closeMenu} />
      <div className={`ph-drawer ${menuOpen ? 'ph-open' : ''}`}>
        <button className="ph-drawer-close" onClick={closeMenu} aria-label="Close menu">
          <span></span>
          <span></span>
        </button>
        <button onClick={() => handleNav('top')}>Home</button>
        <button onClick={handleClasses}>Classes</button>
        <button onClick={handlePackages}>Packages</button>
        {/* <button onClick={handleShop}>Shop</button> */}
        <button onClick={() => handleNav('approach')}>About</button>
        <button onClick={handleContact}>Contact</button>
        {user ? (
          <>
            <button onClick={handleDashboard}>Dashboard</button>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleRegister}>Register</button>
          </>
        )}
        <div className="ph-drawer-theme">
          <span>Theme</span>
          <ThemeToggle />
        </div>
        <a
          href="https://tiktok.com/@aurastudioet"
          target="_blank"
          rel="noopener noreferrer"
          className="ph-drawer-insta"
          onClick={closeMenu}
        >
          @aurastudioet
        </a>
      </div>

      {/* Nav Bar */}
      <header className={`ph-nav ${isLandingPage ? 'ph-landing' : ''}`}>
        <button className="ph-logo" onClick={handleLogoClick}>
          <img src="/Aura-header-black.png" alt="AURA" className="h-12 w-auto" />
        </button>
        <nav className="ph-links">
          <button onClick={() => handleNav('top')}>Home</button>
          <button onClick={handleClasses}>Classes</button>
          <button onClick={handlePackages}>Packages</button>
          {/* <button onClick={handleShop}>Shop</button> */}
          <button onClick={() => handleNav('approach')}>About</button>
          <button onClick={handleContact}>Contact</button>
        </nav>
        <div className="ph-desktop-actions">
          <ThemeToggle className="hidden md:inline-flex" />
          {/* TODO(shop): cart button — uncomment to re-enable.
          <button onClick={openCart} className="ph-cart-btn inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-[var(--state-hover)] transition-colors" aria-label="Cart" style={{ position: 'relative' }}>
            <ShoppingBagIcon className="w-5 h-5" />
            {totalItems > 0 && (
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                background: 'var(--accent-600)', color: 'var(--text-on-accent)', fontSize: '10px',
                fontWeight: 700, borderRadius: '9999px', minWidth: '18px',
                height: '18px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', padding: '0 4px',
              }}>{totalItems}</span>
            )}
          </button>
          */}
          {user ? (
            <div className="ph-user-dropdown" ref={userMenuRef}>
              <button
                className="ph-user-avatar"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="Account menu"
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="ph-user-menu">
                  <div className="ph-user-menu-header">
                    <span className="ph-user-menu-name">{user.name}</span>
                    <span className="ph-user-menu-email">{user.email}</span>
                  </div>
                  <button onClick={() => { setUserMenuOpen(false); handleDashboard(); }} className="ph-user-menu-item">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </button>
                  <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="ph-user-menu-item ph-user-menu-logout">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="ph-auth-btns">
              <button className="ph-btn ph-btn-outline" onClick={handleLogin}>
                Login
              </button>
              <button className="ph-btn ph-btn-light" onClick={handleBook}>
                View Packages
              </button>
            </div>
          )}
        </div>
        <button
          className={`ph-burger ${menuOpen ? 'ph-open' : ''}`}
          aria-label="Menu"
          onClick={toggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
    </div>
  );
};

export default PublicHeader;
