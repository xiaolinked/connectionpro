import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { getConnectionStatus } from '../utils/reminders';
import { Calendar, Clock, AlertCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const FollowUps = () => {
    const { connections, isLoading } = useData();
    const [activeSection, setActiveSection] = useState('overdue');

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading follow-ups...</div>;
    }

    // Categorize connections
    const now = new Date();
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

    const renderConnectionList = (connections) => {
        if (connections.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    No connections in this category
                </div>
            );
        }

        return (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
                {connections.map(conn => {
                    const { daysDiff } = getConnectionStatus(conn);
                    const frequency = parseInt(conn.frequency) || 0;
                    const daysUntilDue = frequency > 0 ? frequency - daysDiff : null;

                    return (
                        <Link
                            key={conn.id}
                            to={`/connections/${conn.id}`}
                            className="card"
                            style={{
                                display: 'block',
                                textDecoration: 'none',
                                color: 'inherit',
                                padding: '1rem',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{conn.name}</div>
                                    {conn.company && (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {conn.role ? `${conn.role} at ${conn.company}` : conn.company}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    {conn.last_contact && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                            Last: {new Date(conn.last_contact).toLocaleDateString()}
                                        </div>
                                    )}
                                    {daysUntilDue !== null && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                            {daysUntilDue > 0 ? `Due in ${daysUntilDue} days` : `${Math.abs(daysUntilDue)} days overdue`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
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
