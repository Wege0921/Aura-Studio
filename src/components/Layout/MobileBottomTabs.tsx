import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  UserCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import './MobileBottomTabs.css';

const tabs = [
  { label: 'Home', path: '/', icon: HomeIcon },
  { label: 'Classes', path: '/classes', icon: CalendarDaysIcon },
  { label: 'Packages', path: '/packages', icon: Squares2X2Icon },
  { label: 'Contact', path: '/contact', icon: EnvelopeIcon },
];

const MobileBottomTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show public bottom tabs inside the dashboard (it has its own nav)
  if (location.pathname.startsWith('/dashboard')) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const handleDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="mobile-bottom-tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            className={`mbt-tab ${active ? 'mbt-active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
          >
            <Icon className="mbt-icon" />
            <span className="mbt-label">{tab.label}</span>
          </button>
        );
      })}
      <button
        className={`mbt-tab ${location.pathname.startsWith('/dashboard') ? 'mbt-active' : ''}`}
        onClick={handleDashboard}
        aria-label={user ? 'Dashboard' : 'Login'}
      >
        <UserCircleIcon className="mbt-icon" />
        <span className="mbt-label">{user ? 'Profile' : 'Login'}</span>
      </button>
    </nav>
  );
};

export default MobileBottomTabs;
