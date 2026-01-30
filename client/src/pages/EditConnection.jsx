import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast, TOAST_TYPES } from '../context/ToastContext';
import { ArrowLeft, Save, User, Briefcase, MapPin, Target, Info, Clock, Hash, Handshake, Plus } from 'lucide-react';

const EditConnection = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { connections, updateConnection } = useData();
    const { showToast } = useToast();
    const [formData, setFormData] = useState(null);

    // Multi-Category Tags State
    // Multi-Category Tags State
    const [tagCategories, setTagCategories] = useState({});
    const [selectedByCategory, setSelectedByCategory] = useState({});
    const [areTagsLoaded, setAreTagsLoaded] = useState(false);

    useEffect(() => {
        const loadTags = async () => {
            try {
                const data = await api.getTags('connection');
                setTagCategories(data);

                const initialSelection = {};
                Object.entries(data).forEach(([key, config]) => {
                    initialSelection[key] = config.singleSelect ? null : [];
                });
                setSelectedByCategory(initialSelection);
                setAreTagsLoaded(true);
            } catch (error) {
                console.error('Failed to load tags:', error);
                showToast('Failed to load tags', TOAST_TYPES.ERROR);
            }
        };
        loadTags();
    }, []);
    const [customTags, setCustomTags] = useState([]);
    const [customTagInput, setCustomTagInput] = useState('');
    const [showCustomTagInput, setShowCustomTagInput] = useState(false);

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
                notes: connection.notes || ''
            });

            // Only parse if tags are loaded
            if (areTagsLoaded) {
                const existingTags = connection.tags || [];
                // Initialize specific structure based on loaded categories
                const newSelected = {};
                Object.entries(tagCategories).forEach(([key, config]) => {
                    newSelected[key] = config.singleSelect ? null : [];
                });

                const newCustom = [];

                const findCategoryForTag = (tag) => {
                    for (const [key, cat] of Object.entries(tagCategories)) {
                        if (cat.options.includes(tag)) return key;
                    }
                    return null;
                };

                existingTags.forEach(tag => {
                    const categoryKey = findCategoryForTag(tag);
                    if (categoryKey) {
                        const category = tagCategories[categoryKey];
                        if (category.singleSelect) {
                            newSelected[categoryKey] = tag;
                        } else {
                            if (!newSelected[categoryKey].includes(tag)) {
                                newSelected[categoryKey].push(tag);
                            }
                        }
                    } else {
                        if (!newCustom.includes(tag)) {
                            newCustom.push(tag);
                        }
                    }
                });

                setSelectedByCategory(newSelected);
                setCustomTags(newCustom);
            }
        }
    }, [id, connections, areTagsLoaded, tagCategories]);

    if (!formData) return <div>Loading...</div>;

    const toggleCategoryTag = (categoryKey, tag) => {
        const category = tagCategories[categoryKey];
        if (!category) return;

        setSelectedByCategory(prev => {
            const current = prev[categoryKey];

            if (category.singleSelect) {
                return {
                    ...prev,
                    [categoryKey]: current === tag ? null : tag
                };
            } else {
                const currentList = Array.isArray(current) ? current : [];
                const isSelected = currentList.includes(tag);
                return {
                    ...prev,
                    [categoryKey]: isSelected
                        ? currentList.filter(t => t !== tag)
                        : [...currentList, tag]
                };
            }
        });
    };

    const addCustomTag = () => {
        const tag = customTagInput.trim();
        if (tag && !customTags.includes(tag)) {
            setCustomTags(prev => [...prev, tag]);
            setCustomTagInput('');
            setShowCustomTagInput(false);
        }
    };

    const removeCustomTag = (tag) => {
        setCustomTags(prev => prev.filter(t => t !== tag));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Combine all tags
            // Combine all tags
            const allTags = [];
            Object.values(selectedByCategory).forEach(value => {
                if (Array.isArray(value)) allTags.push(...value);
                else if (value) allTags.push(value);
            });
            allTags.push(...customTags);

            await updateConnection(id, {
                ...formData,
                tags: allTags,
                // Ensure howMet is updated if selected via tags, keeping consistency
                howMet: selectedByCategory.howMet || formData.howMet || (allTags.length > 0 ? allTags[0] : '')
            });
            showToast('Connection updated successfully!', TOAST_TYPES.SUCCESS);
            navigate(`/connections/${id}`);
        } catch (err) {
            console.error('Failed to update connection', err);
            showToast('Failed to update connection. Please try again.', TOAST_TYPES.ERROR);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
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
                        {/* We hide the simple 'How met' input since we cover it in tags now, or keep it as backup/legacy? 
                            The user design implies 'How You Met' is a category of tags. 
                            Let's keep this hidden or removed to avoid confusion, or sync it.
                            I'll remove it from UI since it's covered by tags now.
                        */}
                    </div>

                    {/* Multi-Category Tags UI replacing the old simple input */}
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {Object.entries(tagCategories).map(([key, category]) => (
                                <div key={key}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                        {category.label}
                                    </label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        {category.options.map(tag => {
                                            const isSelected = category.singleSelect
                                                ? selectedByCategory[key] === tag
                                                : selectedByCategory[key].includes(tag);

                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleCategoryTag(key, tag)}
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        borderRadius: '2rem',
                                                        border: `1px solid ${isSelected ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                                                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                        color: isSelected ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}

                                        {/* Add custom tag button/input inline with custom category */}
                                        {key === 'custom' && (
                                            <>
                                                {customTags.map(tag => (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => removeCustomTag(tag)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '2rem',
                                                            border: '1px solid var(--color-accent-primary)',
                                                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                            color: 'var(--color-accent-primary)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            fontSize: '0.9rem'
                                                        }}
                                                    >
                                                        {tag} ×
                                                    </button>
                                                ))}

                                                {!showCustomTagInput ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCustomTagInput(true)}
                                                        style={{
                                                            padding: '0.5rem 1rem',
                                                            borderRadius: '2rem',
                                                            border: '1px dashed var(--color-border)',
                                                            backgroundColor: 'transparent',
                                                            color: 'var(--color-text-secondary)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Plus size={14} style={{ marginRight: '4px' }} /> Add Custom
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <input
                                                            type="text"
                                                            autoFocus
                                                            value={customTagInput}
                                                            onChange={e => setCustomTagInput(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                                                            onBlur={addCustomTag}
                                                            placeholder="Tag name"
                                                            style={{
                                                                padding: '0.5rem 1rem',
                                                                borderRadius: '2rem',
                                                                border: '1px solid var(--color-accent-primary)',
                                                                backgroundColor: 'var(--color-bg-primary)',
                                                                color: 'var(--color-text-primary)',
                                                                fontSize: '0.9rem',
                                                                width: '120px'
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
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
