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
    const response = await api.get('/rbac/roles');
    return response.data;
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
};

export const getRole = async (roleId) => {
  try {
    const response = await api.get(`/rbac/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching role:', error);
    throw error;
  }
};

export const createRole = async (roleData) => {
  try {
    const response = await api.post('/rbac/roles', roleData);
    return response.data;
  } catch (error) {
    console.error('Error creating role:', error);
    throw error;
  }
};

export const updateRole = async (roleId, roleData) => {
  try {
    const response = await api.put(`/rbac/roles/${roleId}`, roleData);
    return response.data;
  } catch (error) {
    console.error('Error updating role:', error);
    throw error;
  }
};

export const deleteRole = async (roleId) => {
  try {
    const response = await api.delete(`/rbac/roles/${roleId}`);
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
    const response = await api.get(`/rbac/users/${userId}/roles`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

export const getUserPermissions = async (userId) => {
  try {
    const response = await api.get(`/rbac/users/${userId}/permissions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    throw error;
  }
};

export const assignRolesToUser = async (userId, roleIds) => {
  try {
    const response = await api.post(`/rbac/users/${userId}/roles`, {
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
    const response = await api.get('/rbac/menus');
    return response.data;
  } catch (error) {
    console.error('Error fetching menus:', error);
    throw error;
  }
};

export const createMenu = async (menuData) => {
  try {
    const response = await api.post('/rbac/menus', menuData);
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
    const response = await api.get('/admin/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const createUser = async (userData) => {
  try {
    const response = await api.post('/admin/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const activateUser = async (userId) => {
  try {
    const response = await api.put(`/admin/users/${userId}/activate`);
    return response.data;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

export const deactivateUser = async (userId) => {
  try {
    const response = await api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw error;
  }
};

// ============================================================================
// PLANS API
// ============================================================================

export const getPlans = async () => {
  try {
    const response = await api.get('/plans/plans');
    return response.data;
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
};

export const getPlan = async (planId) => {
  try {
    const response = await api.get(`/plans/plans/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plan:', error);
    throw error;
  }
};

export const createPlan = async (planData) => {
  try {
    const response = await api.post('/plans/plans', planData);
    return response.data;
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

export const updatePlan = async (planId, planData) => {
  try {
    const response = await api.put(`/plans/plans/${planId}`, planData);
    return response.data;
  } catch (error) {
    console.error('Error updating plan:', error);
    throw error;
  }
};

export const deletePlan = async (planId) => {
  try {
    const response = await api.delete(`/plans/plans/${planId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting plan:', error);
    throw error;
  }
};

export const assignPlanToCompany = async (companyId, planId) => {
  try {
    const response = await api.post(`/plans/companies/${companyId}/plan`, {
      company_id: companyId,
      plan_id: planId
    });
    return response.data;
  } catch (error) {
    console.error('Error assigning plan to company:', error);
    throw error;
  }
};

export const getCompanyPlan = async (companyId) => {
  try {
    const response = await api.get(`/plans/companies/${companyId}/plan`);
    return response.data;
  } catch (error) {
    console.error('Error fetching company plan:', error);
    throw error;
  }
};

// ============================================================================
// COMPANIES API
// ============================================================================

export const getCompanies = async () => {
  try {
    const response = await api.get('/admin/companies');
    return response.data;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
};
