import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  Users,
  Send,
  Calendar,
  Video,
  FileText,
  Scale,
  Settings,
  UserCog,
  Sliders,
  ChevronDown,
  ChevronRight,
  Scale as ScaleIcon,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { usePermission } from '../../hooks/usePermission';
import { menuItems } from '../../data/mockData';
import { cn } from '../../lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FilePlus,
  Users,
  Send,
  Calendar,
  Video,
  FileText,
  Scale,
  Settings,
  UserCog,
  Sliders,
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, currentUser } = useStore();
  const { hasRole } = usePermission();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['system']));

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filteredMenuItems = menuItems.filter(item =>
    hasRole(item.roles)
  );

  const renderMenuItem = (item: typeof menuItems[0], depth = 0) => {
    const Icon = iconMap[item.icon] || ScaleIcon;
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.key);

    if (hasChildren) {
      const visibleChildren = item.children!.filter(child => hasRole(child.roles));
      if (visibleChildren.length === 0) return null;

      return (
        <div key={item.key}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors',
              isActive
                ? 'bg-primary-800/10 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </div>
            {!sidebarCollapsed && (
              isExpanded
                ? <ChevronDown className="w-4 h-4" />
                : <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && !sidebarCollapsed && (
            <div className="mt-1 ml-4 space-y-1">
              {visibleChildren.map(child => renderMenuItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.key}
        to={item.path}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
            isActive
              ? 'bg-primary-800 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50',
            depth > 0 && 'pl-10'
          )
        }
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-800 to-primary-600 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white font-serif">
                智慧法院
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                全流程办案平台
              </p>
            </div>
          )}
        </div>
      </div>

      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-8rem)]">
        {filteredMenuItems.map(item => renderMenuItem(item))}
      </nav>

      {!sidebarCollapsed && currentUser && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-primary-800 dark:text-primary-400 font-semibold">
                {currentUser.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{
                  clerk: '书记员',
                  judge: '法官',
                  chief: '庭长',
                  president: '院长',
                  admin: '管理员',
                }[currentUser.role]}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
