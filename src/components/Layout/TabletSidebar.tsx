import React, { useState, useEffect } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabletSidebarProps {
  tabs: NavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userName: string;
  onLogout: () => void;
  isAdmin?: boolean;
  viewMode?: 'admin' | 'user';
  onToggleViewMode?: () => void;
}

const TabletSidebar: React.FC<TabletSidebarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  userName,
  onLogout,
  isAdmin = false,
  viewMode = 'admin',
  onToggleViewMode,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => setShowProfileMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <aside
      className="hidden md:flex lg:hidden flex-col h-screen sticky top-0 bg-aura-bark border-r border-aura-sand/10 z-40 transition-all duration-300"
      style={{ width: expanded ? 200 : 72 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-aura-sand/10 px-3">
        <img src="/Aura-header-black.png" alt="AURA" className="h-8 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Tablet navigation">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium font-sans
                transition-colors duration-200 min-h-[44px]
                ${isActive
                  ? 'bg-aura-sand/20 text-aura-ivory'
                  : 'text-aura-sand hover:bg-aura-umber/40 hover:text-aura-ivory'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              {expanded && <span className="truncate">{tab.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Profile Dropdown */}
      <div className="p-2 border-t border-aura-sand/10 relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowProfileMenu(prev => !prev); }}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 hover:bg-aura-sand/10 rounded-lg transition-colors"
          title={userName}
        >
          <div className="w-7 h-7 rounded-full bg-aura-sand/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-aura-ivory">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {expanded && <span className="text-sm text-aura-sand truncate">{userName}</span>}
        </button>
        {showProfileMenu && (
          <div className={`absolute bottom-full mb-2 bg-aura-ink border border-aura-sand/20 rounded-lg shadow-lg z-50 py-1 ${expanded ? 'left-2 right-2' : 'left-2 min-w-[170px]'}`}>
            {isAdmin && onToggleViewMode && (
              <button
                onClick={() => { onToggleViewMode(); setShowProfileMenu(false); }}
                className="flex items-center w-full px-4 py-2 text-sm text-aura-cream hover:bg-aura-umber/30"
              >
                {viewMode === 'user' ? (
                  <>
                    <svg className="w-4 h-4 mr-2 text-aura-sand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Switch to Admin
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 text-aura-sand flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Switch to User
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => { onLogout(); setShowProfileMenu(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-aura-umber/30"
            >
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default TabletSidebar;
