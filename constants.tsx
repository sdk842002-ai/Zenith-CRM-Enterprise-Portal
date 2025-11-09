import React from 'react';
import type { Permission, Role, RolePermissions } from './types';

export const NAV_ITEMS = [
    { name: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg> },
    { name: 'Clients', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { name: 'Deals', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { name: 'Tasks', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16z"/><path d="m14 10-4 4 2.5 2.5"/><path d="M14 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg> },
    { name: 'Reports', icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8a6 6 0 0 0-8.1 0"/><path d="M12.3 12.3a2 2 0 0 0-2.8 0"/><path d="M15.5 15.5a4 4 0 0 0-5.6 0"/></svg> },
];

export const ALL_PERMISSIONS: { id: Permission; label: string; description: string }[] = [
    { id: 'viewDashboard', label: 'View Dashboard', description: 'Can see the main dashboard and its analytics.' },
    { id: 'viewContacts', label: 'View Clients', description: 'Can see the list of clients and their projects.' },
    { id: 'manageContacts', label: 'Manage Clients', description: 'Can add, edit, and delete clients, contacts, and projects.' },
    { id: 'viewDeals', label: 'View Deals', description: 'Can see the deals pipeline.' },
    { id: 'manageDeals', label: 'Manage Deals', description: 'Can add, edit, delete, and move deals.' },
    { id: 'viewTasks', label: 'View Tasks', description: 'Can see the list of tasks.' },
    { id: 'manageTasks', label: 'Manage Tasks', description: 'Can add, edit, and delete tasks.' },
    { id: 'viewReports', label: 'View Reports', description: 'Can access the sales reports page.' },
    { id: 'viewSettings', label: 'View Settings', description: 'Can view their own settings.' },
    { id: 'manageUsers', label: 'Manage Users', description: 'Can add, edit, and delete other users.' },
    { id: 'manageRoles', label: 'Manage Roles', description: 'Can create, edit, and delete roles and permissions.' },
];

const createPermissions = (settings: { [key in Permission]?: boolean }): RolePermissions => {
    const permissions = {} as RolePermissions;
    for (const p of ALL_PERMISSIONS) {
        permissions[p.id] = settings[p.id] || false;
    }
    return permissions;
};

export const INITIAL_ROLES: Role[] = [
    {
        id: 'role-admin',
        name: 'Admin',
        isDefault: true,
        permissions: createPermissions({
            viewDashboard: true, viewContacts: true, manageContacts: true, viewDeals: true,
            manageDeals: true, viewTasks: true, manageTasks: true, viewReports: true,
            viewSettings: true, manageUsers: true, manageRoles: true,
        }),
    },
    {
        id: 'role-manager',
        name: 'Sales Manager',
        isDefault: true,
        permissions: createPermissions({
            viewDashboard: true, viewContacts: true, manageContacts: true, viewDeals: true,
            manageDeals: true, viewTasks: true, manageTasks: true, viewReports: true,
            viewSettings: true,
        }),
    },
    {
        id: 'role-rep',
        name: 'Sales Rep',
        isDefault: true,
        permissions: createPermissions({
            viewDashboard: true, viewContacts: true, manageContacts: true, viewDeals: true,
            manageDeals: true, viewTasks: true, manageTasks: true, viewSettings: true,
        }),
    },
];
