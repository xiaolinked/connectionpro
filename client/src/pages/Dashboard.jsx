import React from 'react';
import { useData } from '../context/DataContext';
import StatCard from '../components/dashboard/StatCard';
import SmartReminders from '../components/dashboard/SmartReminders';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, TrendingUp, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getConnectionStatus } from '../utils/reminders';

const Dashboard = () => {
    const { connections, logs, isLoading } = useData();
    const { user } = useAuth();

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading network data...</div>;
    }

    const firstName = user?.name?.split(' ')[0] || 'there';

    // Calculate Stats
    const totalConnections = connections.length;

    const upcomingFollowUps = connections.filter(c => {
        const { status } = getConnectionStatus(c);
        return status === 'overdue' || status === 'due_soon';
    }).length;

    const recentGrowth = logs.filter(l => l.tags?.includes('learning')).length;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Welcome, {firstName}!</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>Here is your professional network overview.</p>
                </div>
                <Link to="/connections/new" className="btn btn-primary">
                    <UserPlus size={18} style={{ marginRight: '8px' }} />
                    Add Connection
                </Link>
            </div>

            {/* Smart Reminders Section */}
            <SmartReminders />

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <StatCard title="Total Connections" value={totalConnections} icon={Users} color="#3b82f6" to="/connections" />
                <StatCard title="Upcoming Follow-ups" value={upcomingFollowUps} icon={Calendar} color="#f59e0b" to="/follow-ups" />
                <StatCard title="Growth Moments" value={recentGrowth} icon={TrendingUp} color="#10b981" />
            </div>

            {/* Recent Activity / Empty State */}
            <div className="card">
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Recent Interactions</h2>
                {logs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-secondary)' }}>
                        <p>No interactions logged yet.</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Start by adding a connection and logging a chat!</p>
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none' }}>
                        {logs.slice(0, 5).map(log => {
                            const connection = connections.find(c => c.id === log.connection_id);
                            return (
                                <li key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    <Link
                                        to={`/connections/${log.connection_id}`}
                                        style={{
                                            display: 'block',
                                            padding: '0.75rem 0',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        {connection && (
                                            <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                                                {connection.name}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.875rem' }}>
                                            {log.notes}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
