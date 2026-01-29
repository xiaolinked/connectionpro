import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom'; // Ensure Link is imported
import { useData } from '../context/DataContext';
import { ArrowLeft, Building, Mail, Target, Calendar, MessageSquare, Tag, Trash2, MapPin, Handshake, Info, Clock, PenTool } from 'lucide-react';

const ConnectionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { connections, logs, addLog, deleteConnection } = useData();

    const connection = connections.find(c => c.id === id);
    const connectionLogs = logs.filter(l => l.connection_id === id);

    const [newLog, setNewLog] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'meeting', // meeting, email, call, social
        notes: '',
        tags: ''
    });

    if (!connection) {
        return (
            <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2>Connection not found</h2>
                <Link to="/connections" className="text-accent">Return to list</Link>
            </div>
        );
    }

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this connection?')) {
            deleteConnection(id);
            navigate('/connections');
        }
    };

    const handleLogSubmit = (e) => {
        e.preventDefault();
        addLog({
            connectionId: id,
            ...newLog,
            tags: newLog.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
        setNewLog({
            date: new Date().toISOString().split('T')[0],
            type: 'meeting',
            notes: '',
            tags: ''
        });
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/connections')}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}
            >
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back to List
            </button>

            {/* Header Profile - Updated for V2 */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent-secondary), var(--color-accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', color: '#fff', flexShrink: 0 }}>
                            {connection.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{connection.name}</h1>

                                <Link
                                    to={`/connections/${id}/edit`}
                                    style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '0.5rem', marginRight: '0.5rem' }}
                                    title="Edit Connection"
                                >
                                    <PenTool size={20} />
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                    title="Delete Connection"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {connection.role && <p style={{ fontSize: '1.125rem', color: 'var(--color-text-primary)' }}>{connection.role}</p>}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                {connection.company && <div style={{ display: 'flex', alignItems: 'center' }}><Building size={16} style={{ marginRight: '8px' }} /> {connection.company}</div>}
                                {connection.email && <div style={{ display: 'flex', alignItems: 'center' }}><Mail size={16} style={{ marginRight: '8px' }} /> {connection.email}</div>}
                                {connection.location && <div style={{ display: 'flex', alignItems: 'center' }}><MapPin size={16} style={{ marginRight: '8px' }} /> {connection.location}</div>}
                                {connection.howMet && <div style={{ display: 'flex', alignItems: 'center' }}><Handshake size={16} style={{ marginRight: '8px' }} /> Met: {connection.howMet}</div>}
                                {connection.frequency && <div style={{ display: 'flex', alignItems: 'center' }}><Clock size={16} style={{ marginRight: '8px' }} /> Every {connection.frequency}d</div>}
                            </div>

                            {connection.tags?.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {connection.tags.map((tag, i) => (
                                        <span key={i} style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid var(--color-border)' }}>
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {(connection.goals || connection.notes) && (
                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'grid', gap: '1.5rem' }}>
                        {connection.goals && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--color-accent-primary)' }}>
                                    <Target size={18} style={{ marginRight: '8px' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Goals</h3>
                                </div>
                                <p style={{ lineHeight: '1.6', color: 'var(--color-text-secondary)' }}>{connection.goals}</p>
                            </div>
                        )}
                        {connection.notes && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: 'var(--color-accent-secondary)' }}>
                                    <Info size={18} style={{ marginRight: '8px' }} />
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Context</h3>
                                </div>
                                <p style={{ lineHeight: '1.6', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{connection.notes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.25fr)', gap: '2rem' }}>
                {/* Timeline Interaction History */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Timeline</h2>

                    {connectionLogs.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
                            <p>No interactions logged yet.</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Log your first meeting or call!</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
                            {/* Timeline vertical line */}
                            <div style={{ position: 'absolute', left: '16px', top: '16px', bottom: '0', width: '2px', backgroundColor: 'var(--color-border)' }}></div>

                            {connectionLogs.map(log => (
                                <div key={log.id} style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', position: 'relative' }}>
                                    {/* Timeline dot */}
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', border: '2px solid var(--color-accent-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1
                                    }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent-primary)' }}></div>
                                    </div>

                                    <div className="card" style={{ flex: 1, padding: '1.25rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', textTransform: 'capitalize', color: 'var(--color-accent-secondary)' }}>{log.type || 'interaction'}</span>
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{new Date(log.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p style={{ marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>{log.notes}</p>
                                        {log.tags && log.tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {log.tags.map((t, i) => (
                                                    <span key={i} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>#{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Log Interaction Form */}
                <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <MessageSquare size={18} style={{ marginRight: '8px' }} />
                            Log Interaction
                        </h3>
                        <form onSubmit={handleLogSubmit} style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newLog.date}
                                    onChange={e => setNewLog({ ...newLog, date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Type</label>
                                <select
                                    value={newLog.type}
                                    onChange={e => setNewLog({ ...newLog, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                >
                                    <option value="meeting">Meeting</option>
                                    <option value="call">Call</option>
                                    <option value="email">Email</option>
                                    <option value="social">Social Media</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Notes</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={newLog.notes}
                                    onChange={e => setNewLog({ ...newLog, notes: e.target.value })}
                                    placeholder="What did you discuss?"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    value={newLog.tags}
                                    onChange={e => setNewLog({ ...newLog, tags: e.target.value })}
                                    placeholder="learning, referral, update"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Add Log
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConnectionDetail;
