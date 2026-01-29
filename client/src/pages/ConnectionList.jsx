import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Search, MapPin, Briefcase, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const ConnectionList = () => {
    const { connections, isLoading } = useData();

    if (isLoading) {
        return <div style={{ textAlign: 'center', padding: '100px' }}>Loading your network...</div>;
    }
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('table');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedConnections = [...connections].sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';

        // Special handling for array or dates if needed, simple string/date work mostly fine
        if (sortConfig.key === 'lastContact') {
            // Handle 'Never' or empty defaults
            if (!aValue) aValue = '0';
            if (!bValue) bValue = '0';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });


    const filteredConnections = sortedConnections.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.3 }} />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp size={14} style={{ marginLeft: '4px' }} />
            : <ArrowDown size={14} style={{ marginLeft: '4px' }} />;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>My Network</h1>
                <Link to="/connections/new" className="btn btn-primary">
                    + Add New
                </Link>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by name, company, or tag..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            fontSize: '1rem'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-secondary)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setViewMode('table')}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: viewMode === 'table' ? 'var(--color-bg-primary)' : 'transparent',
                            color: viewMode === 'table' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        title="Table View"
                    >
                        <List size={20} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: viewMode === 'grid' ? 'var(--color-bg-primary)' : 'transparent',
                            color: viewMode === 'grid' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        title="Grid View"
                    >
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {filteredConnections.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-secondary)' }}>
                    {searchTerm ? 'No connections match your search.' : 'You haven’t added any connections yet.'}
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {filteredConnections.map(connection => (
                                <Link key={connection.id} to={`/connections/${connection.id}`} style={{ textDecoration: 'none' }}>
                                    <div className="card" style={{ height: '100%', transition: 'transform 0.2s', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-accent-secondary), var(--color-accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                                                {connection.name.charAt(0)}
                                            </div>
                                            {connection.tags?.length > 0 && (
                                                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '1rem' }}>
                                                    {connection.tags?.[0]}
                                                </span>
                                            )}
                                        </div>

                                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem', color: 'var(--color-text-primary)' }}>{connection.name}</h3>
                                        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {connection.role && <span><Briefcase size={14} style={{ display: 'inline', marginRight: '4px' }} />{connection.role}</span>}
                                            {connection.company && <span>@ {connection.company}</span>}
                                        </p>

                                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            Last Contact: <span style={{ color: 'var(--color-text-primary)' }}>{connection.lastContact ? new Date(connection.lastContact).toLocaleDateString() : 'Never'}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                                    <tr>
                                        <th
                                            style={{ padding: '1rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('name')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>Name <SortIcon columnKey="name" /></div>
                                        </th>
                                        <th
                                            style={{ padding: '1rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('role')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>Role <SortIcon columnKey="role" /></div>
                                        </th>
                                        <th
                                            style={{ padding: '1rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('company')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>Company <SortIcon columnKey="company" /></div>
                                        </th>
                                        <th style={{ padding: '1rem', fontWeight: '600' }}>Tags</th>
                                        <th
                                            style={{ padding: '1rem', fontWeight: '600', cursor: 'pointer', userSelect: 'none' }}
                                            onClick={() => handleSort('lastContact')}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center' }}>Last Contact <SortIcon columnKey="lastContact" /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredConnections.map(connection => (
                                        <tr key={connection.id} style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => window.location.href = `/connections/${connection.id}`}>
                                            <td style={{ padding: '1rem' }}>
                                                <Link to={`/connections/${connection.id}`} style={{ fontWeight: '600', color: 'var(--color-text-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold', color: '#fff', marginRight: '12px' }}>
                                                        {connection.name.charAt(0)}
                                                    </div>
                                                    {connection.name}
                                                </Link>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                                                {connection.role}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                                                {connection.company}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    {connection.tags?.slice(0, 2).map((tag, i) => (
                                                        <span key={i} style={{ fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {connection.tags?.length > 2 && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>+{connection.tags.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                                                {connection.lastContact ? new Date(connection.lastContact).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ConnectionList;
