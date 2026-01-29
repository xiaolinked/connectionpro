import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, UserPlus, Settings, LogOut, Calendar, Network } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Home },
        { path: '/follow-ups', label: 'Follow-ups', icon: Calendar },
        { path: '/connections', label: 'Network', icon: Users },
        { path: '/connections/new', label: 'Add Connection', icon: UserPlus },
        { path: '/settings', label: 'Settings', icon: Settings }
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRight: '1px solid var(--color-border)',
                padding: '2rem 0',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Network size={18} color="white" />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Kithly</span>
                </div>

                <nav style={{ flex: '1', padding: '0 1rem' }}>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.25rem',
                                    borderRadius: 'var(--radius-md)',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
                                    backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                    fontWeight: isActive ? '600' : '400',
                                    transition: 'all 0.2s'
                                })}
                                onMouseEnter={(e) => {
                                    if (!e.currentTarget.classList.contains('active')) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!e.currentTarget.classList.contains('active')) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                <Icon size={20} style={{ marginRight: '0.75rem' }} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div style={{ padding: '0 1rem', marginTop: 'auto' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '0.75rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-bg-primary)';
                            e.currentTarget.style.color = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                        }}
                    >
                        <LogOut size={20} style={{ marginRight: '0.75rem' }} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
