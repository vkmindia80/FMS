import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  KeyIcon,
  RectangleStackIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  EyeIcon,
  TableCellsIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import {
  getRoles,
  getPermissions,
  createRole,
  updateRole,
  deleteRole,
  getUsers,
  getUserRoles,
  assignRolesToUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  getCompanies,
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
} from '../../services/rbac';

const EnhancedAdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View modes
  const [usersViewMode, setUsersViewMode] = useState('card');
  const [rolesViewMode, setRolesViewMode] = useState('card');
  
  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isRoleViewModalOpen, setIsRoleViewModalOpen] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewingRole, setViewingRole] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const [usersData, companiesData] = await Promise.all([
          getUsers(),
          getCompanies().catch(() => [])
        ]);
        setUsers(usersData);
        setCompanies(companiesData);
      } else if (activeTab === 'roles') {
        const rolesData = await getRoles();
        setRoles(rolesData);
      } else if (activeTab === 'permissions') {
        const permsData = await getPermissions();
        setPermissions(permsData);
      } else if (activeTab === 'plans') {
        const plansData = await getPlans();
        setPlans(plansData);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'users', name: 'Users', icon: UserGroupIcon, count: users.length },
    { id: 'roles', name: 'Roles', icon: ShieldCheckIcon, count: roles.length },
    { id: 'permissions', name: 'Permissions', icon: KeyIcon, count: permissions.length },
    { id: 'plans', name: 'Plans', icon: RectangleStackIcon, count: plans.length }
  ];

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = permissions.filter(perm =>
    perm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perm.resource?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPlans = plans.filter(plan =>
    plan.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserDelete = async (user) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.full_name}?`)) {
      try {
        await deleteUser(user.id);
        toast.success('User deactivated successfully');
        loadData();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to deactivate user');
      }
    }
  };

  const handleUserToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await deactivateUser(user.id);
        toast.success('User deactivated successfully');
      } else {
        await activateUser(user.id);
        toast.success('User activated successfully');
      }
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to toggle user status');
    }
  };

  const handleViewRole = async (role) => {
    setViewingRole(role);
    setIsRoleViewModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
                Admin Panel
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Manage users, roles, permissions, and plans
              </p>
            </div>
            
            {activeTab === 'users' && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setIsUserModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                data-testid="create-user-btn"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create User
              </button>
            )}

            {activeTab === 'roles' && (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedRole(null);
                    setIsRoleModalOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                  data-testid="create-role-btn"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Quick Create
                </button>
                <button
                  onClick={() => window.location.href = '/admin/permission-template/new'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                  data-testid="create-template-btn"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Permission Template
                </button>
              </div>
            )}

            {activeTab === 'plans' && (
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setIsPlanModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                data-testid="create-plan-btn"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Plan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Tab Headers */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px" data-testid="admin-tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchTerm('');
                    }}
                    className={`
                      flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all
                      ${activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      }
                    `}
                    data-testid={`tab-${tab.id}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                      <span className={`
                        ml-2 px-2 py-0.5 rounded-full text-xs font-semibold
                        ${activeTab === tab.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {tab.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search Bar and View Toggle */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-testid="search-input"
                />
              </div>

              {/* View Mode Toggle for Users and Roles */}
              {(activeTab === 'users' || activeTab === 'roles') && (
                <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => activeTab === 'users' ? setUsersViewMode('card') : setRolesViewMode('card')}
                    className={`p-2 rounded ${
                      (activeTab === 'users' ? usersViewMode : rolesViewMode) === 'card'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="Card View"
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => activeTab === 'users' ? setUsersViewMode('list') : setRolesViewMode('list')}
                    className={`p-2 rounded ${
                      (activeTab === 'users' ? usersViewMode : rolesViewMode) === 'list'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                    title="List View"
                  >
                    <TableCellsIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : (
              <>
                {activeTab === 'users' && (
                  <UsersTab 
                    users={filteredUsers}
                    viewMode={usersViewMode}
                    companies={companies}
                    onManageRoles={(user) => {
                      setSelectedUser(user);
                      setIsUserRoleModalOpen(true);
                    }}
                    onEdit={(user) => {
                      setSelectedUser(user);
                      setIsUserModalOpen(true);
                    }}
                    onDelete={handleUserDelete}
                    onToggleActive={handleUserToggleActive}
                    onViewRole={handleViewRole}
                  />
                )}
                {activeTab === 'roles' && (
                  <RolesTab 
                    roles={filteredRoles}
                    viewMode={rolesViewMode}
                    onEdit={(role) => {
                      setSelectedRole(role);
                      setIsRoleModalOpen(true);
                    }}
                    onDelete={async (role) => {
                      if (window.confirm(`Delete role "${role.name}"?`)) {
                        try {
                          await deleteRole(role.id);
                          toast.success('Role deleted successfully');
                          loadData();
                        } catch (error) {
                          toast.error(error.response?.data?.detail || 'Failed to delete role');
                        }
                      }
                    }}
                    onView={handleViewRole}
                  />
                )}
                {activeTab === 'permissions' && (
                  <PermissionsTab permissions={filteredPermissions} />
                )}
                {activeTab === 'plans' && (
                  <PlansTab 
                    plans={filteredPlans}
                    onEdit={(plan) => {
                      setSelectedPlan(plan);
                      setIsPlanModalOpen(true);
                    }}
                    onDelete={async (plan) => {
                      if (window.confirm(`Delete plan "${plan.display_name}"?`)) {
                        try {
                          await deletePlan(plan.id);
                          toast.success('Plan deleted successfully');
                          loadData();
                        } catch (error) {
                          toast.error(error.response?.data?.detail || 'Failed to delete plan');
                        }
                      }
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        permissions={permissions}
        onSuccess={() => {
          setIsRoleModalOpen(false);
          setSelectedRole(null);
          loadData();
        }}
      />

      <UserRoleModal
        isOpen={isUserRoleModalOpen}
        onClose={() => {
          setIsUserRoleModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        roles={roles}
        onSuccess={() => {
          setIsUserRoleModalOpen(false);
          setSelectedUser(null);
          loadData();
        }}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        companies={companies}
        onSuccess={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
          loadData();
        }}
      />

      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSuccess={() => {
          setIsPlanModalOpen(false);
          setSelectedPlan(null);
          loadData();
        }}
      />

      <RoleViewModal
        isOpen={isRoleViewModalOpen}
        onClose={() => {
          setIsRoleViewModalOpen(false);
          setViewingRole(null);
        }}
        role={viewingRole}
      />
    </div>
  );
};

export default EnhancedAdminPanelPage;