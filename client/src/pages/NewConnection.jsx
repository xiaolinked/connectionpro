import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Link as LinkIcon, Briefcase, Clock, Info, Plus, Mail, Target } from 'lucide-react';

const NewConnection = () => {
    const navigate = useNavigate();
    const { addConnection } = useData();
    const [searchParams] = useSearchParams();

    // 4.1 Identity Section (Required)
    const [name, setName] = useState('');

    // 4.2 Quick Context Tags
    const [selectedTags, setSelectedTags] = useState([]);
    const defaultTags = ['Work', 'Friend', 'Mentor', 'Peer', 'School', 'Hobby', 'Family'];
    const [customTagInput, setCustomTagInput] = useState('');
    const [showCustomTagInput, setShowCustomTagInput] = useState(false);

    // 4.3 Smart Import
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [isEnriching, setIsEnriching] = useState(false);

    // 5. Expanded Sections
    const [company, setCompany] = useState('');
    const [role, setRole] = useState('');
    const [industry, setIndustry] = useState('');
    const [city, setCity] = useState('');
    const [isCityLoading, setIsCityLoading] = useState(false);
    const [isCityOpen, setIsCityOpen] = useState(false);
    const [cityActiveIndex, setCityActiveIndex] = useState(-1);
    const cityDataRef = useRef(null);
    const [notes, setNotes] = useState('');
    const [email, setEmail] = useState('');
    const [goals, setGoals] = useState('');
    const [cadence, setCadence] = useState('monthly');
    const [customFrequency, setCustomFrequency] = useState(90);

    // Prefill from URL params (for Chrome extension)
    useEffect(() => {
        const paramName = searchParams.get('name');
        const paramRole = searchParams.get('role');
        const paramCompany = searchParams.get('company');
        const paramLocation = searchParams.get('location');
        const paramLinkedin = searchParams.get('linkedin');

        if (paramName) setName(paramName);
        if (paramRole) setRole(paramRole);
        if (paramCompany) setCompany(paramCompany);
        if (paramLocation) setCity(paramLocation);
        if (paramLinkedin) setLinkedinUrl(paramLinkedin);
    }, [searchParams]);

    const ensureCityDataLoaded = async () => {
        if (cityDataRef.current) return;
        setIsCityLoading(true);
        try {
            const mod = await import('world-cities-json');
            // Handle CJS/ESM interop across dev/build.
            // Possible shapes:
            // - { cities: [...] }
            // - { default: { cities: [...] } }
            // - { default: [...] }
            const cities =
                mod?.cities ||
                mod?.default?.cities ||
                (Array.isArray(mod?.default) ? mod.default : null) ||
                [];
            cityDataRef.current = cities;
        } catch (e) {
            console.error('Failed to load city dataset', e);
            cityDataRef.current = [];
        } finally {
            setIsCityLoading(false);
        }
    };

    const cityMatches = useMemo(() => {
        const q = city.trim().toLowerCase();
        const cities = cityDataRef.current;
        if (!isCityOpen || !q || !Array.isArray(cities) || cities.length === 0) return [];

        const starts = [];
        const contains = [];
        for (const c of cities) {
            const name = (c.city_ascii || c.city || '').toLowerCase();
            if (!name) continue;
            if (name.startsWith(q)) starts.push(c);
            else if (name.includes(q)) contains.push(c);
        }

        const sortByPopDesc = (a, b) => (Number(b.population || 0) - Number(a.population || 0));
        starts.sort(sortByPopDesc);
        contains.sort(sortByPopDesc);

        return [...starts, ...contains].slice(0, 12);
    }, [city, isCityOpen]);

    const selectCity = (cityObj) => {
        const value = cityObj?.city_ascii || cityObj?.city || '';
        setCity(value);
        setIsCityOpen(false);
        setCityActiveIndex(-1);
    };

    const handleEnrich = async () => {
        if (!linkedinUrl) return;
        setIsEnriching(true);

        try {
            const data = await api.enrichLinkedin(linkedinUrl);

            if (data.name && !name) setName(data.name);
            if (data.company) setCompany(data.company);
            if (data.role) setRole(data.role);
            if (data.location) {
                const parts = data.location.split('(');
                setCity(parts[0].trim());
            }
            if (data.industry) setIndustry(data.industry);
        } catch (e) {
            console.error("Enrichment failed", e);
        } finally {
            setIsEnriching(false);
        }
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const addCustomTag = () => {
        if (customTagInput.trim()) {
            toggleTag(customTagInput.trim());
            setCustomTagInput('');
            setShowCustomTagInput(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Calculate frequency in days
        let frequencyDays = 0;
        if (cadence === 'monthly') frequencyDays = 30;
        else if (cadence === 'quarterly') frequencyDays = 90;
        else if (cadence === 'custom') frequencyDays = parseInt(customFrequency) || 90;
        else if (cadence === 'none') frequencyDays = 0;

        const handleProcess = async () => {
            try {
                const conn = await addConnection({
                    name,
                    tags: selectedTags,
                    linkedin: linkedinUrl,
                    company,
                    role,
                    industry,
                    location: city || '',
                    email,
                    goals,
                    notes,
                    frequency: frequencyDays,
                    howMet: selectedTags.length > 0 ? selectedTags[0] : 'Quick Add',
                    lastContact: null
                });

                if (conn && conn.id) {
                    navigate(`/connections/${conn.id}`);
                } else {
                    navigate('/connections');
                }
            } catch (err) {
                console.error("Failed to add connection", err);
            }
        };

        handleProcess();
    };

    return (
        <div style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Add Connection</h1>
            </div>

            <form onSubmit={handleSubmit}>
                {/* 4.1 Identity Section */}
                <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                            FULL NAME <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sarah Connor"
                            style={{
                                width: '100%',
                                fontSize: '1.5rem',
                                padding: '0.75rem',
                                border: 'none',
                                borderBottom: '2px solid var(--color-border)',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* 4.2 Quick Context Tags */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                            How do you know this person?
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {defaultTags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '2rem',
                                        border: `1px solid ${selectedTags.includes(tag) ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                                        backgroundColor: selectedTags.includes(tag) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        color: selectedTags.includes(tag) ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {tag}
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
                                    <Plus size={14} style={{ marginRight: '4px' }} /> Custom
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
                        </div>
                    </div>

                    {/* 4.3 Smart Import, Contact & City */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                LinkedIn URL (Optional)
                            </label>
                            <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <LinkIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                    <input
                                        type="url"
                                        value={linkedinUrl}
                                        onChange={(e) => setLinkedinUrl(e.target.value)}
                                        placeholder="linkedin.com/in/..."
                                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                    />
                                </div>
                                <button type="button" onClick={handleEnrich} disabled={isEnriching || !linkedinUrl} className="btn" style={{ padding: '0.5rem', minWidth: '40px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-accent-primary)', opacity: (!linkedinUrl) ? 0.5 : 1 }}>
                                    {isEnriching ? <Clock size={16} className="spin" /> : <Briefcase size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                Email Address (Optional)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>
                            City (Optional)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => {
                                    setCity(e.target.value);
                                    setIsCityOpen(true);
                                    setCityActiveIndex(-1);
                                }}
                                onFocus={() => {
                                    setIsCityOpen(true);
                                    ensureCityDataLoaded();
                                }}
                                onBlur={() => {
                                    // Delay close so clicks on options register.
                                    window.setTimeout(() => setIsCityOpen(false), 120);
                                }}
                                onKeyDown={(e) => {
                                    if (!isCityOpen) return;
                                    if (e.key === 'Escape') {
                                        setIsCityOpen(false);
                                        setCityActiveIndex(-1);
                                        return;
                                    }
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setCityActiveIndex((i) => Math.min(i + 1, cityMatches.length - 1));
                                        return;
                                    }
                                    if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setCityActiveIndex((i) => Math.max(i - 1, 0));
                                        return;
                                    }
                                    if (e.key === 'Enter' && cityActiveIndex >= 0 && cityMatches[cityActiveIndex]) {
                                        e.preventDefault();
                                        selectCity(cityMatches[cityActiveIndex]);
                                    }
                                }}
                                placeholder="Start typing a city (offline)…"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--color-border)',
                                    backgroundColor: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-primary)'
                                }}
                            />

                            {isCityOpen && (isCityLoading || cityMatches.length > 0) && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 6px)',
                                        left: 0,
                                        right: 0,
                                        backgroundColor: 'var(--color-bg-primary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        zIndex: 20,
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                                        maxHeight: '240px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {isCityLoading ? (
                                        <div style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                                            Loading city list…
                                        </div>
                                    ) : (
                                        cityMatches.map((c, idx) => {
                                            const labelCity = c.city_ascii || c.city;
                                            const labelMeta = [c.admin_name, c.country].filter(Boolean).join(', ');
                                            const isActive = idx === cityActiveIndex;
                                            return (
                                                <button
                                                    key={c.id || `${labelCity}-${labelMeta}-${idx}`}
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        // prevent blur before click
                                                        e.preventDefault();
                                                    }}
                                                    onClick={() => selectCity(c)}
                                                    style={{
                                                        width: '100%',
                                                        textAlign: 'left',
                                                        padding: '0.65rem 0.75rem',
                                                        background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        color: 'var(--color-text-primary)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        gap: '1rem'
                                                    }}
                                                >
                                                    <span style={{ fontWeight: 600 }}>{labelCity}</span>
                                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                        {labelMeta}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4.4 Details (Always Visible) */}
                <div style={{ marginBottom: '6rem', marginTop: '1.5rem', display: 'grid', gap: '2rem' }}>
                    {/* 5.1 Professional */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <Briefcase size={18} style={{ marginRight: '8px' }} /> Professional
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Company"
                                value={company}
                                onChange={e => setCompany(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                            <input
                                type="text"
                                placeholder="Role"
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                            />
                            <input
                                type="text"
                                placeholder="Industry"
                                value={industry}
                                onChange={e => setIndustry(e.target.value)}
                                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', gridColumn: '1 / -1' }}
                            />
                        </div>
                    </div>

                    {/* 5.3 Personal Notes \u0026 Goals */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'transparent', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                                <Info size={18} style={{ marginRight: '8px' }} /> Personal Notes
                            </h3>
                            <textarea
                                rows={4}
                                placeholder="Anything you\u2019d want to remember later."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                            />
                        </div>
                        <div className="card" style={{ padding: '1.5rem', backgroundColor: 'transparent', border: '1px solid var(--color-border)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                                <Target size={18} style={{ marginRight: '8px' }} /> Goals
                            </h3>
                            <textarea
                                rows={4}
                                placeholder="What do you want to achieve with this connection?"
                                value={goals}
                                onChange={e => setGoals(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* 5.4 Connection Cadence */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <Clock size={18} style={{ marginRight: '8px' }} /> Connection Cadence
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            {[
                                { id: 'none', label: 'No reminder' },
                                { id: 'monthly', label: 'Monthly' },
                                { id: 'quarterly', label: 'Quarterly' },
                                { id: 'custom', label: 'Custom' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setCadence(opt.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '0.5rem',
                                        border: `1px solid ${cadence === opt.id ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                                        backgroundColor: cadence === opt.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        color: cadence === opt.id ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        {cadence === 'custom' && (
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Remind me every</span>
                                <input
                                    type="number"
                                    value={customFrequency}
                                    onChange={e => setCustomFrequency(e.target.value)}
                                    style={{ width: '80px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                />
                                <span style={{ color: 'var(--color-text-secondary)' }}>days</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Footer Actions (Sticky) */}
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--color-bg-secondary)', // Slightly distinct bg
                    borderTop: '1px solid var(--color-border)',
                    padding: '1rem 2rem',
                    display: 'flex',
                    justifyContent: 'flex-end', // Aligns items to the right? No, "Centered single-column" implies maybe centered content but actions usually right or split.
                    // User says "Main form content... Sticky footer with primary actions".
                    // Let's constrain footer width to match max-width or just be full width bar. Full width bar is better for sticky.
                    zIndex: 10
                }}>
                    <div style={{ maxWidth: '720px', width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            style={{
                                padding: '0.75rem 1.5rem',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--color-text-secondary)',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="btn btn-primary"
                            style={{
                                padding: '0.75rem 2rem',
                                borderRadius: 'var(--radius-md)',
                                opacity: !name.trim() ? 0.5 : 1,
                                cursor: !name.trim() ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Save Connection
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default NewConnection;
