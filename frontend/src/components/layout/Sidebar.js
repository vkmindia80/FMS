import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import {
  HomeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  BuildingOfficeIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
  PuzzlePieceIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ isMobile, isOpen, onClose }) => {
  const { darkMode, sidebarCollapsed, toggleSidebar, currentScheme } = useTheme();
  const { user, logout } = useAuth();
  const { hasPermission, hasAnyPermission, permissionNames, loading: permissionsLoading } = usePermissions();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Navigation items with permission requirements
  const allNavigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      color: 'blue',
      badge: null,
      permissions: ['dashboard:view'],
    },
    {
      name: 'Documents',
      href: '/documents',
      icon: DocumentTextIcon,
      color: 'purple',
      badge: null,
      permissions: ['documents:view'],
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: CreditCardIcon,
      color: 'green',
      badge: null,
      permissions: ['transactions:view'],
    },
    {
      name: 'Accounts',
      href: '/accounts',
      icon: BanknotesIcon,
      color: 'orange',
      badge: null,
      permissions: ['accounts:view'],
    },
    {
      name: 'Reconciliation',
      href: '/reconciliation',
      icon: CheckCircleIcon,
      color: 'purple',
      badge: null,
      permissions: ['reconciliation:view'],
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: ChartBarIcon,
      color: 'red',
      badge: null,
      permissions: ['reports:view'],
    },
    {
      name: 'Currency',
      href: '/currency',
      icon: CurrencyDollarIcon,
      color: 'teal',
      badge: null,
      permissions: ['settings:view'],
    },
    {
      name: 'Integration',
      href: '/integration',
      icon: PuzzlePieceIcon,
      color: 'violet',
      badge: null,
      permissions: ['integrations:view'],
    },
    {
      name: 'Admin Panel',
      href: '/admin',
      icon: ShieldCheckIcon,
      color: 'indigo',
      badge: 'Admin',
      permissions: ['users:manage', 'roles:view'],
    },
  ];

  const allBottomItems = [
    {
      name: 'Help Center',
      href: '/help',
      icon: QuestionMarkCircleIcon,
      color: 'gray',
      permissions: [],
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      color: 'gray',
      permissions: ['settings:view'],
    },
  ];

  // Filter navigation items based on permissions
  // While loading, show all items to avoid empty sidebar
  const navigationItems = permissionsLoading 
    ? allNavigationItems 
    : allNavigationItems.filter(item => {
        if (!item.permissions || item.permissions.length === 0) return true;
        return hasAnyPermission(item.permissions);
      });

  const bottomItems = permissionsLoading 
    ? allBottomItems 
    : allBottomItems.filter(item => {
        if (!item.permissions || item.permissions.length === 0) return true;
        return hasAnyPermission(item.permissions);
      });

  // ✅ FALLBACK: If user has no permissions and not loading, show at least Dashboard and Settings
  // This ensures the sidebar is never completely empty (safety net)
  const hasNoPermissions = !permissionsLoading && permissionNames.length === 0;
  const finalNavigationItems = hasNoPermissions && navigationItems.length === 0
    ? [allNavigationItems[0]] // Show at least Dashboard
    : navigationItems;
  
  const finalBottomItems = hasNoPermissions && bottomItems.length === 0
    ? allBottomItems // Show Help Center and Settings when no permissions
    : bottomItems;

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const getIconColor = (color, isCurrentActive) => {
    if (isCurrentActive) {
      const schemeName = currentScheme?.name || 'Default';
      switch (schemeName) {
        case 'Warm':
          return 'text-orange-600 dark:text-orange-400';
        case 'Cool':
          return 'text-cyan-600 dark:text-cyan-400';
        case 'Monochrome':
          return 'text-gray-900 dark:text-gray-100';
        default:
          return 'text-blue-600 dark:text-blue-400';
      }
    }
    
    const colorMap = {
      blue: 'text-blue-500',
      purple: 'text-purple-500',
      green: 'text-emerald-500',
      orange: 'text-orange-500',
      red: 'text-red-500',
      gray: 'text-gray-400',
    };
    
    return `${colorMap[color] || 'text-gray-400'} group-hover:text-gray-600 dark:group-hover:text-gray-200`;
  };

  const getBadgeColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="flex items-center p-6 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          className="flex items-center"
          animate={{ justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'flex-start' }}
          transition={{ duration: 0.2 }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3"
              >
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AFMS</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Finance Management</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}

        {/* Desktop collapse button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            data-testid="sidebar-toggle"
          >
            {sidebarCollapsed ? (
              <ChevronDoubleRightIcon className="h-5 w-5" />
            ) : (
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-3 min-w-0 flex-1"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.company_name || 'Company'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ✅ Warning Banner: Show when user has no permissions (fallback active) */}
      {hasNoPermissions && (
        <div className="mx-4 mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
            ⚠️ Limited access - contact your administrator to assign roles
          </p>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {finalNavigationItems.map((item) => {
          const Icon = item.icon;
          const isCurrentActive = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 ${
                isCurrentActive
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 shadow-sm'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onMouseEnter={() => setHoveredItem(item.name)}
              onMouseLeave={() => setHoveredItem(null)}
              data-testid={`nav-${item.name.toLowerCase()}`}
            >
              <Icon className={`h-5 w-5 ${getIconColor(item.color, isCurrentActive)} transition-colors`} />
              
              <AnimatePresence>
                {(!sidebarCollapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 flex-1 flex items-center justify-between"
                  >
                    <span className={`text-sm font-medium ${
                      isCurrentActive
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                    } transition-colors`}>
                      {item.name}
                    </span>
                    
                    {item.badge && (
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        getBadgeColor(item.color)
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {finalBottomItems.map((item) => {
          const Icon = item.icon;
          const isCurrentActive = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isCurrentActive
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
              }`}
              data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="h-5 w-5 transition-colors" />
              
              <AnimatePresence>
                {(!sidebarCollapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -5 }}
                    transition={{ duration: 0.2 }}
                    className="ml-3 text-sm font-medium"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          data-testid="logout-button"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          
          <AnimatePresence>
            {(!sidebarCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                transition={{ duration: 0.2 }}
                className="ml-3 text-sm font-medium"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onClose}
            />
            
            {/* Mobile Sidebar */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 z-50 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      animate={{ width: sidebarCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm"
      data-testid="desktop-sidebar"
    >
      {sidebarContent}
    </motion.div>
  );
};

export default Sidebar;