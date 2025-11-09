

import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card } from '../ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// FIX: Import Deal type for props
import { DealStage, Deal } from '../../types';

// Sales by Period Chart
// FIX: Typed deals prop to ensure type safety.
const SalesByPeriodChart: React.FC<{ deals: Deal[] }> = ({ deals }) => {
    const data = useMemo(() => {
        const salesByMonth: { [key: string]: number } = {};
        deals
            .filter(d => d.stage === DealStage.ClosedWon)
            .forEach(deal => {
                const month = new Date(deal.expectedCloseDate).toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!salesByMonth[month]) {
                    salesByMonth[month] = 0;
                }
                salesByMonth[month] += 1;
            });
        return Object.entries(salesByMonth)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a,b) => new Date(`1 ${a.name}`).getTime() - new Date(`1 ${b.name}`).getTime());
    }, [deals]);

    return (
        <Card className="h-96">
            <h3 className="text-lg font-semibold mb-4">Deals Won Per Month</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128, 128, 128, 0.2)" />
                    <XAxis dataKey="name" fontSize={12} tick={{ fill: 'currentColor' }} />
                    <YAxis fontSize={12} tick={{ fill: 'currentColor' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} />
                    <Bar dataKey="sales" fill="#3b82f6" name="Deals Won" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};

// Win/Loss Analysis Chart
// FIX: Typed deals prop to ensure type safety.
const WinLossChart: React.FC<{ deals: Deal[] }> = ({ deals }) => {
    const data = useMemo(() => {
        const won = deals.filter(d => d.stage === DealStage.ClosedWon).length;
        const lost = deals.filter(d => d.stage === DealStage.ClosedLost).length;
        return [
            { name: 'Won', value: won },
            { name: 'Lost', value: lost }
        ];
    }, [deals]);

    const COLORS = ['#10b981', '#ef4444'];

    return (
        <Card className="h-96">
            <h3 className="text-lg font-semibold mb-4">Win / Loss Analysis</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    );
};

const ReportsPage: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) return <div>Loading...</div>;

    const { deals } = context;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Reports</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SalesByPeriodChart deals={deals} />
                <WinLossChart deals={deals} />
            </div>
            {/* You can add more report components here, e.g., Conversion Funnel */}
        </div>
    );
};

export default ReportsPage;