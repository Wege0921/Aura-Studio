import React, { useState, useEffect } from 'react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

type NavSection =
  | { type: 'item'; id: string; label: string; icon: React.ReactNode }
  | { type: 'group'; id: string; label: string; icon: React.ReactNode; children: NavItem[] };

interface TabletSidebarProps {
  sections: NavSection[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userName: string;
  onLogout: () => void;
  isAdmin?: boolean;
  viewMode?: 'admin' | 'user';
  onToggleViewMode?: () => void;
}

const TabletSidebar: React.FC<TabletSidebarProps> = ({
  sections,
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

  // Auto-expand the group containing the active tab
  const activeGroupId = sections.find(
    (s): s is Extract<NavSection, { type: 'group' }> =>
      s.type === 'group' && s.children.some((c) => c.id === activeTab)
  )?.id ?? null;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(activeGroupId ? [activeGroupId] : [])
  );

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

  useEffect(() => {
    const handleClickOutside = () => setShowProfileMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <aside
      className="dashboard-sidebar hidden md:flex lg:hidden flex-col h-screen sticky top-0 bg-canvas border-r border-edge z-40 transition-all duration-300"
      style={{ width: expanded ? 200 : 72 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-edge px-3">
        <img src="/Aura-header-black.png" alt="AURA" className="aura-logo h-8 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto" aria-label="Tablet navigation">
        {sections.map((s) => {
          if (s.type === 'item') {
            const isActive = activeTab === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onTabChange(s.id)}
                className={`
                  w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-bold font-sans
                  transition-colors duration-200 min-h-[44px]
                  ${isActive
                    ? 'bg-[var(--state-selected)] text-content-emphasis'
                    : 'text-content-secondary hover:bg-[var(--state-hover)] hover:text-content-emphasis'
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
                title={!expanded ? s.label : undefined}
              >
                <span className="flex-shrink-0">{s.icon}</span>
                {expanded && <span className="truncate">{s.label}</span>}
              </button>
            );
          }

          // Collapsible group
          const isGroupExpanded = expandedGroups.has(s.id);
          const hasActiveChild = s.children.some((c) => c.id === activeTab);

          // When sidebar is collapsed (icon-only), render the group icon as a
          // direct link to its first child (quick access) with a tooltip.
          if (!expanded) {
            return (
              <button
                key={s.id}
                onClick={() => onTabChange(s.children[0].id)}
                className={`
                  w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-bold font-sans
                  transition-colors duration-200 min-h-[44px]
                  ${hasActiveChild
                    ? 'bg-[var(--state-selected)] text-content-emphasis'
                    : 'text-content-secondary hover:bg-[var(--state-hover)] hover:text-content-emphasis'
                  }
                `}
                title={s.label}
              >
                <span className="flex-shrink-0">{s.icon}</span>
              </button>
            );
          }

          // When sidebar is expanded, render the full collapsible group
          return (
            <div key={s.id} className="space-y-1">
              <button
                onClick={() => toggleGroup(s.id)}
                className={`
                  w-full flex items-center gap-3 px-2.5 py-3 rounded-lg text-base font-bold font-sans
                  transition-colors duration-200 min-h-[48px]
                  ${hasActiveChild
                    ? 'text-content-emphasis'
                    : 'text-content-secondary hover:bg-[var(--state-hover)] hover:text-content-emphasis'
                  }
                `}
                aria-expanded={isGroupExpanded}
              >
                <span className="flex-shrink-0">{s.icon}</span>
                <span className="flex-1 text-left truncate">{s.label}</span>
                <svg
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isGroupExpanded && (
                <div className="ml-4 pl-3 border-l border-edge-subtle space-y-1">
                  {s.children.map((child) => {
                    const isActive = activeTab === child.id;
                    return (
                      <button
                        key={child.id}
                        onClick={() => onTabChange(child.id)}
                        className={`
                          w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-bold font-sans
                          transition-colors duration-200 min-h-[40px]
                          ${isActive
                            ? 'bg-[var(--state-selected)] text-content-emphasis'
                            : 'text-content-secondary hover:bg-[var(--state-hover)] hover:text-content-emphasis'
                          }
                        `}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <span className="flex-shrink-0">{child.icon}</span>
                        <span className="truncate">{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profile Dropdown */}
      <div className="p-2 border-t border-edge relative">
        <button
          onClick={(e) => { e.stopPropagation(); setShowProfileMenu(prev => !prev); }}
          className="w-full flex items-center justify-center gap-2 px-2.5 py-2 hover:bg-[var(--state-hover)] rounded-lg transition-colors"
          title={userName}
        >
          <div className="w-7 h-7 rounded-full bg-[var(--state-selected)] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-content-emphasis">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {expanded && <span className="text-sm text-content-secondary truncate">{userName}</span>}
        </button>
        {showProfileMenu && (
          <div className={`absolute bottom-full mb-2 bg-surface border border-edge rounded-lg shadow-lg z-50 py-1 ${expanded ? 'left-2 right-2' : 'left-2 min-w-[170px]'}`}>
            <button
              onClick={() => { onTabChange('profile'); setShowProfileMenu(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-content hover:bg-[var(--state-hover)]"
            >
              <svg className="w-4 h-4 mr-2 text-content-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </button>
            {isAdmin && onToggleViewMode && (
              <button
                onClick={() => { onToggleViewMode(); setShowProfileMenu(false); }}
                className="flex items-center w-full px-4 py-2 text-sm text-content hover:bg-[var(--state-hover)]"
              >
                {viewMode === 'user' ? (
                  <>
                    <svg className="w-4 h-4 mr-2 text-content-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Switch to Admin
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 text-content-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Switch to User
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => { onLogout(); setShowProfileMenu(false); }}
              className="flex items-center w-full px-4 py-2 text-sm text-danger hover:bg-[var(--state-hover)]"
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
