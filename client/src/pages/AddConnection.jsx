import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Save, ArrowLeft } from 'lucide-react';

const AddConnection = () => {
    const navigate = useNavigate();
    const { addConnection } = useData();
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        company: '',
        email: '',
        tags: '', // Comma separated
        goals: '',
        frequency: '30' // Default 30 days
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const connection = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        };
        addConnection(connection);
        navigate('/connections');
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <button
                onClick={() => navigate(-1)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}
            >
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Back
            </button>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '2rem' }}>Add New Connection</h1>

            <form onSubmit={handleSubmit} className="card">
                <div style={{ display: 'grid', gap: '1.5rem' }}>

                    {/* Basic Info */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name</label>
                        <input
                            required
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            placeholder="e.g. Jane Smith"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Role</label>
                            <input
                                type="text"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                placeholder="Product Manager"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Company</label>
                            <input
                                type="text"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                placeholder="Acme Corp"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            placeholder="jane@example.com"
                        />
                    </div>

                    {/* Growth & Contact */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Tags (comma separated)</label>
                        <input
                            type="text"
                            name="tags"
                            value={formData.tags}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            placeholder="mentor, tech, hiring"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Professional Goals (with this person)</label>
                        <textarea
                            name="goals"
                            value={formData.goals}
                            onChange={handleChange}
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                            placeholder="e.g. Learn about Product Management, Ask for referral"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Follow-up Frequency (days)</label>
                        <input
                            type="number"
                            name="frequency"
                            value={formData.frequency}
                            onChange={handleChange}
                            min="1"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                        />
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                            <Save size={18} style={{ marginRight: '8px' }} />
                            Save Connection
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default AddConnection;
