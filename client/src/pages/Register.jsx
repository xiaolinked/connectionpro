import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, Network, Zap, Users, User } from 'lucide-react';

const Register = () => {
    // Step: 'email' | 'name' | 'sent'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [magicLink, setMagicLink] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setMagicLink('');

        try {
            // Check if email already exists
            const result = await api.checkEmail(email);

            if (result.exists) {
                // Existing user - send magic link directly (don't pass name to avoid overwriting)
                setIsNewUser(false);
                const response = await api.sendLoginLink(email);
                setMessage('Welcome back! Click the link below to sign in:');
                setMagicLink(response.magic_link);
                console.log('MAGIC LINK:', response.magic_link);
                setStep('sent');
            } else {
                // New user - ask for name
                setIsNewUser(true);
                setStep('name');
            }
        } catch (err) {
            console.error('Email check error:', err);
            const errorMsg = err.message || 'Unable to continue. Please check if server is running.';
            setMessage('Error: ' + errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNameSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const response = await api.register(fullName.trim(), email);
            setMessage('Account created! Click the link below to sign in:');
            setMagicLink(response.magic_link);
            console.log('MAGIC LINK:', response.magic_link);
            setStep('sent');
        } catch (err) {
            console.error('Registration error:', err);
            const errorMsg = err.message || 'Unable to create account. Please try again.';
            setMessage('Error: ' + errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setStep('email');
        setMessage('');
        setMagicLink('');
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
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.9) 100%)',
                        borderRadius: '16px',
                        margin: '0 auto 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        <Network size={32} color="#667eea" />
                    </div>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '0.5rem',
                        textShadow: '0 2px 20px rgba(0,0,0,0.2)'
                    }}>
                        ConnectionPro
                    </h1>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: '400'
                    }}>
                        Build meaningful professional relationships
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
                    {step === 'email' && (
                        <>
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: '#1a1a1a',
                                marginBottom: '0.5rem'
                            }}>
                                Welcome
                            </h2>
                            <p style={{
                                color: '#666',
                                marginBottom: '2rem'
                            }}>
                                Enter your email to sign in or create an account
                            </p>

                            <form onSubmit={handleEmailSubmit}>
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
                                    {isLoading ? 'Checking...' : 'Continue'}
                                    {!isLoading && <ArrowRight size={20} />}
                                </button>
                            </form>
                        </>
                    )}

                    {step === 'name' && (
                        <>
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: '#1a1a1a',
                                marginBottom: '0.5rem'
                            }}>
                                Create your account
                            </h2>
                            <p style={{
                                color: '#666',
                                marginBottom: '0.5rem'
                            }}>
                                Welcome! Let's get you set up.
                            </p>
                            <p style={{
                                color: '#9ca3af',
                                fontSize: '0.875rem',
                                marginBottom: '2rem'
                            }}>
                                {email}
                            </p>

                            <form onSubmit={handleNameSubmit}>
                                <div style={{ marginBottom: '2rem', position: 'relative' }}>
                                    <User
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
                                        type="text"
                                        placeholder="Full Name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                        autoFocus
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

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        style={{
                                            padding: '1rem',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: '#666',
                                            background: '#f3f4f6',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        style={{
                                            flex: 1,
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
                                            boxShadow: isLoading ? 'none' : '0 4px 20px rgba(102, 126, 234, 0.4)'
                                        }}
                                    >
                                        {isLoading ? 'Creating...' : 'Create Account'}
                                        {!isLoading && <ArrowRight size={20} />}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {step === 'sent' && (
                        <>
                            <h2 style={{
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: '#1a1a1a',
                                marginBottom: '0.5rem'
                            }}>
                                Check your email
                            </h2>
                            <p style={{
                                color: '#666',
                                marginBottom: '2rem'
                            }}>
                                We sent a magic link to <strong>{email}</strong>
                            </p>

                            {message && (
                                <div style={{
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

                            <button
                                onClick={handleBack}
                                style={{
                                    marginTop: '1.5rem',
                                    padding: '0.75rem 1rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                    color: '#666',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ← Use a different email
                            </button>
                        </>
                    )}

                    {/* Error message for email step */}
                    {step === 'email' && message && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.25rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {message}
                        </div>
                    )}

                    {/* Error message for name step */}
                    {step === 'name' && message && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1.25rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                        }}>
                            {message}
                        </div>
                    )}
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
