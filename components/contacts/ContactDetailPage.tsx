

import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { Button, Card, Modal, Input, Select, ContextMenu, ContextMenuItem } from '../ui';
import type { Deal, Task, Activity, SupportTicket, GroundingChunk, Client, ContactPerson, Project, User } from '../../types';
import { DealStage, TaskPriority, TaskStatus } from '../../types';

// NOTE: Email Composer and AI Assistant components are moved here from the list page, as they are person-specific.

const AIEmailAssistant: React.FC<{
    contactPersonName: string;
    onGenerated: (text: string) => void;
    onClose: () => void;
}> = ({ contactPersonName, onGenerated, onClose }) => {
    const context = useContext(AppContext);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!context || !prompt) return;
        setIsLoading(true);
        const generatedText = await context.generateEmail(prompt, contactPersonName);
        onGenerated(generatedText);
        setIsLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="AI Email Assistant">
            <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enter a simple prompt, and the AI will draft a professional email to {contactPersonName}.
                </p>
                <Input
                    label="Your Prompt"
                    placeholder="e.g., Follow up on our last meeting"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            <div className="flex justify-end gap-2 pt-6">
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate Email'}
                </Button>
            </div>
        </Modal>
    );
};

const EmailComposer: React.FC<{
    contactPerson: ContactPerson;
    onClose: () => void;
}> = ({ contactPerson, onClose }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

    const handleSendEmail = () => {
        alert(`Email sent to ${contactPerson.name} (${contactPerson.email})`);
        onClose();
    };
    
    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={`Email ${contactPerson.name}`}>
                <div className="space-y-4">
                    <Input label="To" value={contactPerson.email} readOnly />
                    <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject" />
                    <div className="relative">
                       <textarea
                           className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                           rows={8}
                           value={body}
                           onChange={e => setBody(e.target.value)}
                           placeholder="Compose your email..."
                       />
                        <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => setIsAIAssistantOpen(true)}
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                            AI Assistant
                        </Button>
                    </div>
                </div>
                 <div className="flex justify-end gap-2 pt-6">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSendEmail}>Send Email</Button>
                </div>
            </Modal>
            {isAIAssistantOpen && (
                <AIEmailAssistant 
                    contactPersonName={contactPerson.name}
                    onGenerated={setBody}
                    onClose={() => setIsAIAssistantOpen(false)}
                />
            )}
        </>
    );
};

const CompanyInsights: React.FC<{ companyName: string }> = ({ companyName }) => {
    const context = useContext(AppContext);
    const [insights, setInsights] = useState<{ summary: string; sources: GroundingChunk[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!context) return null;

    const fetchInsights = async () => {
        if (!companyName) {
            setError('No company name provided to fetch insights.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const result = await context.getCompanyInsights(companyName);
            setInsights(result);
        } catch (e) {
            setError('Failed to fetch company insights.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Company Insights</h3>
                <Button onClick={fetchInsights} disabled={isLoading || !companyName} size="sm">
                    {isLoading ? 'Loading...' : 'Get Latest Insights'}
                </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {insights ? (
                <div className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">{insights.summary}</p>
                    {insights.sources && insights.sources.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Sources:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {insights.sources.map((source, index) => (
                                    source.web && source.web.uri && (
                                        <li key={index}>
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ) : (
                !isLoading && <p className="text-sm text-gray-500 dark:text-gray-400">Click the button to get AI-powered news about {companyName}.</p>
            )}
        </Card>
    );
};


const ProjectDetail: React.FC<{
    project: Project;
    onContextMenu: (e: React.MouseEvent, item: any, type: string) => void;
    canManage: boolean;
    onAddDeal: () => void;
    onAddTask: () => void;
    onAddActivity: () => void;
    onAddSupport: () => void;
}> = ({ project, onContextMenu, canManage, onAddDeal, onAddTask, onAddActivity, onAddSupport }) => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('Deals');

    if (!context) return null;
    const { deals, tasks, activities, supportTickets, contactPersons, users } = context;

    const projectDeals = useMemo(() => deals.filter(d => d.projectId === project.id), [deals, project.id]);
    const projectTasks = useMemo(() => tasks.filter(t => t.projectId === project.id), [tasks, project.id]);
    const projectActivities = useMemo(() => activities.filter(a => a.projectId === project.id), [activities, project.id]);
    const projectSupportTickets = useMemo(() => supportTickets.filter(s => s.projectId === project.id), [supportTickets, project.id]);
    const projectClientTeam = useMemo(() => contactPersons.filter(p => project.memberIds.includes(p.id)), [contactPersons, project.memberIds]);
    const projectTeamMembers = useMemo(() => users.filter(u => project.teamMemberIds?.includes(u.id)), [users, project.teamMemberIds]);

    const renderActivity = (activity: Activity) => {
        const user = users.find(u => u.id === activity.userId);
        return (
            <div key={activity.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md" onContextMenu={(e) => onContextMenu(e, activity, 'activity')}>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{user?.name || 'Unknown User'} logged a {activity.type}</span>
                    <span>{new Date(activity.date).toLocaleString()}</span>
                </div>
                <p className="text-sm">{activity.description}</p>
            </div>
        )
    };
    
    const tabsConfig = [
        { name: 'Deals', onAdd: onAddDeal },
        { name: 'Tasks', onAdd: onAddTask },
        { name: 'Activity', onAdd: onAddActivity },
        { name: 'Support', onAdd: onAddSupport },
    ];

    return (
        <div className="mt-4 space-y-4">
             <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <h4 className="font-semibold mb-2 text-md">Project Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div><span className="font-medium text-gray-500">Sector:</span> {project.realEstateSegment}</div>
                    <div><span className="font-medium text-gray-500">Other Sector:</span> {project.sector}</div>
                    <div>
                      <span className="font-medium text-gray-500">Client Team:</span> 
                      <ul className="list-disc list-inside ml-1">
                        {projectClientTeam.map(m => <li key={m.id}>{m.name} ({m.designation})</li>)}
                      </ul>
                    </div>
                     <div>
                      <span className="font-medium text-gray-500">Team Members:</span> 
                      <ul className="list-disc list-inside ml-1">
                        {projectTeamMembers.map(u => <li key={u.id}>{u.name}</li>)}
                      </ul>
                    </div>
                </div>
             </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-2 sm:space-x-4 items-center">
                    {tabsConfig.map(({ name, onAdd }) => (
                        <div key={name} className="flex items-center gap-1">
                            <button
                                onClick={() => setActiveTab(name)}
                                className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab === name ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                {name}
                            </button>
                            {canManage && (
                                <button onClick={(e) => { e.stopPropagation(); onAdd(); }} title={`Add ${name}`} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                                </button>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="p-1">
                {activeTab === 'Deals' && <ul className="space-y-3">{projectDeals.length > 0 ? projectDeals.map(deal => (<li key={deal.id} onContextMenu={(e) => onContextMenu(e, deal, 'deal')} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between"><div><p className="font-semibold">{deal.name}</p><p className="text-sm text-gray-500">{deal.stage}</p></div><p className="font-semibold">${deal.value.toLocaleString()}</p></li>)) : <p className="text-gray-500">No deals for this project.</p>}</ul>}
                {activeTab === 'Tasks' && <ul className="space-y-3">{projectTasks.length > 0 ? projectTasks.map(task => (<li key={task.id} onContextMenu={(e) => onContextMenu(e, task, 'task')} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md flex justify-between"><div><p className="font-semibold">{task.title}</p><p className="text-sm text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p></div><p className="text-sm font-medium">{task.status}</p></li>)) : <p className="text-gray-500">No tasks for this project.</p>}</ul>}
                {activeTab === 'Activity' && <div className="space-y-3 max-h-96 overflow-y-auto">{projectActivities.length > 0 ? projectActivities.map(renderActivity) : <p className="text-gray-500">No activities for this project.</p>}</div>}
                {activeTab === 'Support' && <ul className="space-y-3">{projectSupportTickets.length > 0 ? projectSupportTickets.map(ticket => (<li key={ticket.id} onContextMenu={(e) => onContextMenu(e, ticket, 'support')} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md"><div><p className="font-semibold">{ticket.subject}</p><p className="text-sm">{ticket.description}</p></div> <span className="text-sm font-medium">{ticket.status}</span></li>)) : <p className="text-gray-500">No support tickets for this project.</p>}</ul>}
            </div>
        </div>
    )
};


const ClientDetailPage: React.FC = () => {
    const context = useContext(AppContext);
    
    if (!context) return <div>Loading...</div>;
    const { selectedClientId, clients, contactPersons, projects, deals, tasks, supportTickets, activities, users, selectClient, hasPermission,
        addContactPerson, updateContactPerson, deleteContactPerson, addProject, updateProject, deleteProject,
        addDeal, updateDeal, addTask, updateTask, addActivity, updateActivity, addSupportTicket, updateSupportTicket,
    } = context;

    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [personModal, setPersonModal] = useState<{isOpen: boolean; person?: ContactPerson}>({isOpen: false});
    const [projectModal, setProjectModal] = useState<{isOpen: boolean; project?: Project}>({isOpen: false});
    const [emailComposerTarget, setEmailComposerTarget] = useState<ContactPerson | null>(null);

    const [projectSearchTerm, setProjectSearchTerm] = useState('');
    const [projectDateFilter, setProjectDateFilter] = useState('');
    const [editingDeal, setEditingDeal] = useState<Deal | Omit<Deal, 'id'> | null>(null);
    const [editingTask, setEditingTask] = useState<Task | Omit<Task, 'id'> | null>(null);
    const [editingSupportTicket, setEditingSupportTicket] = useState<SupportTicket | Omit<SupportTicket, 'id' | 'userId' | 'createdDate'> | null>(null);
    const [editingActivity, setEditingActivity] = useState<Activity | Omit<Activity, 'id' | 'userId' | 'date'> | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: any; type: string; } | null>(null);

    const client = clients.find(c => c.id === selectedClientId);
    
    const clientProjects = useMemo(() => projects.filter(p => p.clientId === client?.id), [projects, client]);
    
    const filteredClientProjects = useMemo(() => {
        // Step 1: Augment projects with a stable serial number based on the default sort order.
        const projectsWithSerial = clientProjects
            .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
            .map((project, index) => ({ ...project, serialNumber: index + 1 }));

        // Step 2: Filter based on search term and date.
        return projectsWithSerial.filter(project => {
            const searchTermLower = projectSearchTerm.toLowerCase();
            
            // Search by project name OR serial number.
            const matchesSearch = !projectSearchTerm ||
                project.name.toLowerCase().includes(searchTermLower) ||
                project.serialNumber.toString() === projectSearchTerm;
            
            const matchesDate = !projectDateFilter || project.createdDate.startsWith(projectDateFilter);

            return matchesSearch && matchesDate;
        });
    }, [clientProjects, projectSearchTerm, projectDateFilter]);

    const clientContactPersons = useMemo(() => contactPersons.filter(p => p.clientId === client?.id), [contactPersons, client]);
    
    // Auto-select first project if none is selected
    useState(() => {
        if(clientProjects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(clientProjects[0].id)
        }
    });

    const handleContextMenu = (e: React.MouseEvent, item: any, type: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item, type });
    };
    const closeContextMenu = () => setContextMenu(null);

    const handleEdit = () => {
        if (!contextMenu) return;
        const { item, type } = contextMenu;
        switch (type) {
            case 'deal': setEditingDeal(item as Deal); break;
            case 'task': setEditingTask(item as Task); break;
            case 'support': setEditingSupportTicket(item as SupportTicket); break;
            case 'activity': setEditingActivity(item as Activity); break;
        }
        closeContextMenu();
    };

    if (!client) {
        return <div className="text-center py-10">Client not found. <a href="#" onClick={() => selectClient(null)} className="text-primary-500">Go back to clients.</a></div>;
    }

    const canManage = hasPermission('manageContacts');

    // Add handlers
    const handleAddDeal = () => selectedProjectId && setEditingDeal({ name: '', value: 0, stage: DealStage.Prospecting, projectId: selectedProjectId, expectedCloseDate: new Date().toISOString().split('T')[0], notes: '' });
    const handleAddTask = () => selectedProjectId && setEditingTask({ title: '', dueDate: new Date().toISOString().split('T')[0], priority: TaskPriority.Medium, status: TaskStatus.Todo, projectId: selectedProjectId });
    const handleAddActivity = () => selectedProjectId && setEditingActivity({ type: 'note', description: '', projectId: selectedProjectId });
    const handleAddSupportTicket = () => selectedProjectId && setEditingSupportTicket({ subject: '', description: '', status: 'Open', projectId: selectedProjectId });
    
    // Save handlers
    const handleSavePerson = (data: Omit<ContactPerson, 'id'> | ContactPerson) => { 'id' in data ? updateContactPerson(data) : addContactPerson({ ...data, clientId: client.id }); setPersonModal({isOpen: false}); };
    const handleSaveProject = (data: Omit<Project, 'id' | 'createdDate'> | Project) => { 'id' in data ? updateProject(data as Project) : addProject({ ...data, clientId: client.id }); setProjectModal({isOpen: false}); };
    const handleSaveDeal = (data: Deal | Omit<Deal, 'id'>) => { 'id' in data ? updateDeal(data) : addDeal(data); setEditingDeal(null); };
    const handleSaveTask = (data: Task | Omit<Task, 'id'>) => { 'id' in data ? updateTask(data) : addTask(data); setEditingTask(null); };
    const handleSaveActivity = (data: Activity | Omit<Activity, 'id' | 'userId' | 'date'>) => { 'id' in data ? updateActivity(data as Activity) : addActivity(data); setEditingActivity(null); };
    const handleSaveSupportTicket = (data: SupportTicket | Omit<SupportTicket, 'id' | 'userId' | 'createdDate'>) => { 'id' in data ? updateSupportTicket(data as SupportTicket) : addSupportTicket(data); setEditingSupportTicket(null); };

    return (
        <div className="space-y-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
                <a href="#" onClick={(e) => { e.preventDefault(); selectClient(null); }} className="hover:underline">Clients</a>
                <span className="mx-2">&gt;</span>
                <span>{client.name}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{client.name}</h1>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">{client.website}</a>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                   <Card>
                       <div className="flex justify-between items-center mb-4">
                           <h3 className="text-lg font-semibold">Client Contacts</h3>
                           {canManage && <Button size="sm" onClick={() => setPersonModal({isOpen: true})}>Add Person</Button>}
                       </div>
                       <ul className="space-y-3 max-h-96 overflow-y-auto">
                           {clientContactPersons.map(person => (
                               <li key={person.id} className="p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <p className="font-semibold">{person.name}</p>
                                           <p className="text-xs text-gray-500">{person.designation}</p>
                                           <a href={`mailto:${person.email}`} className="text-xs text-primary-500">{person.email}</a>
                                       </div>
                                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                           <Button size="sm" variant="ghost" onClick={() => setEmailComposerTarget(person)}>Email</Button>
                                           {canManage && <Button size="sm" variant="ghost" onClick={() => setPersonModal({isOpen: true, person})}>Edit</Button>}
                                       </div>
                                   </div>
                               </li>
                           ))}
                       </ul>
                   </Card>
                   <CompanyInsights companyName={client.name} />
                </div>
                <div className="lg:col-span-2">
                    <Card>
                       <div className="flex justify-between items-center mb-4">
                           <h2 className="text-xl font-bold">Projects</h2>
                           {canManage && <Button onClick={() => setProjectModal({isOpen: true})}>Add Project</Button>}
                       </div>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <Input
                                placeholder="Search by project name or S.No..."
                                value={projectSearchTerm}
                                onChange={(e) => setProjectSearchTerm(e.target.value)}
                            />
                             <Input
                                type="date"
                                value={projectDateFilter}
                                onChange={(e) => setProjectDateFilter(e.target.value)}
                            />
                        </div>
                       <div className="space-y-4">
                           {filteredClientProjects.map((project) => (
                                <div key={project.id} className={`p-4 rounded-lg cursor-pointer border-2 ${selectedProjectId === project.id ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500' : 'bg-gray-100 dark:bg-gray-800 border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`} onClick={() => setSelectedProjectId(project.id)}>
                                   <div className="flex justify-between items-center">
                                       <h3 className="text-lg font-semibold">{project.serialNumber}. {project.name}</h3>
                                       {canManage && <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setProjectModal({isOpen: true, project})}}>Edit</Button>}
                                   </div>
                                   {selectedProjectId === project.id && <ProjectDetail project={project} onContextMenu={handleContextMenu} canManage={canManage} onAddDeal={handleAddDeal} onAddTask={handleAddTask} onAddActivity={handleAddActivity} onAddSupport={handleAddSupportTicket}/>}
                               </div>
                           ))}
                           {filteredClientProjects.length === 0 && <p className="text-gray-500 text-center py-8">No projects found.</p>}
                       </div>
                    </Card>
                </div>
            </div>

            {personModal.isOpen && <Modal isOpen={true} onClose={() => setPersonModal({isOpen: false})} title={personModal.person ? 'Edit Contact Person' : 'Add Contact Person'}>
                <PersonForm person={personModal.person} onSave={handleSavePerson} onClose={() => setPersonModal({isOpen: false})} />
            </Modal>}

            {projectModal.isOpen && <Modal isOpen={true} onClose={() => setProjectModal({isOpen: false})} title={projectModal.project ? 'Edit Project' : 'Add Project'}>
                <ProjectForm project={projectModal.project} members={clientContactPersons} users={users} onSave={handleSaveProject} onClose={() => setProjectModal({isOpen: false})} />
            </Modal>}

            {emailComposerTarget && <EmailComposer contactPerson={emailComposerTarget} onClose={() => setEmailComposerTarget(null)} />}

            {contextMenu && (
                <ContextMenu isOpen={!!contextMenu} onClose={closeContextMenu} position={{ x: contextMenu.x, y: contextMenu.y }}>
                    <ContextMenuItem onClick={handleEdit}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                        Edit
                    </ContextMenuItem>
                </ContextMenu>
            )}

            {editingDeal && <Modal isOpen={!!editingDeal} onClose={() => setEditingDeal(null)} title={editingDeal && 'id' in editingDeal ? 'Edit Deal' : 'Add Deal'}>
                <ProjectDealForm deal={editingDeal} onSave={handleSaveDeal} onClose={() => setEditingDeal(null)} />
            </Modal>}

            {editingTask && <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title={editingTask && 'id' in editingTask ? 'Edit Task' : 'Add Task'}>
                <ProjectTaskForm task={editingTask} deals={deals} onSave={handleSaveTask} onClose={() => setEditingTask(null)} />
            </Modal>}
            
            {editingSupportTicket && <Modal isOpen={!!editingSupportTicket} onClose={() => setEditingSupportTicket(null)} title={editingSupportTicket && 'id' in editingSupportTicket ? 'Edit Support Ticket' : 'Add Support Ticket'}>
                <ProjectSupportTicketForm ticket={editingSupportTicket} onSave={handleSaveSupportTicket} onClose={() => setEditingSupportTicket(null)} />
            </Modal>}

            {editingActivity && <Modal isOpen={!!editingActivity} onClose={() => setEditingActivity(null)} title={editingActivity && 'id' in editingActivity ? 'Edit Activity' : 'Add Activity'}>
                <ProjectActivityForm activity={editingActivity} projectId={selectedProjectId!} onSave={handleSaveActivity} onClose={() => setEditingActivity(null)} />
            </Modal>}

        </div>
    );
};

const PersonForm: React.FC<{person?: ContactPerson, onSave: (data: any)=>void, onClose: ()=>void}> = ({person, onSave, onClose}) => {
    const [formData, setFormData] = useState({
        name: person?.name || '', email: person?.email || '', phone: person?.phone || '', designation: person?.designation || ''
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, [e.target.name]: e.target.value});
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(person ? { ...person, ...formData } : formData); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" name="name" value={formData.name} onChange={handleChange} required/>
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required/>
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange}/>
            <Input label="Designation" name="designation" value={formData.designation} onChange={handleChange} required/>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Person</Button>
            </div>
        </form>
    )
};

const ProjectForm: React.FC<{project?: Project, members: ContactPerson[], users: User[], onSave: (data: any)=>void, onClose: ()=>void}> = ({project, members, users, onSave, onClose}) => {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        realEstateSegment: project?.realEstateSegment || '',
        sector: project?.sector || '',
        memberIds: project?.memberIds || [],
        teamMemberIds: project?.teamMemberIds || [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, [e.target.name]: e.target.value});
    
    const handleClientTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // FIX: Explicitly type `option` to resolve error 'property 'value' does not exist on type 'unknown''.
        const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData({...formData, memberIds: selectedIds });
    };

    const handleTeamMemberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // FIX: Explicitly type `option` to resolve error 'property 'value' does not exist on type 'unknown''.
        const selectedIds = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData({...formData, teamMemberIds: selectedIds });
    };

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(project ? { ...project, ...formData } : formData); };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Project Name" name="name" value={formData.name} onChange={handleChange} required/>
            <Input label="Sector" name="realEstateSegment" value={formData.realEstateSegment} onChange={handleChange} />
            <Input label="Other Sector Details" name="sector" value={formData.sector} onChange={handleChange} />
            <Select label="Client Team" multiple value={formData.memberIds} onChange={handleClientTeamChange} className="h-32">
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
            <Select label="Team Members" multiple value={formData.teamMemberIds} onChange={handleTeamMemberChange} className="h-32">
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Project</Button>
            </div>
        </form>
    )
};

const ProjectDealForm: React.FC<{ deal: Deal | Omit<Deal, 'id'>, onSave: (deal: any) => void, onClose: () => void }> = ({ deal, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        name: deal.name, value: deal.value, stage: deal.stage, expectedCloseDate: deal.expectedCloseDate, notes: deal.notes || ''
    });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...deal, ...formData, value: Number(formData.value) }); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Deal Name" name="name" value={formData.name} onChange={handleChange} required />
            <Input label="Value ($)" name="value" type="number" value={formData.value} onChange={handleChange} required />
            <Select label="Stage" name="stage" value={formData.stage} onChange={handleChange}>{Object.values(DealStage).map(s => <option key={s} value={s}>{s}</option>)}</Select>
            <Input label="Expected Close Date" name="expectedCloseDate" type="date" value={formData.expectedCloseDate} onChange={handleChange} required />
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Add notes..." rows={3} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const ProjectTaskForm: React.FC<{ task: Task | Omit<Task, 'id'>, deals: Deal[], onSave: (task: any) => void, onClose: () => void }> = ({ task, deals, onSave, onClose }) => {
    const [formData, setFormData] = useState({ title: task.title, description: task.description || '', dueDate: task.dueDate, priority: task.priority, status: task.status, dealId: task.dealId || '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...task, ...formData }); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" name="title" value={formData.title} onChange={handleChange} required />
            <Input label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} required />
            <Select label="Priority" name="priority" value={formData.priority} onChange={handleChange}>{Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}</Select>
            <Select label="Status" name="status" value={formData.status} onChange={handleChange}>{Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}</Select>
            <Select label="Related Deal (Optional)" name="dealId" value={formData.dealId} onChange={handleChange}><option value="">None</option>{deals.filter(d => d.projectId === task.projectId).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</Select>
            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const ProjectSupportTicketForm: React.FC<{ ticket: SupportTicket | Omit<SupportTicket, 'id' | 'userId' | 'createdDate'>, onSave: (ticket: any) => void, onClose: () => void }> = ({ ticket, onSave, onClose }) => {
    const [formData, setFormData] = useState({ subject: ticket.subject, description: ticket.description, status: ticket.status });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...ticket, ...formData }); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Subject" name="subject" value={formData.subject} onChange={handleChange} required />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description..." rows={4} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            <Select label="Status" name="status" value={formData.status} onChange={handleChange}><option value="Open">Open</option><option value="Resolved">Resolved</option><option value="Escalated">Escalated</option></Select>
            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

const ProjectActivityForm: React.FC<{ activity: Activity | Omit<Activity, 'id' | 'userId' | 'date'>, projectId: string, onSave: (data: any) => void, onClose: () => void }> = ({ activity, projectId, onSave, onClose }) => {
    const [formData, setFormData] = useState({ type: activity.type, description: activity.description });
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...activity, ...formData, projectId }); };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select label="Type" name="type" value={formData.type} onChange={handleChange}>
                <option value="note">Note</option><option value="email">Email</option><option value="call">Call</option><option value="meeting">Meeting</option>
            </Select>
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description..." rows={4} className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" required />
            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div>
        </form>
    );
};

export default ClientDetailPage;