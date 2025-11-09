import React, { useContext, useState, useCallback, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { Button, Card, Input, Modal, Select, Dropdown, DropdownMenuItem } from '../ui';
import type { AppContextType, User, Role, RolePermissions, Permission, CsvDataType } from '../../types';
import { ALL_PERMISSIONS } from '../../constants';

// User Form Modal
const UserFormModal: React.FC<{
    user?: User;
    roles: Role[];
    onSave: (userData: Omit<User, 'id'> | User) => void;
    onClose: () => void;
}> = ({ user, roles, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        roleId: user?.roleId || (roles.length > 0 ? roles[0].id : ''),
        avatar: user?.avatar || `https://i.pravatar.cc/150?u=${Date.now()}`
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (user) {
            onSave({ ...user, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={user ? 'Edit User' : 'Add New User'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <Select label="Role" name="roleId" value={formData.roleId} onChange={handleChange}>
                    {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                </Select>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save User</Button>
                </div>
            </form>
        </Modal>
    );
};

// Role Form Modal
const RoleFormModal: React.FC<{
    role?: Role;
    onSave: (roleData: Omit<Role, 'id'> | Role) => void;
    onClose: () => void;
}> = ({ role, onSave, onClose }) => {
    const [name, setName] = useState(role?.name || '');
    const [permissions, setPermissions] = useState<RolePermissions>(role?.permissions || {} as RolePermissions);

    const handlePermissionChange = (permission: Permission, value: boolean) => {
        setPermissions(prev => ({...prev, [permission]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const roleData = { name, permissions };
        if (role) {
            onSave({ ...role, ...roleData });
        } else {
            onSave(roleData);
        }
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={role ? 'Edit Role' : 'Add New Role'} size="xl">
             <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Role Name" value={name} onChange={e => setName(e.target.value)} required />
                <div>
                    <h3 className="text-md font-semibold mb-2">Permissions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {ALL_PERMISSIONS.map(p => (
                            <div key={p.id} className="flex items-start">
                                <input
                                    type="checkbox"
                                    id={p.id}
                                    checked={permissions[p.id] || false}
                                    onChange={(e) => handlePermissionChange(p.id, e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 mt-1"
                                />
                                <div className="ml-2">
                                    <label htmlFor={p.id} className="font-medium">{p.label}</label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Role</Button>
                </div>
            </form>
        </Modal>
    )
}

const CSV_DATA_TYPES: { key: CsvDataType, label: string }[] = [
    { key: 'clients', label: 'Clients' },
    { key: 'contactPersons', label: 'Contacts' },
    { key: 'projects', label: 'Projects' },
    { key: 'deals', label: 'Deals' },
    { key: 'tasks', label: 'Tasks' },
];

const TEMPLATE_HEADERS: Record<CsvDataType, string[]> = {
    clients: ['id', 'name', 'website', 'createdDate', 'ownerId'],
    contactPersons: ['id', 'name', 'email', 'phone', 'designation', 'clientId'],
    projects: ['id', 'name', 'clientId', 'realEstateSegment', 'sector', 'memberIds', 'teamMemberIds', 'createdDate'],
    deals: ['id', 'name', 'value', 'stage', 'projectId', 'expectedCloseDate', 'notes'],
    tasks: ['id', 'title', 'description', 'dueDate', 'priority', 'status', 'projectId', 'dealId'],
};

const SettingsPage: React.FC = () => {
    const context = useContext(AppContext);
    const [userModal, setUserModal] = useState<{ isOpen: boolean; user?: User }>({ isOpen: false });
    const [roleModal, setRoleModal] = useState<{ isOpen: boolean; role?: Role }>({ isOpen: false });
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [dataTypeToImport, setDataTypeToImport] = useState<CsvDataType | null>(null);
    const importFileInputRef = useRef<HTMLInputElement>(null);

    if (!context) return null;
    const { 
        theme, setTheme, currentUser, users, roles, hasPermission,
        addUser, updateUser, deleteUser, addRole, updateRole, deleteRole,
        exportData, importData, exportDataAsCsv, importDataFromCsv, resetData
    } = context as AppContextType;

    const currentUserRole = roles.find(r => r.id === currentUser.roleId);
    
    // User Modal Handlers
    const handleSaveUser = useCallback((userData: Omit<User, 'id'> | User) => {
        if ('id' in userData) updateUser(userData);
        else addUser(userData);
        setUserModal({ isOpen: false });
    }, [addUser, updateUser]);
    
    // Role Modal Handlers
    const handleSaveRole = useCallback((roleData: Omit<Role, 'id'> | Role) => {
        if ('id' in roleData) updateRole(roleData);
        else addRole(roleData);
        setRoleModal({ isOpen: false });
    }, [addRole, updateRole]);

    // Data Management Handlers
    const handleImportClick = (type: CsvDataType | 'json') => {
        if (type === 'json') {
            setDataTypeToImport(null);
        } else {
            setDataTypeToImport(type);
        }
        importFileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (dataTypeToImport) {
                if (window.confirm(`This will overwrite all existing ${dataTypeToImport} data. This action cannot be undone. Are you sure you want to continue?`)) {
                    importDataFromCsv(file, dataTypeToImport);
                }
            } else { 
                importData(file);
            }
        }
        if(event.target) event.target.value = ''; 
        setDataTypeToImport(null);
    };

    const handleDownloadTemplate = (dataType: CsvDataType) => {
        const headers = TEMPLATE_HEADERS[dataType];
        const csvString = headers.join(',');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_template.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleResetData = () => {
        resetData();
        setIsResetModalOpen(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile & Appearance */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
                        <div className="flex items-center gap-4">
                            <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-full"/>
                            <div>
                                <p className="font-bold">{currentUser.name}</p>
                                <p className="text-sm text-gray-500">{currentUser.email}</p>
                                <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{currentUserRole?.name}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                        <div className="flex items-center gap-4">
                            <p className="text-sm">Theme</p>
                            <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => setTheme('light')}>Light</Button>
                            <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => setTheme('dark')}>Dark</Button>
                        </div>
                    </Card>
                    <Card>
                        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Manage your CRM data using CSV or JSON formats.
                        </p>
                        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                            <Dropdown trigger={<Button variant="secondary" className="w-full">Export Data</Button>}>
                                {CSV_DATA_TYPES.map(type => (
                                    <DropdownMenuItem key={type.key} onClick={() => exportDataAsCsv(type.key)}>Export {type.label} (CSV)</DropdownMenuItem>
                                ))}
                                <hr className="my-1 border-gray-200 dark:border-gray-600" />
                                <DropdownMenuItem onClick={exportData}>Export All Data (JSON)</DropdownMenuItem>
                            </Dropdown>
                             <Dropdown trigger={<Button variant="secondary" className="w-full">Import Data</Button>}>
                                {CSV_DATA_TYPES.map(type => (
                                     <DropdownMenuItem key={type.key} onClick={() => handleImportClick(type.key)}>Import {type.label} (CSV)</DropdownMenuItem>
                                ))}
                                <hr className="my-1 border-gray-200 dark:border-gray-600" />
                                <DropdownMenuItem onClick={() => handleImportClick('json')}>Import All Data (JSON)</DropdownMenuItem>
                            </Dropdown>
                             <Dropdown trigger={<Button variant="secondary" className="w-full">Download Templates</Button>}>
                                {CSV_DATA_TYPES.map(type => (
                                    <DropdownMenuItem key={type.key} onClick={() => handleDownloadTemplate(type.key)}>Download {type.label} Template</DropdownMenuItem>
                                ))}
                            </Dropdown>
                            <Button variant="danger" onClick={() => setIsResetModalOpen(true)}>Reset Demo Data</Button>
                            <input
                                type="file" ref={importFileInputRef} onChange={handleFileImport}
                                accept=".csv, application/json" className="hidden"
                            />
                        </div>
                    </Card>
                </div>

                {/* Right Column: User & Role Management */}
                <div className="lg:col-span-2 space-y-6">
                    {hasPermission('manageUsers') && (
                        <Card>
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">User Management</h2>
                                <Button size="sm" onClick={() => setUserModal({ isOpen: true })}>Add New User</Button>
                            </div>
                            <ul className="space-y-2">
                                {users.map(user => {
                                    const role = roles.find(r => r.id === user.roleId);
                                    return (
                                        <li key={user.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <div className="flex items-center gap-2">
                                                <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full"/>
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-xs text-gray-500">{role?.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => setUserModal({ isOpen: true, user })}>Edit</Button>
                                                <Button size="sm" variant="danger" onClick={() => deleteUser(user.id)} disabled={user.id === currentUser.id}>Delete</Button>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        </Card>
                    )}
                    {hasPermission('manageRoles') && (
                         <Card>
                             <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Roles & Permissions</h2>
                                <Button size="sm" onClick={() => setRoleModal({ isOpen: true })}>Add New Role</Button>
                            </div>
                            <ul className="space-y-2">
                                {roles.map(role => (
                                     <li key={role.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                         <p className="font-medium">{role.name} {role.isDefault && <span className="text-xs text-gray-400">(Default)</span>}</p>
                                          <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => setRoleModal({ isOpen: true, role })}>Edit</Button>
                                                {!role.isDefault && <Button size="sm" variant="danger" onClick={() => deleteRole(role.id)}>Delete</Button>}
                                            </div>
                                     </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            </div>

            {userModal.isOpen && <UserFormModal user={userModal.user} roles={roles} onSave={handleSaveUser} onClose={() => setUserModal({ isOpen: false })} />}
            {roleModal.isOpen && <RoleFormModal role={roleModal.role} onSave={handleSaveRole} onClose={() => setRoleModal({ isOpen: false })} />}
            <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Confirm Data Reset">
                <p className="text-gray-600 dark:text-gray-300">
                    Are you sure you want to reset all application data to the original demo state? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 pt-6">
                    <Button variant="secondary" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleResetData}>Reset Data</Button>
                </div>
            </Modal>
        </div>
    );
};

export default SettingsPage;