import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 * 
 * @param {string|string[]} permission - Single permission or array of permissions
 * @param {boolean} requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 * @param {React.ReactNode} fallback - Component to render when permission check fails
 * @param {React.ReactNode} children - Content to render when permission check passes
 */
const PermissionGuard = ({ 
  permission, 
  requireAll = false, 
  fallback = null, 
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Handle single permission
  if (typeof permission === 'string') {
    return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
  }

  // Handle array of permissions
  if (Array.isArray(permission)) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
    
    return hasAccess ? <>{children}</> : <>{fallback}</>;
  }

  // No permission specified, render children
  return <>{children}</>;
};

/**
 * Hook version for functional components
 * Usage: const canEdit = useHasPermission('transactions:edit');
 */
export const useHasPermission = (permission) => {
  const { hasPermission, loading } = usePermissions();
  
  if (loading) return false;
  return hasPermission(permission);
};

/**
 * Hook for checking multiple permissions (ANY)
 * Usage: const canManage = useHasAnyPermission(['users:edit', 'users:create']);
 */
export const useHasAnyPermission = (permissions) => {
  const { hasAnyPermission, loading } = usePermissions();
  
  if (loading) return false;
  return hasAnyPermission(permissions);
};

/**
 * Hook for checking multiple permissions (ALL)
 * Usage: const canFullAccess = useHasAllPermissions(['users:edit', 'users:create', 'users:delete']);
 */
export const useHasAllPermissions = (permissions) => {
  const { hasAllPermissions, loading } = usePermissions();
  
  if (loading) return false;
  return hasAllPermissions(permissions);
};

export default PermissionGuard;
