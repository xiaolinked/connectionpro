import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Network, Zap, Users } from 'lucide-react';

const Register = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [magicLink, setMagicLink] = useState('');
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setMagicLink('');

        try {
            const name = email.split('@')[0];
            const response = await api.register(name, email);
            setMessage('Success! Click the link below to sign in:');
            setMagicLink(response.magic_link);
            console.log('MAGIC LINK:', response.magic_link);
        } catch (err) {
            console.error('Registration error:', err);
            const errorMsg = err.message || 'Unable to send magic link. Please check if server is running.';
            setMessage('Error: ' + errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 6s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-30%',
                left: '-5%',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 8s ease-in-out infinite reverse'
            }} />

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .feature-card:hover {
                    transform: translateY(-5px);
                }
            `}</style>

            <div style={{
                maxWidth: '480px',
                width: '100%',
                margin: '0 1rem',
                animation: 'slideUp 0.6s ease-out'
            }}>
                {/* Logo and Title */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)'
                    }}>
                        <Network size={32} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: '#1f2937',
                        marginBottom: '0.5rem',
                        letterSpacing: '-0.5px'
                    }}>
                        Kithly
                    </h1>
                    <p style={{
                        color: '#6b7280',
                        fontSize: '1.125rem'
                    }}>
                        Your professional network, supercharged
                    </p>
                </div>

                {/* Main Card */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '2.5rem',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.3)'
                }}>
                    <h2 style={{
                        fontSize: '1.75rem',
                        fontWeight: '700',
                        color: '#1a1a1a',
                        marginBottom: '0.5rem'
                    }}>
                        Welcome back
                    </h2>
                    <p style={{
                        color: '#666',
                        marginBottom: '2rem'
                    }}>
                        Sign in with your email to continue
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '2rem', position: 'relative' }}>
                            <Mail
                                size={20}
                                style={{
                                    position: 'absolute',
                                    left: '1rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#9ca3af',
                                    zIndex: 1
                                }}
                            />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem 0.875rem 3rem',
                                    fontSize: '1rem',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    background: 'white'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#667eea';
                                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#e5e7eb';
                                    e.target.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '1rem',
                                fontWeight: '600',
                                color: 'white',
                                background: isLoading
                                    ? '#9ca3af'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: isLoading ? 'none' : '0 4px 20px rgba(102, 126, 234, 0.4)',
                                transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.target.style.transform = 'translateY(-2px)';
                                    e.target.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
                            }}
                        >
                            {isLoading ? 'Sending...' : 'Continue'}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>

                        {message && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1.25rem',
                                background: message.includes('Error')
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '12px',
                                color: message.includes('Error') ? '#dc2626' : '#059669',
                                fontSize: '0.875rem',
                                border: `1px solid ${message.includes('Error') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                            }}>
                                <div style={{ fontWeight: '600', marginBottom: magicLink ? '0.75rem' : '0' }}>
                                    {message}
                                </div>
                                {magicLink && (
                                    <a
                                        href={magicLink}
                                        style={{
                                            display: 'inline-block',
                                            padding: '0.75rem 1.5rem',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: '600',
                                            fontSize: '0.875rem',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-1px)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                                        }}
                                    >
                                        🔗 Click here to sign in
                                    </a>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Feature Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1rem',
                    marginTop: '2rem'
                }}>
                    {[
                        { icon: Users, label: 'Smart Reminders' },
                        { icon: Zap, label: 'Quick Capture' },
                        { icon: Network, label: 'Rich Insights' }
                    ].map((feature, i) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={i}
                                className="feature-card"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '16px',
                                    padding: '1.25rem 1rem',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Icon size={24} color="white" style={{ marginBottom: '0.5rem' }} />
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'rgba(255,255,255,0.95)',
                                    fontWeight: '500'
                                }}>
                                    {feature.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Register;
