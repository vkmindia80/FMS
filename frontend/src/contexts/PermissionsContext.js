import { createContext, useContext, useState, useEffect } from 'react';
import { getUserPermissions } from '../services/rbac';
import { useAuth } from './AuthContext';

const PermissionsContext = createContext({
  permissions: [],
  permissionNames: [],
  loading: true,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refetchPermissions: () => {},
});

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user?.id) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userPermissions = await getUserPermissions(user.id);
      setPermissions(userPermissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user?.id]);

  const permissionNames = permissions.map(p => p.name);

  const hasPermission = (permissionName) => {
    if (!permissionName) return true;
    return permissionNames.includes(permissionName);
  };

  const hasAnyPermission = (permissionsList) => {
    if (!permissionsList || permissionsList.length === 0) return true;
    return permissionsList.some(perm => permissionNames.includes(perm));
  };

  const hasAllPermissions = (permissionsList) => {
    if (!permissionsList || permissionsList.length === 0) return true;
    return permissionsList.every(perm => permissionNames.includes(perm));
  };

  const refetchPermissions = () => {
    fetchPermissions();
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        permissionNames,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export default PermissionsContext;
