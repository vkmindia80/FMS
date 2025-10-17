import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  ShieldCheckIcon, 
  RectangleStackIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const AdminPanelPage = () => {
  const navigate = useNavigate();

  const adminSections = [
    {
      id: 'users',
      name: 'User Management',
      description: 'Create, edit, and manage user accounts across your organization',
      icon: UserGroupIcon,
      color: 'blue',
      href: '/admin/users',
      features: ['Create users', 'Assign roles', 'System users', 'Card & Table views']
    },
    {
      id: 'roles',
      name: 'Roles & Permissions',
      description: 'Configure role-based access control and permission management',
      icon: ShieldCheckIcon,
      color: 'purple',
      href: '/admin/roles-permissions',
      features: ['Role management', 'Permission assignment', 'Access control', 'Card & Table views']
    },
    {
      id: 'plans',
      name: 'Plans Management',
      description: 'Manage subscription plans and feature access control',
      icon: RectangleStackIcon,
      color: 'green',
      href: '/admin/plans',
      features: ['Create plans', 'Menu access', 'Assign to companies', 'Pricing management']
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        gradient: 'from-blue-500 to-blue-600',
        icon: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      },
      purple: {
        gradient: 'from-purple-500 to-purple-600',
        icon: 'text-purple-600',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      },
      green: {
        gradient: 'from-green-500 to-green-600',
        icon: 'text-green-600',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Administration Panel
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage users, roles, permissions, and subscription plans
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const colorClasses = getColorClasses(section.color);
          const Icon = section.icon;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer overflow-hidden"
              onClick={() => navigate(section.href)}
              data-testid={`admin-section-${section.id}`}
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-r ${colorClasses.gradient} p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {section.name}
                </h3>
                <p className="text-white/90 text-sm">
                  {section.description}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Key Features:
                  </h4>
                  {section.features.map((feature, index) => (
                    <div 
                      key={index} 
                      className="flex items-center text-sm text-gray-600 dark:text-gray-400"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${colorClasses.icon} mr-2`} />
                      {feature}
                    </div>
                  ))}
                </div>

                <button
                  className={`mt-4 w-full px-4 py-2 ${colorClasses.badge} rounded-lg font-medium hover:opacity-80 transition-opacity flex items-center justify-center`}
                  data-testid={`open-${section.id}-button`}
                >
                  Open {section.name}
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Admin Panel Access
            </h3>
            <div className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p>
                • <strong>User Management:</strong> Full control over user accounts, including creating system users with multi-company access
              </p>
              <p>
                • <strong>Roles & Permissions:</strong> Configure granular access control with permission-based role management
              </p>
              <p>
                • <strong>Plans Management:</strong> Define subscription plans and control feature availability per company
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg p-3">
              <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                User Management
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Active
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900 rounded-lg p-3">
              <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                RBAC System
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Configured
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-lg p-3">
              <RectangleStackIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Plans System
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Operational
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

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
    { id: 'permissions', name: 'Permissions', icon: KeyIcon, count: permissions.length }
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
                Manage users, roles, and permissions
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

          {/* Search Bar */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="relative">
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
                    onManageRoles={(user) => {
                      setSelectedUser(user);
                      setIsUserRoleModalOpen(true);
                    }}
                  />
                )}
                {activeTab === 'roles' && (
                  <RolesTab 
                    roles={filteredRoles}
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
                  />
                )}
                {activeTab === 'permissions' && (
                  <PermissionsTab permissions={filteredPermissions} />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role Modal */}
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

      {/* User Role Assignment Modal */}
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
    </div>
  );
};

// ============================================================================
// USERS TAB
// ============================================================================

const UsersTab = ({ users, onManageRoles, onEdit, onDelete, onToggleActive }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="users-list">
      {users.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-all"
            data-testid={`user-card-${user.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user.full_name || 'Unknown User'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Company:</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">{user.company_name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Role:</span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-semibold capitalize">
                  {user.role || 'No role'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                  user.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => onManageRoles(user)}
                className="flex-1 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
                data-testid={`manage-roles-btn-${user.id}`}
              >
                Roles
              </button>
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title="Edit"
                data-testid={`edit-user-btn-${user.id}`}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onToggleActive(user)}
                className={`p-2 rounded-lg transition-colors ${
                  user.is_active 
                    ? 'text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30' 
                    : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                }`}
                title={user.is_active ? 'Disable' : 'Enable'}
                data-testid={`toggle-user-btn-${user.id}`}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(user)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                title="Delete"
                data-testid={`delete-user-btn-${user.id}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================================
// ROLES TAB
// ============================================================================

const RolesTab = ({ roles, onEdit, onDelete }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="roles-list">
      {roles.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500 dark:text-gray-400">No roles found</p>
        </div>
      ) : (
        roles.map((role) => (
          <div
            key={role.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all"
            data-testid={`role-card-${role.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {role.name}
                  </h3>
                  {role.is_system && (
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded-full font-semibold">
                      System
                    </span>
                  )}
                  {role.applicable_on && role.applicable_on !== 'all' && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-semibold">
                      {role.applicable_on === 'admin_users' ? 'Admin' : 'Non-Admin'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {role.description || 'No description'}
                </p>
              </div>
              
              {!role.is_system && (
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/admin/permission-template/${role.id}`}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="Edit in Permission Template"
                    data-testid={`template-edit-btn-${role.id}`}
                  >
                    <ShieldCheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(role)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                    title="Quick Edit"
                    data-testid={`edit-role-btn-${role.id}`}
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(role)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                    data-testid={`delete-role-btn-${role.id}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Permissions:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {role.permissions?.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Users:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {role.user_count || 0}
                </span>
              </div>
              
              {role.permissions && role.permissions.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sample Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((perm) => (
                      <span
                        key={perm.id}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                      >
                        {perm.name}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 text-gray-500 dark:text-gray-400 text-xs">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================================
// PERMISSIONS TAB
// ============================================================================

const PermissionsTab = ({ permissions }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Group permissions by resource
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const resource = perm.resource || 'other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(perm);
    return acc;
  }, {});

  const resourceColors = {
    dashboard: 'blue',
    transactions: 'green',
    accounts: 'orange',
    documents: 'purple',
    reports: 'red',
    invoices: 'pink',
    payments: 'indigo',
    bank_connections: 'cyan',
    reconciliation: 'teal',
    users: 'violet',
    roles: 'fuchsia',
    settings: 'gray',
    audit_logs: 'slate',
    integrations: 'emerald',
    company: 'amber'
  };

  const getResourceColor = (resource) => {
    return resourceColors[resource] || 'gray';
  };

  if (Object.keys(groupedPermissions).length === 0) {
    return (
      <div className="text-center py-12">
        <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-gray-500 dark:text-gray-400">No permissions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="permissions-list">
      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800">
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        // Table View
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Permission Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resource
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {permissions.map((perm) => {
                  const color = getResourceColor(perm.resource);
                  return (
                    <tr 
                      key={perm.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      data-testid={`permission-${perm.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CheckIcon className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {perm.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200 capitalize`}>
                          {perm.resource.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                          {perm.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {perm.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {perm.is_system && (
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            System
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Grid View (Original)
        Object.entries(groupedPermissions).map(([resource, perms]) => {
          const color = getResourceColor(resource);
          return (
            <div
              key={resource}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                  <KeyIcon className={`w-5 h-5 text-${color}-600`} />
                  {resource.replace(/_/g, ' ')}
                </h3>
                <span className={`px-3 py-1 bg-${color}-100 dark:bg-${color}-900 text-${color}-700 dark:text-${color}-300 text-sm rounded-full font-semibold`}>
                  {perms.length} permissions
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {perms.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all"
                    data-testid={`permission-${perm.id}`}
                  >
                    <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {perm.name}
                      </p>
                      {perm.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {perm.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium capitalize">
                          {perm.action}
                        </span>
                        {perm.is_system && (
                          <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded-full font-medium">
                            System
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// ============================================================================
// ROLE MODAL (CREATE/EDIT)
// ============================================================================

const RoleModal = ({ isOpen, onClose, role, permissions, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: []
  });
  const [saving, setSaving] = useState(false);
  const [searchPerm, setSearchPerm] = useState('');

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name || '',
        description: role.description || '',
        permission_ids: role.permissions?.map(p => p.id) || []
      });
    } else {
      setFormData({
        name: '',
        description: '',
        permission_ids: []
      });
    }
  }, [role, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (role) {
        await updateRole(role.id, formData);
        toast.success('Role updated successfully');
      } else {
        await createRole(formData);
        toast.success('Role created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (permId) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };

  const filteredPermissions = permissions.filter(perm =>
    perm.name.toLowerCase().includes(searchPerm.toLowerCase()) ||
    perm.resource.toLowerCase().includes(searchPerm.toLowerCase())
  );

  // Group permissions by resource
  const groupedPerms = filteredPermissions.reduce((acc, perm) => {
    const resource = perm.resource || 'other';
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {});

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                    {role ? 'Edit Role' : 'Create New Role'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Role Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Finance Manager"
                      data-testid="role-name-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe this role..."
                      data-testid="role-description-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permissions ({formData.permission_ids.length} selected)
                    </label>
                    
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchPerm}
                      onChange={(e) => setSearchPerm(e.target.value)}
                      className="w-full px-4 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="max-h-96 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 space-y-4">
                      {Object.entries(groupedPerms).map(([resource, perms]) => (
                        <div key={resource}>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                            {resource.replace(/_/g, ' ')}
                          </h4>
                          <div className="space-y-2">
                            {perms.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.permission_ids.includes(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                  data-testid={`permission-checkbox-${perm.id}`}
                                />
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {perm.name}
                                  </span>
                                  {perm.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {perm.description}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      data-testid="save-role-btn"
                    >
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                      {role ? 'Update Role' : 'Create Role'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// ============================================================================
// USER ROLE ASSIGNMENT MODAL
// ============================================================================

const UserRoleModal = ({ isOpen, onClose, user, roles, onSuccess }) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      loadUserRoles();
    }
  }, [user, isOpen]);

  const loadUserRoles = async () => {
    setLoading(true);
    try {
      const rolesData = await getUserRoles(user._id);
      const roleIds = rolesData.map(r => r.id);
      setUserRoles(rolesData);
      setSelectedRoles(roleIds);
    } catch (error) {
      toast.error('Failed to load user roles');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await assignRolesToUser(user._id, selectedRoles);
      toast.success('Roles updated successfully');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update roles');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleId) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                    Manage Roles - {user?.full_name}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {roles.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role.id)}
                            onChange={() => toggleRole(role.id)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            data-testid={`user-role-checkbox-${role.id}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {role.name}
                              </span>
                              {role.is_system && (
                                <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                                  System
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {role.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {role.permissions?.length || 0} permissions
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      data-testid="save-user-roles-btn"
                    >
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AdminPanelPage;
