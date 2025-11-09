import React, { createContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import useLocalStorage from '../hooks/useLocalStorage';
import type {
    AppContextType, Theme, Page, ToastMessage, Client, Deal, Task, Activity, User, Role, Permission, SupportTicket, GroundingChunk, ContactPerson, Project, CsvDataType
} from '../types';
import { DealStage, TaskPriority, TaskStatus } from '../types';
import { INITIAL_ROLES } from '../constants';

// Mock Data
const INITIAL_USERS: User[] = [
    { id: 'user-1', name: 'Alex Johnson', email: 'alex@crm.ai', avatar: 'https://i.pravatar.cc/150?u=user-1', roleId: 'role-admin' },
    { id: 'user-2', name: 'Maria Garcia', email: 'maria@crm.ai', avatar: 'https://i.pravatar.cc/150?u=user-2', roleId: 'role-manager' },
    { id: 'user-3', name: 'Sam Wilson', email: 'sam@crm.ai', avatar: 'https://i.pravatar.cc/150?u=user-3', roleId: 'role-rep' },
    { id: 'user-4', name: 'Chen Lee', email: 'chen@crm.ai', avatar: 'https://i.pravatar.cc/150?u=user-4', roleId: 'role-rep' },
];

const mockClients: Client[] = [
    { id: 'client-1', name: 'Big Tech Inc.', website: 'https://bigtech.com', createdDate: '2023-10-01T10:00:00Z', ownerId: 'user-3' },
    { id: 'client-2', name: 'Startup Co.', website: 'https://startup.co', createdDate: '2023-10-15T14:30:00Z', ownerId: 'user-3' },
    { id: 'client-3', name: 'Innovate LLC', website: 'https://innovate.io', createdDate: '2024-01-20T09:00:00Z', ownerId: 'user-4' },
    { id: 'client-4', name: 'Global Solutions', website: 'https://globalsolutions.com', createdDate: '2024-03-10T11:00:00Z', ownerId: 'user-2' },
];

const mockContactPersons: ContactPerson[] = [
    { id: 'person-1', name: 'John Doe', email: 'john.d@bigtech.com', phone: '123-456-7890', designation: 'CEO', clientId: 'client-1'},
    { id: 'person-2', name: 'Jane Smith', email: 'jane.s@startup.co', phone: '098-765-4321', designation: 'Founder', clientId: 'client-2'},
    { id: 'person-3', name: 'Peter Jones', email: 'peter.j@bigtech.com', phone: '111-222-3333', designation: 'CTO', clientId: 'client-1'},
    { id: 'person-4', name: 'David Chen', email: 'david.c@innovate.io', phone: '444-555-6666', designation: 'Lead Engineer', clientId: 'client-3'},
    { id: 'person-5', name: 'Sophia Loren', email: 'sophia.l@globalsolutions.com', phone: '777-888-9999', designation: 'Marketing Head', clientId: 'client-4'},
];

const mockProjects: Project[] = [
    { id: 'project-1', name: 'Project Phoenix', clientId: 'client-1', realEstateSegment: 'Commercial', sector: 'Cloud Services', memberIds: ['person-1', 'person-3'], teamMemberIds: ['user-1', 'user-3'], createdDate: '2024-07-15T10:00:00Z' },
    { id: 'project-2', name: 'Website Redesign', clientId: 'client-2', realEstateSegment: 'N/A', sector: 'Web Development', memberIds: ['person-2'], teamMemberIds: ['user-2'], createdDate: '2024-07-20T11:30:00Z' },
    { id: 'project-3', name: 'Cloud Migration', clientId: 'client-1', realEstateSegment: 'Commercial', sector: 'Data Infrastructure', memberIds: ['person-3'], teamMemberIds: ['user-1'], createdDate: '2024-06-10T09:00:00Z' },
    { id: 'project-4', name: 'AI Integration', clientId: 'client-3', realEstateSegment: 'Industrial', sector: 'Machine Learning', memberIds: ['person-4'], teamMemberIds: ['user-4'], createdDate: '2024-02-01T10:00:00Z' },
    { id: 'project-5', name: 'Global Branding Campaign', clientId: 'client-4', realEstateSegment: 'Retail', sector: 'Marketing', memberIds: ['person-5'], teamMemberIds: ['user-2', 'user-3'], createdDate: '2024-04-01T14:00:00Z' },
];

const mockDeals: Deal[] = [
    { id: 'deal-1', name: 'Phoenix Phase 1', value: 50000, stage: DealStage.Proposal, projectId: 'project-1', expectedCloseDate: '2024-08-30', notes: 'Initial proposal sent. Awaiting feedback.' },
    { id: 'deal-2', name: 'New Landing Page', value: 15000, stage: DealStage.Qualification, projectId: 'project-2', expectedCloseDate: '2024-09-15' },
    { id: 'deal-3', name: 'Data Center Move', value: 75000, stage: DealStage.ClosedWon, projectId: 'project-3', expectedCloseDate: '2024-06-20' },
    { id: 'deal-4', name: 'AI Model License', value: 120000, stage: DealStage.Negotiation, projectId: 'project-4', expectedCloseDate: '2024-09-25' },
    { id: 'deal-5', name: 'Marketing Retainer', value: 80000, stage: DealStage.Prospecting, projectId: 'project-5', expectedCloseDate: '2024-10-10' },
    { id: 'deal-6', name: 'Phase 2 Website Dev', value: 25000, stage: DealStage.NeedsAnalysis, projectId: 'project-2', expectedCloseDate: '2024-11-01'},
];

const mockTasks: Task[] = [
    { id: 'task-1', title: 'Follow up with Big Tech CTO', dueDate: new Date().toISOString().split('T')[0], priority: TaskPriority.High, status: TaskStatus.Todo, projectId: 'project-1' },
    { id: 'task-2', title: 'Prepare presentation for Startup Co.', dueDate: '2024-08-10', priority: TaskPriority.Medium, status: TaskStatus.InProgress, projectId: 'project-2', dealId: 'deal-2' },
    { id: 'task-3', title: 'Schedule demo with Innovate LLC', dueDate: '2024-08-15', priority: TaskPriority.High, status: TaskStatus.Todo, projectId: 'project-4', dealId: 'deal-4' },
    { id: 'task-4', title: 'Finalize branding proposal', dueDate: '2024-08-20', priority: TaskPriority.Medium, status: TaskStatus.InProgress, projectId: 'project-5'},
    { id: 'task-5', title: 'Review contract for Data Center Move', dueDate: '2024-08-05', priority: TaskPriority.Low, status: TaskStatus.Completed, projectId: 'project-3', dealId: 'deal-3' },
];

const mockActivities: Activity[] = [
    { id: 'activity-1', type: 'note', description: 'Had a great introductory call, they are very interested in Project Phoenix.', date: '2023-10-02T11:00:00Z', projectId: 'project-1', userId: 'user-1' },
    { id: 'activity-2', type: 'email', description: 'Sent follow-up email with pricing details.', date: '2023-10-16T09:00:00Z', projectId: 'project-2', userId: 'user-1' },
    { id: 'activity-3', type: 'call', description: 'Discussed technical requirements for AI integration with David Chen.', date: '2024-02-05T15:00:00Z', projectId: 'project-4', userId: 'user-4' },
    { id: 'activity-4', type: 'meeting', description: 'Kick-off meeting for the global branding campaign.', date: '2024-04-02T10:30:00Z', projectId: 'project-5', userId: 'user-2' },
];

const mockSupportTickets: SupportTicket[] = [
    { id: 'ticket-1', subject: 'Login Issue for Project Phoenix', description: 'User cannot log into the new dashboard.', projectId: 'project-1', status: 'Open', createdDate: new Date().toISOString(), userId: 'user-1' },
    { id: 'ticket-2', subject: 'Billing question for website', description: 'Question about the last invoice.', projectId: 'project-2', status: 'Resolved', createdDate: '2024-07-10T10:00:00Z', userId: 'user-2' },
    { id: 'ticket-3', subject: 'API access for AI model', description: 'Need credentials for accessing the sandbox API.', projectId: 'project-4', status: 'Open', createdDate: new Date().toISOString(), userId: 'user-4'},
];

// Context
export const AppContext = createContext<AppContextType | null>(null);

// CSV Helper Functions
const escapeCsvCell = (cell: any): string => {
    if (cell === undefined || cell === null) return '';
    const cellStr = String(cell);
    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
};

const arrayToCsv = (data: any[], headers: string[], idSeparator = ';'): string => {
    const headerRow = headers.join(',');
    const rows = data.map(row =>
        headers.map(header => {
            const value = row[header];
            if (Array.isArray(value)) {
                return escapeCsvCell(value.join(idSeparator));
            }
            return escapeCsvCell(value);
        }).join(',')
    );
    return [headerRow, ...rows].join('\n');
};

const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
};

const csvToArray = (csv: string): any[] => {
    const lines = csv.replace(/\r/g, '').split('\n');
    if (lines.length < 2) return [];
    
    const headers = parseCsvLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCsvLine(line);
        if (values.length !== headers.length) continue; 
        const obj: any = {};
        headers.forEach((header, index) => {
            const key = header.trim();
            const value = values[index].trim();
            if (key === 'memberIds' || key === 'teamMemberIds') {
                 obj[key] = value ? value.split(';') : [];
            } else if(key === 'value' && !isNaN(Number(value))) {
                 obj[key] = Number(value);
            }
            else {
                obj[key] = value;
            }
        });
        data.push(obj);
    }
    return data;
};

// Provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // State management
    const [theme, setTheme] = useLocalStorage<Theme>('crm-theme', 'light');
    const [currentPage, setCurrentPage] = useLocalStorage<Page>('crm-page', 'Dashboard');
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const [clients, setClients] = useLocalStorage<Client[]>('crm-clients', mockClients);
    const [contactPersons, setContactPersons] = useLocalStorage<ContactPerson[]>('crm-contactPersons', mockContactPersons);
    const [projects, setProjects] = useLocalStorage<Project[]>('crm-projects', mockProjects);
    
    const [deals, setDeals] = useLocalStorage<Deal[]>('crm-deals', mockDeals);
    const [tasks, setTasks] = useLocalStorage<Task[]>('crm-tasks', mockTasks);
    const [activities, setActivities] = useLocalStorage<Activity[]>('crm-activities', mockActivities);
    const [supportTickets, setSupportTickets] = useLocalStorage<SupportTicket[]>('crm-supportTickets', mockSupportTickets);
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

    // User & Role State
    const [roles, setRoles] = useLocalStorage<Role[]>('crm-roles', INITIAL_ROLES);
    const [users, setUsers] = useLocalStorage<User[]>('crm-users', INITIAL_USERS);
    const [currentUser, setCurrentUser] = useLocalStorage<User>('crm-currentUser', INITIAL_USERS[0]);


    // AI Initialization
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // Toast logic
    const addToast = useCallback((message: string, type: ToastMessage['type']) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // Page navigation
    const selectClient = useCallback((clientId: string | null) => {
        setSelectedClientId(clientId);
        if (clientId) {
            setCurrentPage('ClientDetail');
        } else {
            setCurrentPage('Clients');
        }
    }, [setCurrentPage]);

    // Permission Logic
    const hasPermission = useCallback((permission: Permission): boolean => {
        const userRole = roles.find(r => r.id === currentUser.roleId);
        if (!userRole) return false;
        return userRole.permissions[permission] || false;
    }, [currentUser, roles]);

    // CRUD for Clients
    const addClient = (client: Omit<Client, 'id' | 'createdDate'>) => {
        const newClient: Client = { ...client, id: `client-${Date.now()}`, createdDate: new Date().toISOString() };
        setClients(prev => [...prev, newClient]);
        addToast('Client added successfully', 'success');
    };
    const updateClient = (updatedClient: Client) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        addToast('Client updated successfully', 'success');
    };
    const deleteClient = (clientId: string) => {
        setClients(prev => prev.filter(c => c.id !== clientId));
        // Also delete associated projects, persons, etc.
        const associatedProjects = projects.filter(p => p.clientId === clientId);
        associatedProjects.forEach(p => deleteProject(p.id));
        setContactPersons(prev => prev.filter(p => p.clientId !== clientId));
        addToast('Client deleted', 'info');
    };

    // CRUD for Contact Persons
    const addContactPerson = (person: Omit<ContactPerson, 'id'>) => {
        const newPerson: ContactPerson = { ...person, id: `person-${Date.now()}`};
        setContactPersons(prev => [...prev, newPerson]);
        addToast('Contact person added', 'success');
    };
    const updateContactPerson = (updatedPerson: ContactPerson) => {
        setContactPersons(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
        addToast('Contact person updated', 'success');
    };
    const deleteContactPerson = (personId: string) => {
        setContactPersons(prev => prev.filter(p => p.id !== personId));
        // Also remove from any projects they were on
        setProjects(prev => prev.map(proj => ({ ...proj, memberIds: proj.memberIds.filter(id => id !== personId) })));
        addToast('Contact person deleted', 'info');
    };

    // CRUD for Projects
    const addProject = (project: Omit<Project, 'id' | 'createdDate'>) => {
        const newProject: Project = { ...project, id: `project-${Date.now()}`, createdDate: new Date().toISOString()};
        setProjects(prev => [...prev, newProject]);
        addToast('Project added', 'success');
    };
    const updateProject = (updatedProject: Project) => {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        addToast('Project updated', 'success');
    };
    const deleteProject = (projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        // Also delete associated deals, tasks, etc.
        setDeals(prev => prev.filter(d => d.projectId !== projectId));
        setTasks(prev => prev.filter(t => t.projectId !== projectId));
        setActivities(prev => prev.filter(a => a.projectId !== projectId));
        setSupportTickets(prev => prev.filter(s => s.projectId !== projectId));
        addToast('Project deleted', 'info');
    };
    
    // CRUD for Deals
    const addDeal = (deal: Omit<Deal, 'id'>) => {
        const newDeal: Deal = { ...deal, id: `deal-${Date.now()}` };
        setDeals(prev => [...prev, newDeal]);
        addToast('Deal added successfully', 'success');
    };
    const updateDeal = (updatedDeal: Deal) => {
        setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
        addToast('Deal updated successfully', 'success');
    };
    const updateDealStage = (dealId: string, newStage: DealStage) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    };
    const deleteDeal = (dealId: string) => {
        setDeals(prev => prev.filter(d => d.id !== dealId));
        addToast('Deal deleted', 'info');
    };
    
    // CRUD for Tasks
    const addTask = (task: Omit<Task, 'id'>) => {
        const newTask: Task = { ...task, id: `task-${Date.now()}` };
        setTasks(prev => [...prev, newTask]);
        addToast('Task added successfully', 'success');
    };
    const updateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        addToast('Task updated', 'success');
    };
    const deleteTask = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        addToast('Task deleted', 'info');
    };
    
    // Activity
    const addActivity = (activity: Omit<Activity, 'id' | 'userId' | 'date'>) => {
        const newActivity: Activity = { ...activity, id: `activity-${Date.now()}`, userId: currentUser.id, date: new Date().toISOString() };
        setActivities(prev => [newActivity, ...prev]);
        addToast('Activity logged', 'success');
    };
    const updateActivity = (updatedActivity: Activity) => {
        setActivities(prev => prev.map(a => a.id === updatedActivity.id ? updatedActivity : a));
        addToast('Activity updated', 'success');
    };

    // CRUD for Support Tickets
    const addSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'createdDate' | 'userId'>) => {
        const newTicket: SupportTicket = { ...ticket, id: `ticket-${Date.now()}`, createdDate: new Date().toISOString(), userId: currentUser.id };
        setSupportTickets(prev => [newTicket, ...prev]);
        addToast('Support ticket created', 'success');
    };
    const updateSupportTicket = (updatedTicket: SupportTicket) => {
        setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        addToast(`Ticket status updated to ${updatedTicket.status}`, 'info');
    };

    // CRUD for Users and Roles (unchanged)
    const addUser = (user: Omit<User, 'id'>) => {
        const newUser = { ...user, id: `user-${Date.now()}`};
        setUsers(prev => [...prev, newUser]);
        addToast('User added successfully', 'success');
    };
    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if(currentUser.id === updatedUser.id) setCurrentUser(updatedUser);
        addToast('User updated successfully', 'success');
    };
    const deleteUser = (userId: string) => {
        if(userId === currentUser.id) {
            addToast("You cannot delete yourself.", 'error');
            return;
        }
        setUsers(prev => prev.filter(u => u.id !== userId));
        addToast('User deleted', 'info');
    };

    const addRole = (role: Omit<Role, 'id'>) => {
        const newRole = { ...role, id: `role-${Date.now()}`};
        setRoles(prev => [...prev, newRole]);
        addToast('Role added successfully', 'success');
    };
    const updateRole = (updatedRole: Role) => {
        setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
        addToast('Role updated successfully', 'success');
    };
    const deleteRole = (roleId: string) => {
        const roleInUse = users.some(u => u.roleId === roleId);
        if(roleInUse) {
            addToast("Cannot delete a role that is currently assigned to a user.", 'error');
            return;
        }
        setRoles(prev => prev.filter(r => r.id !== roleId));
        addToast('Role deleted', 'info');
    };

    // AI Functions
    const generateEmail = async (prompt: string, contactPersonName: string): Promise<string> => {
        try {
            const fullPrompt = `Draft a professional and friendly email to ${contactPersonName}. The purpose of the email is: "${prompt}". Keep it concise.`;
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: fullPrompt,
              config: { systemInstruction: "You are a helpful assistant for a CRM user. Your task is to draft professional emails." }
            });
            addToast('Email draft generated!', 'success');
            return response.text;
        } catch (error) {
            console.error("Error generating email:", error);
            addToast('Failed to generate email draft.', 'error');
            return 'Sorry, I was unable to generate an email at this time.';
        }
    };

    const getCompanyInsights = async (companyName: string): Promise<{ summary: string; sources: GroundingChunk[] }> => {
        try {
            const prompt = `Provide a brief summary of recent news and key information about the company: "${companyName}". Focus on information relevant for a sales representative preparing for a meeting.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                },
            });

            const summary = response.text;
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            addToast('Company insights generated!', 'success');
            return { summary, sources };

        } catch (error) {
            console.error("Error generating company insights:", error);
            addToast('Failed to generate company insights.', 'error');
            throw new Error('Sorry, I was unable to generate insights at this time.');
        }
    };
    
    // Data Management Functions
    const exportData = useCallback(() => {
        try {
            const dataToExport = {
                clients, contactPersons, projects, deals, tasks, activities, supportTickets, roles, users, currentUser,
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'crm-data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error("Error exporting data:", error);
            addToast('Failed to export data.', 'error');
        }
    }, [clients, contactPersons, projects, deals, tasks, activities, supportTickets, roles, users, currentUser, addToast]);

    const importData = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                const data = JSON.parse(text);
                
                if (data.clients && data.contactPersons && data.projects && data.deals && data.tasks && data.activities && data.supportTickets && data.roles && data.users && data.currentUser) {
                    setClients(data.clients); setContactPersons(data.contactPersons); setProjects(data.projects);
                    setDeals(data.deals); setTasks(data.tasks); setActivities(data.activities);
                    setSupportTickets(data.supportTickets); setRoles(data.roles); setUsers(data.users);
                    setCurrentUser(data.currentUser);
                    addToast('Data imported successfully! The page will now reload.', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error("Invalid data structure in JSON file.");
                }
            } catch (error) {
                addToast(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            }
        };
        reader.onerror = () => addToast('Failed to read the file.', 'error');
        reader.readAsText(file);
    }, [setClients, setContactPersons, setProjects, setDeals, setTasks, setActivities, setSupportTickets, setRoles, setUsers, setCurrentUser, addToast]);

    const exportDataAsCsv = useCallback((dataType: CsvDataType) => {
        const dataMap = { clients, contactPersons, projects, deals, tasks };
        const headersMap = {
            clients: ['id', 'name', 'website', 'createdDate', 'ownerId'],
            contactPersons: ['id', 'name', 'email', 'phone', 'designation', 'clientId'],
            projects: ['id', 'name', 'clientId', 'realEstateSegment', 'sector', 'memberIds', 'teamMemberIds', 'createdDate'],
            deals: ['id', 'name', 'value', 'stage', 'projectId', 'expectedCloseDate', 'notes'],
            tasks: ['id', 'title', 'description', 'dueDate', 'priority', 'status', 'projectId', 'dealId'],
        };

        try {
            const data = dataMap[dataType];
            const headers = headersMap[dataType];
            const csvString = arrayToCsv(data, headers);
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dataType}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            addToast(`${dataType} exported successfully!`, 'success');
        } catch (error) {
            console.error(`Error exporting ${dataType}:`, error);
            addToast(`Failed to export ${dataType}.`, 'error');
        }
    }, [clients, contactPersons, projects, deals, tasks, addToast]);

    const importDataFromCsv = useCallback((file: File, dataType: CsvDataType) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result;
                if (typeof text !== 'string') throw new Error("File content is not readable.");
                const data = csvToArray(text);

                switch(dataType) {
                    case 'clients': setClients(data as Client[]); break;
                    case 'contactPersons': setContactPersons(data as ContactPerson[]); break;
                    case 'projects': setProjects(data as Project[]); break;
                    case 'deals': setDeals(data as Deal[]); break;
                    case 'tasks': setTasks(data as Task[]); break;
                    default: throw new Error("Invalid data type for CSV import.");
                }
                addToast(`${dataType} imported successfully!`, 'success');
            } catch (error) {
                addToast(`Error importing data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
            }
        };
        reader.onerror = () => addToast('Failed to read the file.', 'error');
        reader.readAsText(file);
    }, [setClients, setContactPersons, setProjects, setDeals, setTasks, addToast]);


    const resetData = useCallback(() => {
        setClients(mockClients); setContactPersons(mockContactPersons); setProjects(mockProjects);
        setDeals(mockDeals); setTasks(mockTasks); setActivities(mockActivities);
        setSupportTickets(mockSupportTickets); setRoles(INITIAL_ROLES); setUsers(INITIAL_USERS);
        setCurrentUser(INITIAL_USERS[0]);
        addToast('Data has been reset to demo values.', 'info');
    }, [setClients, setContactPersons, setProjects, setDeals, setTasks, setActivities, setSupportTickets, setRoles, setUsers, setCurrentUser, addToast]);

    useEffect(() => { document.body.className = theme; }, [theme]);
    
    const value: AppContextType = {
        theme, setTheme, currentPage, setCurrentPage, toasts, addToast,
        clients, addClient, updateClient, deleteClient, selectedClientId, selectClient,
        contactPersons, addContactPerson, updateContactPerson, deleteContactPerson,
        projects, addProject, updateProject, deleteProject,
        deals, addDeal, updateDeal, deleteDeal, updateDealStage,
        tasks, addTask, updateTask, deleteTask,
        activities, addActivity, updateActivity,
        supportTickets, addSupportTicket, updateSupportTicket,
        users, currentUser, setCurrentUser, addUser, updateUser, deleteUser,
        roles, addRole, updateRole, deleteRole,
        hasPermission,
        generateEmail,
        getCompanyInsights,
        exportData, importData, exportDataAsCsv, importDataFromCsv, resetData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};