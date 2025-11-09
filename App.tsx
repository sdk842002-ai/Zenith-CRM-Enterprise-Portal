import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';
import { Sidebar, Header } from './components/layout';
import Dashboard from './components/dashboard';
import ClientsPage from './components/contacts';
import ClientDetailPage from './components/contacts/ContactDetailPage';
import DealsPage from './components/deals';
import TasksPage from './components/tasks';
import ReportsPage from './components/reports';
import SettingsPage from './components/settings';
import { ToastContainer } from './components/ui';

const App: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;

    const { theme, currentPage, toasts } = context;

    const renderPage = () => {
        switch (currentPage) {
            case 'Dashboard':
                return <Dashboard />;
            case 'Clients':
                return <ClientsPage />;
            case 'ClientDetail':
                return <ClientDetailPage />;
            case 'Deals':
                return <DealsPage />;
            case 'Tasks':
                return <TasksPage />;
            case 'Reports':
                return <ReportsPage />;
            case 'Settings':
                return <SettingsPage />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className={`${theme} font-sans`}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
                        {renderPage()}
                    </main>
                </div>
            </div>
            <ToastContainer toasts={toasts} />
        </div>
    );
};

export default App;
