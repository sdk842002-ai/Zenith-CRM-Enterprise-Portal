import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { Button, Card, Input, Modal, Select } from '../ui';
import type { Client, User } from '../../types';

// Client Form (local to this component)
const ClientForm: React.FC<{ 
    client?: Client; 
    users: User[];
    onSave: (client: Omit<Client, 'id' | 'createdDate'> | Client) => void; 
    onClose: () => void; 
}> = ({ client, users, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: client?.name || '',
        website: client?.website || '',
        ownerId: client?.ownerId || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (client) {
            onSave({ ...client, ...formData });
        } else {
            onSave(formData);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Client Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Website" name="website" type="url" value={formData.website} onChange={handleChange} required />
            <Select label="Assigned" name="ownerId" value={formData.ownerId} onChange={handleChange}>
                <option value="">Unassigned</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <div className="flex justify-end gap-2 pt-4">
                 <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                 <Button type="submit">Save Client</Button>
            </div>
        </form>
    );
};

const ClientsPage: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Client; direction: 'asc' | 'desc' }>({ key: 'createdDate', direction: 'desc' });


    if (!context) return <div>Loading...</div>;

    const { clients, users, addClient, updateClient, deleteClient, selectClient, hasPermission } = context;
    const canManageClients = hasPermission('manageContacts');
    
    const filteredAndSortedClients = useMemo(() => {
        // Step 1: Augment clients with a stable serial number based on the default sort order.
        const clientsWithSerial = [...clients]
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
            .map((client, index) => ({ ...client, serialNumber: index + 1 }));

        // Step 2: Filter this augmented list.
        let filteredClients = clientsWithSerial.filter(client => {
            const search = searchTerm.toLowerCase();
            const owner = users.find(u => u.id === client.ownerId);
            const matchesSearch = !search ||
                client.name.toLowerCase().includes(search) ||
                client.website.toLowerCase().includes(search) ||
                (owner && owner.name.toLowerCase().includes(search)) ||
                client.serialNumber.toString() === search;
            
            const matchesDate = !dateFilter || client.createdDate.startsWith(dateFilter);

            return matchesSearch && matchesDate;
        });

        // Step 3: Sort the filtered list based on the current sortConfig.
        filteredClients.sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];
            if (aValue === undefined || bValue === undefined) return 0;
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filteredClients;
    }, [clients, searchTerm, dateFilter, sortConfig, users]);
    
    const handleSort = (key: keyof Client) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleOpenModal = (client?: Client) => {
        setEditingClient(client);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingClient(undefined);
        setIsModalOpen(false);
    };

    const handleSaveClient = useCallback((clientData: Omit<Client, 'id' | 'createdDate'> | Client) => {
        if ('id' in clientData) {
            updateClient(clientData);
        } else {
            addClient(clientData);
        }
        handleCloseModal();
    }, [addClient, updateClient]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Clients ({clients.length})</h1>
                 {canManageClients && <Button onClick={() => handleOpenModal()}>Add Client</Button>}
            </div>
            
            <Card>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-grow">
                        <Input
                            type="text"
                            placeholder="Search clients by S.No., name, website, or owner..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">S.No.</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('name')}>Client Name</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hidden md:table-cell" onClick={() => handleSort('website')}>Website</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer hidden lg:table-cell" onClick={() => handleSort('ownerId')}>Assigned To</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => handleSort('createdDate')}>Date Added</th>
                                {canManageClients && <th scope="col" className="px-6 py-3">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedClients.length > 0 ? filteredAndSortedClients.map((client) => (
                                <tr key={client.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4">{client.serialNumber}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                        <a href="#" onClick={(e) => { e.preventDefault(); selectClient(client.id); }} className="hover:underline text-primary-600 dark:text-primary-400">
                                            {client.name}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 hidden md:table-cell">
                                        <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary-500">
                                            {client.website}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 hidden lg:table-cell">{users.find(u => u.id === client.ownerId)?.name || 'Unassigned'}</td>
                                    <td className="px-6 py-4">{new Date(client.createdDate).toLocaleDateString()}</td>
                                    {canManageClients && (
                                        <td className="px-6 py-4 flex gap-2">
                                            <Button size="sm" variant="ghost" onClick={() => handleOpenModal(client)}>Edit</Button>
                                            <Button size="sm" variant="danger" onClick={() => deleteClient(client.id)}>Delete</Button>
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={canManageClients ? 6 : 5} className="text-center py-8 text-gray-500">No clients found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingClient ? 'Edit Client' : 'Add New Client'}>
                <ClientForm client={editingClient} users={users} onSave={handleSaveClient} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default ClientsPage;