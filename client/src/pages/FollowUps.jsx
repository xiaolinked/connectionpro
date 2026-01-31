import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useToast, TOAST_TYPES } from '../context/ToastContext';
import { getConnectionStatus } from '../utils/reminders';
import { Calendar, Clock, AlertCircle, Users, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const FollowUps = () => {
    const { connections, isLoading, addLog } = useData();
    const [activeSection, setActiveSection] = useState('overdue');

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading follow-ups...</div>;
    }

    // Categorize connections
    const categorized = {
        overdue: [],
        week: [],
        month: [],
        noSchedule: []
    };

    connections.forEach(conn => {
        const { status, daysDiff } = getConnectionStatus(conn);
        const frequency = parseInt(conn.frequency) || 0;

        if (frequency === 0 || !frequency) {
            categorized.noSchedule.push(conn);
        } else if (status === 'overdue') {
            categorized.overdue.push(conn);
        } else if (status === 'due_soon') {
            const daysUntilDue = frequency - daysDiff;
            if (daysUntilDue <= 7) {
                categorized.week.push(conn);
            } else if (daysUntilDue <= 30) {
                categorized.month.push(conn);
            }
        } else {
            // Healthy - check if due within 30 days
            const daysUntilDue = frequency - daysDiff;
            if (daysUntilDue <= 7) {
                categorized.week.push(conn);
            } else if (daysUntilDue <= 30) {
                categorized.month.push(conn);
            }
        }
    });

    const sections = [
        { id: 'overdue', label: 'Overdue', icon: AlertCircle, color: '#ef4444', count: categorized.overdue.length },
        { id: 'week', label: 'Coming Week', icon: Clock, color: '#f59e0b', count: categorized.week.length },
        { id: 'month', label: 'Coming Month', icon: Calendar, color: '#3b82f6', count: categorized.month.length },
        { id: 'noSchedule', label: 'No Schedule', icon: Users, color: '#6b7280', count: categorized.noSchedule.length }
    ];

    const { showToast } = useToast();

    const handleAction = async (e, conn, type) => {
        e.preventDefault(); // Prevent navigation where button is inside link
        try {
            await addLog({
                connection_id: conn.id,
                type: type === 'skip' ? 'skip' : 'interaction',
                notes: type === 'skip' ? 'Skipped follow-up via dashboard' : 'Marked done via dashboard',
                date: new Date().toISOString()
            });

            // Show visual feedback with link
            const actionText = type === 'skip' ? 'Skipped follow-up' : 'Logged interaction';
            showToast(
                <span>
                    {actionText} with <strong>{conn.name}</strong>. {' '}
                    <Link to={`/connections/${conn.id}`} style={{ textDecoration: 'underline', color: 'inherit' }}>
                        View
                    </Link>
                </span>,
                TOAST_TYPES.SUCCESS
            );

        } catch (error) {
            console.error('Failed to update follow-up', error);
            showToast('Failed to update follow-up', TOAST_TYPES.ERROR);
        }
    };

    const renderConnectionList = (connections) => {
        if (connections.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    No connections in this category
                </div>
            );
        }

        return (
            <div style={{ overflowX: 'auto', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '1px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--color-bg-primary)', borderRadius: '12px', overflow: 'hidden' }}>
                    <thead>
                        <tr style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Contact</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Last Contact</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Frequency</th>
                            <th style={{ textAlign: 'left', padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {connections.map(conn => {
                            const { daysDiff } = getConnectionStatus(conn);
                            const frequency = parseInt(conn.frequency) || 0;
                            const daysUntilDue = frequency > 0 ? frequency - daysDiff : null;

                            return (
                                <tr key={conn.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background-color 0.2s' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <Link
                                            to={`/connections/${conn.id}`}
                                            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                        >
                                            <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{conn.name}</div>
                                            {conn.company && (
                                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                    {conn.role ? `${conn.role} at ${conn.company}` : conn.company}
                                                </div>
                                            )}
                                        </Link>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        {conn.lastContact ? new Date(conn.lastContact).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        Every {frequency} days
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        {daysUntilDue !== null && (
                                            <span style={{
                                                color: daysUntilDue > 0 ? 'var(--color-text-secondary)' : '#ef4444',
                                                fontWeight: daysUntilDue <= 0 ? '600' : '400'
                                            }}>
                                                {daysUntilDue > 0 ? `Due in ${daysUntilDue} days` : `${Math.abs(daysUntilDue)} days overdue`}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={(e) => handleAction(e, conn, 'done')}
                                                title="Mark as Done"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.5rem 0.75rem',
                                                    border: '1px solid #059669',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#059669',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#059669';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                                                    e.currentTarget.style.color = '#059669';
                                                }}
                                            >
                                                <Check size={16} />
                                                Done
                                            </button>
                                            <button
                                                onClick={(e) => handleAction(e, conn, 'skip')}
                                                title="Skip"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.5rem 0.75rem',
                                                    border: '1px solid #dc2626',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '600',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = '#dc2626';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                                    e.currentTarget.style.color = '#dc2626';
                                                }}
                                            >
                                                <X size={16} />
                                                Skip
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Follow-ups</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
                Manage your upcoming and overdue connections.
            </p>

            {/* Section Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {sections.map(section => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className="btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                backgroundColor: isActive ? section.color : 'var(--color-bg-secondary)',
                                color: isActive ? 'white' : 'var(--color-text-primary)',
                                border: isActive ? 'none' : '1px solid var(--color-border)'
                            }}
                        >
                            <Icon size={16} />
                            {section.label}
                            <span style={{
                                backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-primary)',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                {section.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Active Section Content */}
            <div>
                {renderConnectionList(categorized[activeSection])}
            </div>
        </div>
    );
};

export default FollowUps;
