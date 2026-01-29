import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { getConnectionStatus } from '../../utils/reminders';
import { Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const SmartReminders = () => {
    const { connections, addLog } = useData();
    const [skipping, setSkipping] = useState({});

    const reminders = connections
        .map(c => ({ ...c, meta: getConnectionStatus(c) }))
        .filter(c => c.meta.status === 'overdue' || c.meta.status === 'due_soon')
        .sort((a, b) => {
            // Overdue before due_soon
            if (a.meta.status !== b.meta.status) return a.meta.status === 'overdue' ? -1 : 1;
            // Within overdue: most overdue first
            if (a.meta.status === 'overdue') return (b.meta.overdueBy || 0) - (a.meta.overdueBy || 0);
            // Within due_soon: soonest due first
            return (a.meta.dueIn || 0) - (b.meta.dueIn || 0);
        })
        .slice(0, 3); // Take top 3

    const handleSkip = async (e, connection) => {
        e.preventDefault();
        e.stopPropagation();

        setSkipping({ ...skipping, [connection.id]: true });

        try {
            await addLog({
                connection_id: connection.id,
                type: 'skip',
                notes: `Skipped follow-up reminder for ${connection.name}`,
                tags: ['skip']
            });
            // Log added successfully - the connection will be refreshed via DataContext
        } catch (err) {
            console.error('Failed to skip reminder:', err);
        } finally {
            setSkipping({ ...skipping, [connection.id]: false });
        }
    };

    if (reminders.length === 0) return null;

    return (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-accent-primary)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <Clock size={20} style={{ marginRight: '8px', color: 'var(--color-accent-primary)' }} />
                Smart Reminders
            </h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
                {reminders.map(c => (
                    <div key={c.id} style={{ position: 'relative' }}>
                        <Link
                            to={`/connections/${c.id}`}
                            style={{
                                display: 'block',
                                padding: '0.75rem',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'background-color 0.2s',
                                paddingRight: '3rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                        >
                            <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{c.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                Last contact: {c.last_contact ? new Date(c.last_contact).toLocaleDateString() : 'Never'}
                            </div>
                        </Link>
                        <button
                            onClick={(e) => handleSkip(e, c)}
                            disabled={skipping[c.id]}
                            className="btn"
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: '0.5rem',
                                transform: 'translateY(-50%)',
                                padding: '0.5rem',
                                backgroundColor: 'var(--color-bg-secondary)',
                                border: '1px solid var(--color-border)',
                                minWidth: 'auto',
                                opacity: skipping[c.id] ? 0.5 : 1
                            }}
                            title="Skip this reminder"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SmartReminders;
