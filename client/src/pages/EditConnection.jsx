import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Save, User, Briefcase, MapPin, Target, Info, Clock, Hash, Handshake } from 'lucide-react';

const EditConnection = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { connections, updateConnection } = useData();
    const [formData, setFormData] = useState(null);

    useEffect(() => {
        const connection = connections.find(c => c.id === id);
        if (connection) {
            setFormData({
                name: connection.name || '',
                role: connection.role || '',
                company: connection.company || '',
                location: connection.location || '',
                industry: connection.industry || '',
                howMet: connection.howMet || '',
                frequency: connection.frequency || 90,
                email: connection.email || '',
                linkedin: connection.linkedin || '',
                goals: connection.goals || '',
                notes: connection.notes || '',
                tags: connection.tags ? connection.tags.join(', ') : ''
            });
        }
    }, [id, connections]);

    if (!formData) return <div>Loading...</div>;

    const handleSubmit = (e) => {
        e.preventDefault();
        updateConnection(id, {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
        navigate(`/connections/${id}`);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <button
                onClick={() => navigate(`/connections/${id}`)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}
            >
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Cancel
            </button>

            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Edit Connection</h1>

            <div className="card" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>

                    {/* Basic Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                    </div>

                    {/* Role, Company \u0026 Industry */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Role</label>
                            <div style={{ position: 'relative' }}>
                                <Briefcase size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="text"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Company</label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Industry</label>
                            <input
                                type="text"
                                value={formData.industry}
                                placeholder="Technology, Finance..."
                                onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                    </div>

                    {/* V2 Fields: Location & How Met */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Location</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="text"
                                    value={formData.location}
                                    placeholder="City, Timezone"
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>How we met</label>
                            <div style={{ position: 'relative' }}>
                                <Handshake size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="text"
                                    value={formData.howMet}
                                    placeholder="Conference, Intro..."
                                    onChange={e => setFormData({ ...formData, howMet: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Frequency & Tags */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Review Frequency (Days)</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="number"
                                    value={formData.frequency}
                                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tags</label>
                            <div style={{ position: 'relative' }}>
                                <Hash size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="text"
                                    value={formData.tags}
                                    placeholder="Comma separated"
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Goals */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Goals</label>
                        <div style={{ position: 'relative' }}>
                            <Target size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--color-text-secondary)' }} />
                            <textarea
                                value={formData.goals}
                                onChange={e => setFormData({ ...formData, goals: e.target.value })}
                                rows={3}
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Context Notes */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>General Notes</label>
                        <div style={{ position: 'relative' }}>
                            <Info size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--color-text-secondary)' }} />
                            <textarea
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.125rem', marginTop: '1rem' }}>
                        <Save size={20} style={{ marginRight: '8px' }} /> Update Connection
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditConnection;
