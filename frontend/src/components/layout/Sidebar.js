import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Transactions', href: '/transactions', icon: CreditCardIcon },
  { name: 'Accounts', href: '/accounts', icon: BanknotesIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
];

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const adminNavigation = [
  { name: 'Administration', href: '/admin', icon: UsersIcon, roles: ['admin', 'corporate'] },
];

const Sidebar = ({ open, setOpen }) => {
  const { user, hasAnyRole } = useAuth();
  const location = useLocation();

  const isCurrentPage = (href) => {
    return location.pathname === href;
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center">
          <BuildingOfficeIcon className="h-8 w-8 text-primary-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">
            AFMS
          </span>
        </div>
      </div>

      {/* Company info */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Company
        </div>
        <div className="mt-1 text-sm text-gray-900 font-medium">
          {user?.company_name}
        </div>
        <div className="text-xs text-gray-500 capitalize">
          {user?.role} User
        </div>
      </div>

      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {/* Main navigation */}
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={clsx(
                      isCurrentPage(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        isCurrentPage(item.href) 
                          ? 'text-primary-700' 
                          : 'text-gray-400 group-hover:text-primary-700',
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>

          {/* Admin navigation */}
          {hasAnyRole(['admin', 'corporate']) && (
            <li>
              <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
                Administration
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {adminNavigation.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={clsx(
                        isCurrentPage(item.href)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                      )}
                    >
                      <item.icon
                        className={clsx(
                          isCurrentPage(item.href) 
                            ? 'text-primary-700' 
                            : 'text-gray-400 group-hover:text-primary-700',
                          'h-6 w-6 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          )}

          {/* Bottom navigation */}
          <li className="mt-auto">
            <ul role="list" className="-mx-2 space-y-1">
              {bottomNavigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={clsx(
                      isCurrentPage(item.href)
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                  >
                    <item.icon
                      className={clsx(
                        isCurrentPage(item.href) 
                          ? 'text-primary-700' 
                          : 'text-gray-400 group-hover:text-primary-700',
                        'h-6 w-6 shrink-0'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;