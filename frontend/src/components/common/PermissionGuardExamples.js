import React from 'react';
import PermissionGuard, { useHasPermission } from '../components/common/PermissionGuard';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

/**
 * Example Usage of PermissionGuard Component
 * This demonstrates how to use permission-based rendering in your pages
 */

const PermissionGuardExamples = () => {
  // Example 1: Using the hook
  const canCreateTransaction = useHasPermission('transactions:create');
  const canEditTransaction = useHasPermission('transactions:edit');

  return (
    <div className="space-y-8 p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Permission Guard Examples
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          These examples show how to implement permission-based UI elements
        </p>

        {/* Example 1: Single Permission with Component */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Example 1: Single Permission Check
          </h3>
          <PermissionGuard 
            permission="transactions:create"
            fallback={
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                You don't have permission to create transactions
              </div>
            }
          >
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <PlusIcon className="w-5 h-5" />
              Create Transaction
            </button>
          </PermissionGuard>
        </div>

        {/* Example 2: Multiple Permissions (ANY) */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Example 2: Multiple Permissions (ANY)
          </h3>
          <PermissionGuard 
            permission={['transactions:edit', 'transactions:create']}
            requireAll={false}
          >
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <PencilIcon className="w-5 h-5" />
                Edit or Create
              </button>
            </div>
          </PermissionGuard>
        </div>

        {/* Example 3: Multiple Permissions (ALL) */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Example 3: Multiple Permissions (ALL Required)
          </h3>
          <PermissionGuard 
            permission={['transactions:edit', 'transactions:delete']}
            requireAll={true}
            fallback={
              <div className="text-sm text-red-600 dark:text-red-400">
                You need both edit AND delete permissions to see this
              </div>
            }
          >
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                <PencilIcon className="w-5 h-5" />
                Edit
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                <TrashIcon className="w-5 h-5" />
                Delete
              </button>
            </div>
          </PermissionGuard>
        </div>

        {/* Example 4: Using Hooks */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Example 4: Using Permission Hooks
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Can create transaction: {' '}
              <span className={canCreateTransaction ? 'text-green-600' : 'text-red-600'}>
                {canCreateTransaction ? '✓ Yes' : '✗ No'}
              </span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Can edit transaction: {' '}
              <span className={canEditTransaction ? 'text-green-600' : 'text-red-600'}>
                {canEditTransaction ? '✓ Yes' : '✗ No'}
              </span>
            </p>
            
            {canCreateTransaction && (
              <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Create New Transaction
              </button>
            )}
          </div>
        </div>

        {/* Example 5: Conditional Features in Table */}
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Example 5: Permission-Based Table Actions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    Sample Transaction #1
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    $1,234.56
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {/* Always visible - view action */}
                    <button className="text-blue-600 hover:text-blue-800">
                      <EyeIcon className="w-5 h-5 inline" />
                    </button>
                    
                    {/* Only visible with edit permission */}
                    <PermissionGuard permission="transactions:edit">
                      <button className="text-green-600 hover:text-green-800">
                        <PencilIcon className="w-5 h-5 inline" />
                      </button>
                    </PermissionGuard>
                    
                    {/* Only visible with delete permission */}
                    <PermissionGuard permission="transactions:delete">
                      <button className="text-red-600 hover:text-red-800">
                        <TrashIcon className="w-5 h-5 inline" />
                      </button>
                    </PermissionGuard>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage Code Examples */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Code Examples
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                1. Basic Permission Check:
              </p>
              <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<PermissionGuard permission="transactions:create">
  <button>Create Transaction</button>
</PermissionGuard>`}
              </pre>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                2. With Fallback:
              </p>
              <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`<PermissionGuard 
  permission="transactions:create"
  fallback={<div>No permission</div>}
>
  <button>Create Transaction</button>
</PermissionGuard>`}
              </pre>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                3. Using Hooks:
              </p>
              <pre className="bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`const canEdit = useHasPermission('transactions:edit');

{canEdit && <button>Edit</button>}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionGuardExamples;
