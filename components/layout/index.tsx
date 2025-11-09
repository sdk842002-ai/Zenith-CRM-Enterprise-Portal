import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { NAV_ITEMS } from '../../constants';
import { Dropdown } from '../ui';
import type { AppContextType, Page, User } from '../../types';

export const Sidebar: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { currentPage, setCurrentPage, hasPermission } = context as AppContextType;

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
            <div className="flex items-center justify-center h-16 border-b dark:border-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500 h-8 w-8"><path d="M12 22V12"/><path d="M12 12H2l10-10 10 10H12Z"/><path d="m22 22-5-5"/><path d="m2 22 5-5"/></svg>
                <span className="ml-2 text-xl font-bold">CRM.ai</span>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {NAV_ITEMS.map(item => {
                    if (item.name === 'Reports' && !hasPermission('viewReports')) return null;
                    if (item.name === 'Clients' && !hasPermission('viewContacts')) return null;
                    const pageName = item.name as Page;
                    return (
                        <a
                            key={item.name}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentPage(pageName); }}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                                currentPage === pageName
                                    ? 'bg-primary-500 text-white'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            <span className="ml-3">{item.name}</span>
                        </a>
                    )
                })}
            </nav>
            {hasPermission('viewSettings') && (
                <div className="p-4 border-t dark:border-gray-700">
                     <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setCurrentPage('Settings'); }}
                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                            currentPage === 'Settings'
                                ? 'bg-primary-500 text-white'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                        <span className="ml-3">Settings</span>
                    </a>
                </div>
            )}
        </aside>
    );
};

export const Header: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { currentUser, users, setCurrentUser, roles } = context as AppContextType;

    const currentUserRole = roles.find(r => r.id === currentUser.roleId);

    return (
        <header className="flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 sm:px-6">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold ml-2">Welcome back, {currentUser.name.split(' ')[0]}</h1>
            </div>
            <div className="flex items-center gap-4">
                <Dropdown
                    trigger={
                        <div className="flex items-center gap-2">
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-8 h-8 rounded-full" />
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold">{currentUser.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{currentUserRole?.name}</span>
                            </div>
                        </div>
                    }
                >
                     {users.map(user => (
                        <a
                            key={user.id}
                            href="#"
                            onClick={(e) => { e.preventDefault(); setCurrentUser(user); }}
                            className={`block px-4 py-2 text-sm ${
                                currentUser.id === user.id 
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            } hover:bg-gray-100 dark:hover:bg-gray-700`}
                        >
                            Switch to {user.name}
                        </a>
                    ))}
                </Dropdown>
            </div>
        </header>
    );
};
