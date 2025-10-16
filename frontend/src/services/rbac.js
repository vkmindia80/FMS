import api from './api';

// ============================================================================
// PERMISSIONS API
// ============================================================================

export const getPermissions = async (resource = null) => {
  try {
    const params = resource ? { resource } : {};
    const response = await api.get('/rbac/permissions', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching permissions:', error);
    throw error;
  }
};

export const createPermission = async (permissionData) => {
  try {
    const response = await api.post('/rbac/permissions', permissionData);
    return response.data;
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
};

// ============================================================================
// ROLES API
// ============================================================================

export const getRoles = async () => {
  try {
    const response = await api.get('/api/rbac/roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const getRole = async (roleId) => {
  try {
    const response = await api.get(`/api/rbac/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching role:', error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await api.post('/api/rbac/roles', roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

export const updateRole = async (roleId, roleData) => {
  try {
    const response = await api.put(`/api/rbac/roles/${roleId}`, roleData);
    return response.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

export const deleteRole = async (roleId) => {
  try {
    const response = await api.delete(`/api/rbac/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
};

// ============================================================================
// USER ROLES API
// ============================================================================

export const getUserRoles = async (userId) => {
  try {
    const response = await api.get(`/api/rbac/users/${userId}/roles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

export const getUserPermissions = async (userId) => {
  try {
    const response = await api.get(`/api/rbac/users/${userId}/permissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }
};

export const assignRolesToUser = async (userId, roleIds) => {
  try {
    const response = await api.post(`/api/rbac/users/${userId}/roles`, {
      user_id: userId,
      role_ids: roleIds
    });
    return response.data;
  } catch (error) {
    console.error('Error assigning roles to user:', error);
    throw error;
  }
};

// ============================================================================
// MENUS API
// ============================================================================

export const getMenus = async () => {
  try {
    const response = await api.get('/api/rbac/menus');
    return response.data;
  } catch (error) {
    console.error('Error fetching menus:', error);
    throw error;
  }
};

export const createMenu = async (menuData) => {
  try {
    const response = await api.post('/api/rbac/menus', menuData);
    return response.data;
  } catch (error) {
    console.error('Error creating menu:', error);
    throw error;
  }
};

// ============================================================================
// USERS API (for admin panel)
// ============================================================================

export const getUsers = async () => {
  try {
    const response = await api.get('/api/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};
