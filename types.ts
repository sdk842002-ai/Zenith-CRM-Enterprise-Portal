// types.ts

export type Theme = 'light' | 'dark';

export type Page = 'Dashboard' | 'Clients' | 'ClientDetail' | 'Deals' | 'Tasks' | 'Reports' | 'Settings';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type Permission = 
  | 'viewDashboard'
  | 'viewContacts'
  | 'manageContacts'
  | 'viewDeals'
  | 'manageDeals'
  | 'viewTasks'
  | 'manageTasks'
  | 'viewReports'
  | 'viewSettings'
  | 'manageUsers'
  | 'manageRoles';

export type RolePermissions = {
  [key in Permission]: boolean;
};

export interface Role {
  id: string;
  name: string;
  permissions: RolePermissions;
  isDefault?: boolean;
}

export interface User {
  id:string;
  name: string;
  email: string;
  avatar: string;
  roleId: string;
}

// Represents the company
export interface Client {
  id: string;
  name: string; // Company Name
  website: string;
  createdDate: string;
  ownerId?: string;
}

// Represents an individual person at a client company
export interface ContactPerson {
    id: string;
    name: string;
    email: string;
    phone: string;
    designation: string;
    clientId: string;
}

// Represents a project for a client
export interface Project {
    id: string;
    name: string;
    clientId: string;
    realEstateSegment: string;
    sector: string;
    memberIds: string[]; // IDs of ContactPersons on this project
    teamMemberIds: string[]; // IDs of Users on this project
    createdDate: string;
}


export enum DealStage {
    Prospecting = 'Prospecting',
    Qualification = 'Qualification',
    NeedsAnalysis = 'Needs Analysis',
    Proposal = 'Proposal',
    Negotiation = 'Negotiation',
    ClosedWon = 'Closed Won',
    ClosedLost = 'Closed Lost',
}

export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: DealStage;
  projectId: string; // Linked to a project
  expectedCloseDate: string;
  notes?: string;
}

export enum TaskStatus {
    Todo = 'To Do',
    InProgress = 'In Progress',
    Completed = 'Completed',
}

export enum TaskPriority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  projectId?: string; // Linked to a project
  dealId?: string;
}

export interface Activity {
  id: string;
  type: 'note' | 'email' | 'call' | 'meeting';
  description: string;
  date: string;
  projectId: string; // Linked to a project
  userId: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    projectId: string; // Linked to a project
    status: 'Open' | 'Resolved' | 'Escalated';
    createdDate: string;
    userId: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export type CsvDataType = 'clients' | 'contactPersons' | 'projects' | 'deals' | 'tasks';

// This will be the shape of our context
export interface AppContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    toasts: ToastMessage[];
    addToast: (message: string, type: ToastMessage['type']) => void;
    
    // Data
    clients: Client[];
    addClient: (client: Omit<Client, 'id' | 'createdDate'>) => void;
    updateClient: (client: Client) => void;
    deleteClient: (clientId: string) => void;
    selectedClientId: string | null;
    selectClient: (clientId: string | null) => void;

    contactPersons: ContactPerson[];
    addContactPerson: (person: Omit<ContactPerson, 'id'>) => void;
    updateContactPerson: (person: ContactPerson) => void;
    deleteContactPerson: (personId: string) => void;
    
    projects: Project[];
    addProject: (project: Omit<Project, 'id' | 'createdDate'>) => void;
    updateProject: (project: Project) => void;
    deleteProject: (projectId: string) => void;
    
    deals: Deal[];
    addDeal: (deal: Omit<Deal, 'id'>) => void;
    updateDeal: (deal: Deal) => void;
    deleteDeal: (dealId: string) => void;
    updateDealStage: (dealId: string, newStage: DealStage) => void;
    
    tasks: Task[];
    addTask: (task: Omit<Task, 'id'>) => void;
    updateTask: (task: Task) => void;
    deleteTask: (taskId: string) => void;
    
    activities: Activity[];
    addActivity: (activity: Omit<Activity, 'id' | 'userId' | 'date'>) => void;
    updateActivity: (activity: Activity) => void;
    
    supportTickets: SupportTicket[];
    addSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdDate' | 'userId'>) => void;
    updateSupportTicket: (ticket: SupportTicket) => void;

    // Users & Roles
    users: User[];
    currentUser: User;
    setCurrentUser: (user: User) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;

    roles: Role[];
    addRole: (role: Omit<Role, 'id'>) => void;
    updateRole: (role: Role) => void;
    deleteRole: (roleId: string) => void;

    // Permissions
    hasPermission: (permission: Permission) => boolean;
    
    // AI
    generateEmail: (prompt: string, contactPersonName: string) => Promise<string>;
    getCompanyInsights: (companyName: string) => Promise<{ summary: string; sources: GroundingChunk[] }>;

    // Data Management
    exportData: () => void;
    importData: (file: File) => void;
    exportDataAsCsv: (dataType: CsvDataType) => void;
    importDataFromCsv: (file: File, dataType: CsvDataType) => void;
    resetData: () => void;
}