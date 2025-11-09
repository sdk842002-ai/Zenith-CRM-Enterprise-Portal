import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { Button, Card, Input, Modal, Select, Dropdown, DropdownMenuItem } from '../ui';
import type { Deal, Client, Project } from '../../types';
import { DealStage } from '../../types';

// Deal Card Component
const DealCard: React.FC<{
    deal: Deal;
    projectName: string;
    clientName: string;
    onClick: () => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, dealId: string) => void;
    isDraggable: boolean;
    stage: DealStage;
    onReopen: (deal: Deal) => void;
    onDelete: (dealId: string, dealName: string) => void;
    canManage: boolean;
}> = ({ deal, projectName, clientName, onClick, onDragStart, isDraggable, stage, onReopen, onDelete, canManage }) => {
    
    const isClosedStage = stage === DealStage.ClosedWon || stage === DealStage.ClosedLost;

    return (
        <Card
            className="mb-3 p-3 group relative cursor-pointer hover:shadow-lg hover:border-primary-500 border border-transparent transition-shadow duration-200"
            draggable={isDraggable}
            onClick={onClick}
            onDragStart={(e) => onDragStart(e, deal.id)}
        >
            {isClosedStage && canManage && (
                 <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <Dropdown 
                        trigger={
                            <Button size="sm" variant="ghost" className="p-1 h-auto leading-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                            </Button>
                        }
                        align="right"
                    >
                         <DropdownMenuItem onClick={() => onReopen(deal)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9H4.5a2.5 2.5 0 0 0 0 5H8"/><path d="m10.5 12.5 2-2.5-2-2.5"/><path d="M14 15V9h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-1z"/></svg>
                            Re-open Deal
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onDelete(deal.id, deal.name)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            <span className="text-red-500">Delete Deal</span>
                        </DropdownMenuItem>
                    </Dropdown>
                </div>
            )}
            <h4 className="font-semibold text-sm text-gray-800 dark:text-white pr-6">{deal.name}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{projectName} ({clientName})</p>
            <p className="text-sm font-bold text-primary-600 dark:text-primary-400">${deal.value.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Close Date: {new Date(deal.expectedCloseDate).toLocaleDateString()}
            </p>
        </Card>
    );
};

// Deal Form Component
const DealForm: React.FC<{
    deal?: Deal | null;
    projects: Project[];
    clients: Client[];
    onSave: (dealData: Omit<Deal, 'id'> | Deal) => void;
    onClose: () => void;
}> = ({ deal, projects, clients, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: deal?.name || '',
        value: deal?.value || 0,
        stage: deal?.stage || DealStage.Prospecting,
        projectId: deal?.projectId || (projects.length > 0 ? projects[0].id : ''),
        expectedCloseDate: deal?.expectedCloseDate || new Date().toISOString().split('T')[0],
        notes: deal?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dealData = { ...formData, value: Number(formData.value) };
        if (deal) {
            onSave({ ...deal, ...dealData });
        } else {
            onSave(dealData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Deal Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Value ($)" name="value" type="number" value={formData.value} onChange={handleChange} required />
            <Select label="Project" name="projectId" value={formData.projectId} onChange={handleChange} required>
                {projects.map(p => {
                    const client = clients.find(c => c.id === p.clientId);
                    return <option key={p.id} value={p.id}>{p.name} ({client?.name})</option>
                })}
            </Select>
            <Select label="Stage" name="stage" value={formData.stage} onChange={handleChange}>
                {Object.values(DealStage).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Input label="Expected Close Date" name="expectedCloseDate" type="date" value={formData.expectedCloseDate} onChange={handleChange} required />
            <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add notes..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Deal</Button>
            </div>
        </form>
    );
};

// Deal Detail View Component
const DealDetailView: React.FC<{
    deal: Deal;
    project?: Project;
    client?: Client;
    canManage: boolean;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ deal, project, client, canManage, onEdit, onDelete }) => (
    <div className="space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Value</dt>
                <dd className="mt-1 text-lg font-semibold text-primary-600 dark:text-primary-400">${deal.value.toLocaleString()}</dd>
            </div>
            <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Stage</dt>
                <dd className="mt-1 text-sm">{deal.stage}</dd>
            </div>
             <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Associated Project</dt>
                <dd className="mt-1 text-sm">{project?.name} ({client?.name})</dd>
            </div>
            <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Close Date</dt>
                <dd className="mt-1 text-sm">{new Date(deal.expectedCloseDate).toLocaleDateString()}</dd>
            </div>
            {deal.notes && (
                 <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</dt>
                    <dd className="mt-1 text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">{deal.notes}</dd>
                </div>
            )}
        </dl>
        {canManage && (
            <div className="flex justify-end gap-2 pt-4">
                 <Button variant="danger" onClick={onDelete}>Delete</Button>
                <Button variant="primary" onClick={onEdit}>Edit</Button>
            </div>
        )}
    </div>
);


const DealsPage: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);
    const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({
        [DealStage.ClosedWon]: true,
        [DealStage.ClosedLost]: true,
    });

    if (!context) return <div>Loading...</div>;
    const { deals, clients, projects, addDeal, updateDeal, deleteDeal, updateDealStage, hasPermission, addToast } = context;
    const canManageDeals = hasPermission('manageDeals');

    const toggleCollapse = (stage: DealStage) => {
        if (stage === DealStage.ClosedWon || stage === DealStage.ClosedLost) {
            setCollapsedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, dealId: string) => {
        if (!canManageDeals) return;
        e.dataTransfer.setData("dealId", dealId);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStage: DealStage) => {
        if (!canManageDeals) return;
        e.preventDefault();
        const dealId = e.dataTransfer.getData("dealId");
        updateDealStage(dealId, newStage);
        setDragOverStage(null);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stage: DealStage) => {
        if (!canManageDeals) return;
        e.preventDefault();
        setDragOverStage(stage);
    };
    
    const handleDragLeave = () => {
        if (!canManageDeals) return;
        setDragOverStage(null);
    };

    const handleOpenModal = (deal: Deal | null = null, editMode = false) => {
        setSelectedDeal(deal);
        setIsEditing(deal ? editMode : true); // New deals start in edit mode
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDeal(null);
        setIsEditing(false);
    };

    const handleSaveDeal = useCallback((dealData: Omit<Deal, 'id'> | Deal) => {
        if ('id' in dealData) {
            updateDeal(dealData);
        } else {
            addDeal(dealData);
        }
        handleCloseModal();
    }, [addDeal, updateDeal]);
    
    const handleDeleteDeal = useCallback(() => {
        if (selectedDeal) {
            deleteDeal(selectedDeal.id);
            handleCloseModal();
        }
    }, [deleteDeal, selectedDeal]);

    const handleReopenDeal = useCallback((deal: Deal) => {
        updateDealStage(deal.id, DealStage.Prospecting);
        addToast(`Deal "${deal.name}" re-opened.`, 'info');
    }, [updateDealStage, addToast]);

    const handleDeleteFromCard = useCallback((dealId: string, dealName: string) => {
        if(window.confirm(`Are you sure you want to delete the deal "${dealName}"?`)) {
            deleteDeal(dealId);
        }
    }, [deleteDeal]);

    const stageDeals = useMemo(() => {
        return Object.values(DealStage).reduce((acc, stage) => {
            acc[stage] = deals.filter(d => d.stage === stage);
            return acc;
        }, {} as Record<DealStage, Deal[]>);
    }, [deals]);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Deals Pipeline</h1>
                {canManageDeals && <Button onClick={() => handleOpenModal(null)}>Add Deal</Button>}
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-max h-full">
                    {Object.values(DealStage).map(stage => {
                        const dealsInStage = stageDeals[stage];
                        const stageValue = dealsInStage.reduce((sum, deal) => sum + deal.value, 0);
                        const isClosedStage = stage === DealStage.ClosedWon || stage === DealStage.ClosedLost;
                        const isCollapsed = isClosedStage && collapsedStages[stage];

                        return (
                            <div
                                key={stage}
                                onDrop={(e) => handleDrop(e, stage)}
                                onDragOver={(e) => handleDragOver(e, stage)}
                                onDragLeave={handleDragLeave}
                                className={`w-80 flex-shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-lg flex flex-col h-full transition-colors duration-300 ${dragOverStage === stage ? 'bg-primary-100 dark:bg-primary-900/50' : ''}`}
                            >
                                <div
                                    className={`p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center ${isClosedStage ? 'cursor-pointer' : ''}`}
                                    onClick={() => toggleCollapse(stage)}
                                >
                                    <div>
                                        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-600 dark:text-gray-400">{stage} ({dealsInStage.length})</h3>
                                        <p className="text-xs text-gray-500">${stageValue.toLocaleString()}</p>
                                    </div>
                                    {isClosedStage && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${!isCollapsed ? 'rotate-90' : ''}`}>
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 p-2 overflow-y-auto">
                                        {dealsInStage.map(deal => {
                                            const project = projects.find(p => p.id === deal.projectId);
                                            const client = clients.find(c => c.id === project?.clientId);
                                            return (
                                                <DealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    projectName={project?.name || 'N/A'}
                                                    clientName={client?.name || 'N/A'}
                                                    onClick={() => handleOpenModal(deal)}
                                                    onDragStart={handleDragStart}
                                                    isDraggable={canManageDeals && !isClosedStage}
                                                    stage={stage}
                                                    onReopen={handleReopenDeal}
                                                    onDelete={handleDeleteFromCard}
                                                    canManage={canManageDeals}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={isEditing ? (selectedDeal ? 'Edit Deal' : 'Add New Deal') : selectedDeal?.name || 'Deal Details'}>
                {isEditing ? (
                    <DealForm deal={selectedDeal} projects={projects} clients={clients} onSave={handleSaveDeal} onClose={handleCloseModal} />
                ) : selectedDeal ? (
                     <DealDetailView
                        deal={selectedDeal}
                        project={projects.find(p => p.id === selectedDeal.projectId)}
                        client={clients.find(c => c.id === projects.find(p => p.id === selectedDeal.projectId)?.clientId)}
                        canManage={canManageDeals}
                        onEdit={() => setIsEditing(true)}
                        onDelete={handleDeleteDeal}
                    />
                ) : null}
            </Modal>
        </div>
    );
};

export default DealsPage;