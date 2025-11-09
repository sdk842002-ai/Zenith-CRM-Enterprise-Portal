import React, { useContext, useState, useMemo, useCallback } from 'react';
import { AppContext } from '../../context/AppContext';
import { Button, Card, Input, Modal, Select } from '../ui';
import type { Task, Deal, Client, Project } from '../../types';
import { TaskStatus, TaskPriority } from '../../types';

// Task Form Component
const TaskForm: React.FC<{ 
    task?: Task; 
    projects: Project[]; 
    clients: Client[];
    deals: Deal[]; 
    onSave: (taskData: Omit<Task, 'id'> | Task) => void; 
    onClose: () => void; 
}> = ({ task, projects, clients, deals, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        dueDate: task?.dueDate || new Date().toISOString().split('T')[0],
        priority: task?.priority || TaskPriority.Medium,
        status: task?.status || TaskStatus.Todo,
        projectId: task?.projectId || '',
        dealId: task?.dealId || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (task) {
            onSave({ ...task, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Title" name="title" value={formData.title} onChange={handleChange} required />
            <Input label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} required />
            <Select label="Priority" name="priority" value={formData.priority} onChange={handleChange}>
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Status" name="status" value={formData.status} onChange={handleChange}>
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Select label="Related Project (Optional)" name="projectId" value={formData.projectId} onChange={handleChange}>
                <option value="">None</option>
                {projects.map(p => {
                    const client = clients.find(c => c.id === p.clientId);
                    return <option key={p.id} value={p.id}>{p.name} ({client?.name})</option>
                })}
            </Select>
            <Select label="Related Deal (Optional)" name="dealId" value={formData.dealId} onChange={handleChange}>
                 <option value="">None</option>
                 {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="submit">Save Task</Button>
            </div>
        </form>
    );
};

type TaskFilter = 'All' | TaskStatus | 'Overdue';

const TasksPage: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
    const [filter, setFilter] = useState<TaskFilter>('All');

    if (!context) return <div>Loading...</div>;

    const { tasks, clients, projects, deals, addTask, updateTask, deleteTask, hasPermission } = context;
    const canManageTasks = hasPermission('manageTasks');
    
    const filterOptions: TaskFilter[] = ['All', TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Completed, 'Overdue'];

    const filteredTasks = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return tasks.filter(task => {
            switch (filter) {
                case TaskStatus.Todo:
                    return task.status === TaskStatus.Todo;
                case TaskStatus.InProgress:
                    return task.status === TaskStatus.InProgress;
                case 'Overdue': 
                    return task.dueDate < today && task.status !== TaskStatus.Completed;
                case TaskStatus.Completed: 
                    return task.status === TaskStatus.Completed;
                case 'All':
                default: return true;
            }
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [tasks, filter]);

    const handleOpenModal = (task?: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingTask(undefined);
        setIsModalOpen(false);
    };

    const handleSaveTask = useCallback((taskData: Omit<Task, 'id'> | Task) => {
        if ('id' in taskData) {
            updateTask(taskData);
        } else {
            addTask(taskData);
        }
        handleCloseModal();
    }, [addTask, updateTask]);

    const getPriorityBadgeColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.High: return 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300';
            case TaskPriority.Medium: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300';
            case TaskPriority.Low: return 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300';
        }
    };
    
    const getPriorityBorderColor = (priority: TaskPriority) => {
        switch (priority) {
            case TaskPriority.High: return 'border-l-red-500';
            case TaskPriority.Medium: return 'border-l-yellow-500';
            case TaskPriority.Low: return 'border-l-green-500';
            default: return 'border-l-gray-400';
        }
    };

    const handleToggleComplete = (task: Task) => {
        if (!canManageTasks) return;
        const newStatus = task.status === TaskStatus.Completed ? TaskStatus.Todo : TaskStatus.Completed;
        updateTask({ ...task, status: newStatus });
    };
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tasks</h1>
                {canManageTasks && <Button onClick={() => handleOpenModal()}>Add Task</Button>}
            </div>
            
            <Card>
                <div className="flex flex-wrap gap-2 mb-4">
                    {filterOptions.map(f =>
                        <Button key={f} size="sm" variant={filter === f ? 'primary' : 'secondary'} onClick={() => setFilter(f)}>{f}</Button>
                    )}
                </div>
                 <ul className="space-y-3">
                    {filteredTasks.length > 0 ? filteredTasks.map(task => {
                        const project = projects.find(p => p.id === task.projectId);
                        const client = clients.find(c => c.id === project?.clientId);
                        return (
                            <li key={task.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md border-l-4 ${getPriorityBorderColor(task.priority)}`}>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className={`font-medium ${task.status === TaskStatus.Completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{task.title}</p>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityBadgeColor(task.priority)}`}>
                                            {task.priority} Priority
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        {project && <span>| For: {project.name} ({client?.name})</span>}
                                    </div>
                                </div>
                                {canManageTasks && (
                                    <div className="flex items-center gap-2 mt-2 sm:mt-0 self-end sm:self-center">
                                        <input
                                            type="checkbox"
                                            title={task.status === TaskStatus.Completed ? "Mark as To Do" : "Mark as Completed"}
                                            aria-label="Mark task complete"
                                            checked={task.status === TaskStatus.Completed}
                                            onChange={() => handleToggleComplete(task)}
                                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                            disabled={!canManageTasks}
                                        />
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenModal(task)}>Edit</Button>
                                        <Button size="sm" variant="danger" onClick={() => deleteTask(task.id)}>Delete</Button>
                                    </div>
                                )}
                            </li>
                        )
                    }) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No tasks found for this filter.</div>
                    )}
                 </ul>
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTask ? 'Edit Task' : 'Add New Task'}>
                <TaskForm task={editingTask} clients={clients} projects={projects} deals={deals} onSave={handleSaveTask} onClose={handleCloseModal} />
            </Modal>
        </div>
    );
};

export default TasksPage;