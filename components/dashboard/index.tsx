import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card } from '../ui';
import { DealStage, Deal, Activity, Client, Project } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';
import type { User } from '../../types';

// Metric Card Component (local to dashboard)
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
}
const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon }) => (
    <Card className="flex flex-col">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className="text-primary-500 bg-primary-100 dark:bg-primary-900/50 p-2 rounded-md">
                {icon}
            </div>
        </div>
        {change && <p className="text-xs text-green-500 mt-2">{change}</p>}
    </Card>
);

// Sales Pipeline Chart (local to dashboard)
const SalesPipelineChart: React.FC<{ deals: Deal[] }> = ({ deals }) => {
    const data = useMemo(() => {
        const stageCounts = Object.values(DealStage).reduce((acc, stage) => {
            acc[stage] = 0;
            return acc;
        }, {} as Record<DealStage, number>);
        
        deals.forEach(deal => {
            if (stageCounts[deal.stage] !== undefined) {
                stageCounts[deal.stage]++;
            }
        });

        return Object.entries(stageCounts).map(([name, value]) => ({ name, deals: value }));
    }, [deals]);

    return (
        <Card className="h-96">
            <h3 className="text-lg font-semibold mb-4">Sales Pipeline</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: 'currentColor' }} />
                    <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} />
                    <Bar dataKey="deals" fill="#3b82f6" name="Deals in Stage" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};

// Revenue Trend Chart (local to dashboard)
const RevenueTrendChart: React.FC<{ deals: Deal[] }> = ({ deals }) => {
     const data = useMemo(() => {
        const revenueByMonth: { [key: string]: number } = {};
        deals
            .filter(d => d.stage === DealStage.ClosedWon)
            .forEach(deal => {
                const month = new Date(deal.expectedCloseDate).toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!revenueByMonth[month]) {
                    revenueByMonth[month] = 0;
                }
                revenueByMonth[month] += deal.value;
            });
        return Object.entries(revenueByMonth)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a,b) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());
    }, [deals]);

    return (
        <Card className="h-96">
            <h3 className="text-lg font-semibold mb-4">Revenue Trend (Closed Won)</h3>
            <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: 'currentColor' }} />
                    <YAxis fontSize={12} tick={{ fill: 'currentColor' }} tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};


// Activity Feed (local to dashboard)
const ActivityFeed: React.FC<{ activities: Activity[], users: User[], projects: Project[], clients: Client[] }> = ({ activities, users, projects, clients }) => {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <ul className="space-y-4 max-h-80 overflow-y-auto">
                {activities.slice(0, 5).map(activity => {
                    const user = users.find(u => u.id === activity.userId);
                    const project = projects.find(p => p.id === activity.projectId);
                    const client = clients.find(c => c.id === project?.clientId);
                    return (
                        <li key={activity.id} className="flex items-start gap-3">
                            <img src={user?.avatar} alt={user?.name} className="w-8 h-8 rounded-full" />
                            <div>
                                <p className="text-sm">
                                    <span className="font-semibold">{user?.name}</span> logged a {activity.type} for project <span className="font-semibold">{project?.name}</span> ({client?.name}).
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(activity.date).toLocaleString()}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </Card>
    );
};

const Dashboard: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return <div>Loading...</div>;

    const { deals, clients, activities, users, projects } = context;

    const totalRevenue = useMemo(() =>
        deals.filter(d => d.stage === 'Closed Won').reduce((sum, d) => sum + d.value, 0),
        [deals]
    );

    const activeDeals = useMemo(() =>
        deals.filter(d => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost').length,
        [deals]
    );

    const conversionRate = useMemo(() => {
        const won = deals.filter(d => d.stage === 'Closed Won').length;
        return deals.length > 0 ? ((won / deals.length) * 100).toFixed(1) : 0;
    }, [deals]);

    const metrics = [
        { title: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
        { title: "Active Deals", value: activeDeals, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>},
        { title: "New Clients", value: clients.length, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
        { title: "Conversion Rate", value: `${conversionRate}%`, icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16z"/><path d="m14 10-4 4 2.5 2.5"/><path d="M14 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg> },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map(metric => <MetricCard key={metric.title} {...metric} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2">
                   <SalesPipelineChart deals={deals} />
                 </div>
                 <ActivityFeed activities={activities} users={users} projects={projects} clients={clients} />
            </div>
             <div className="grid grid-cols-1">
                <RevenueTrendChart deals={deals} />
             </div>
        </div>
    );
};

export default Dashboard;
