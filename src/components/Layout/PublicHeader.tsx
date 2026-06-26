import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './PublicHeader.css';

const PublicHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [menuOpen, setMenuOpen] = useState(false);

  const isLandingPage = location.pathname === '/' || location.pathname === '/home';

  const toggleMenu = () => setMenuOpen((o) => !o);
  const closeMenu = () => setMenuOpen(false);

  const handleBook = () => {
    closeMenu();
    navigate('/packages');
  };

  /* Classes hidden for now — packages only
  const handleClasses = () => {
    closeMenu();
    navigate('/classes');
  };
  */

  const handlePackages = () => {
    closeMenu();
    navigate('/packages');
  };

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
        {/* <button onClick={handleClasses}>Classes</button> */}
        <button onClick={handlePackages}>Packages</button>
        <button onClick={() => handleNav('approach')}>About</button>
        <button onClick={handleContact}>Contact</button>
        {user ? (
          <>
            {isAdmin && (
              <button onClick={handleDashboard}>Admin</button>
            )}
            <button onClick={handleDashboard}>Dashboard</button>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleRegister}>Register</button>
          </>
        )}
        <a
          href="https://instagram.com/aurapilates"
          target="_blank"
          rel="noopener noreferrer"
          className="ph-drawer-insta"
          onClick={closeMenu}
        >
          @aurapilates
        </a>
      </div>

      {/* Nav Bar */}
      <header className={`ph-nav ${isLandingPage ? 'ph-landing' : ''}`}>
        <button className="ph-logo" onClick={handleLogoClick}>
          AURA
        </button>
        <nav className="ph-links">
          <button onClick={() => handleNav('top')}>Home</button>
          {/* <button onClick={handleClasses}>Classes</button> */}
          <button onClick={handlePackages}>Packages</button>
          <button onClick={() => handleNav('approach')}>About</button>
          <button onClick={handleContact}>Contact</button>
        </nav>
        {user ? (
          <div className="ph-auth-btns">
            {isAdmin && (
              <button className="ph-btn ph-btn-light" onClick={handleDashboard}>
                Admin
              </button>
            )}
            <button className="ph-btn ph-btn-outline" onClick={handleLogout}>
              Logout
            </button>
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
