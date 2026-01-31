import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Network, Lock, Phone } from 'lucide-react';

const Login = () => {
    const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
    const [isLogin, setIsLogin] = useState(true);

    // Email State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Phone State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isCodeSent, setIsCodeSent] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const { loginWithGoogle, loginWithEmail, registerWithEmail, setupRecaptcha, loginWithPhone, user } = useAuth();

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setMessage('');
        try {
            await loginWithGoogle();
        } catch (err) {
            console.error("Google login error:", err);
            setMessage('Google login failed: ' + err.message);
            setIsLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            if (isLogin) {
                await loginWithEmail(email, password);
            } else {
                await registerWithEmail(email, password);
            }
        } catch (err) {
            console.error("Auth error:", err);
            setMessage((isLogin ? 'Login' : 'Registration') + ' failed: ' + err.message);
            setIsLoading(false);
        }
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        if (!phoneNumber) {
            setMessage("Please enter a valid phone number");
            setIsLoading(false);
            return;
        }

        try {
            setupRecaptcha('recaptcha-container');
            const confirmation = await loginWithPhone(phoneNumber);
            setConfirmationResult(confirmation);
            setIsCodeSent(true);
            setMessage('Verification code sent!');
        } catch (error) {
            console.error("Phone Auth Error:", error);
            setMessage('Failed to send code: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            await confirmationResult.confirm(verificationCode);
            // User will be set by onAuthStateChanged in AuthContext, triggering redirect
        } catch (error) {
            console.error("Verification Error:", error);
            setMessage('Invalid code. Please try again.');
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
                    <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.5rem' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p style={{ color: '#666', marginBottom: '2rem' }}>
                        {isLogin ? 'Sign in to mitigate professional chaos.' : 'Start organizing your professional life.'}
                    </p>

                    {/* Auth Method Toggles */}
                    <div style={{ display: 'flex', marginBottom: '2rem', padding: '4px', background: '#f3f4f6', borderRadius: '12px' }}>
                        <button
                            onClick={() => { setAuthMethod('email'); setIsCodeSent(false); setMessage(''); }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '10px',
                                border: 'none',
                                background: authMethod === 'email' ? 'white' : 'transparent',
                                color: authMethod === 'email' ? '#4f46e5' : '#6b7280',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: authMethod === 'email' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Email
                        </button>
                        <button
                            onClick={() => { setAuthMethod('phone'); setIsCodeSent(false); setMessage(''); }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '10px',
                                border: 'none',
                                background: authMethod === 'phone' ? 'white' : 'transparent',
                                color: authMethod === 'phone' ? '#4f46e5' : '#6b7280',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: authMethod === 'phone' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        >
                            Phone
                        </button>
                    </div>

                    {authMethod === 'email' ? (
                        <>
                            <button
                                onClick={handleGoogleLogin}
                                type="button"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    color: '#333',
                                    background: '#fff',
                                    border: '1px solid #ddd',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    marginBottom: '1.5rem',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                                <span style={{ padding: '0 0.75rem', color: '#9ca3af', fontSize: '0.875rem' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                            </div>

                            <form onSubmit={handleEmailAuth}>
                                <div style={{ marginBottom: '1rem', position: 'relative' }}>
                                    <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '12px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {message && (
                                    <div style={{ marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
                                        {message}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: 'white',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        cursor: isLoading ? 'wait' : 'pointer',
                                        transition: 'all 0.3s',
                                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                                    }}
                                >
                                    {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                                </button>
                            </form>
                            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', fontWeight: '500' }}
                                >
                                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
                                Enter your phone number with country code (e.g. +1 555 123 4567)
                            </p>
                            {!isCodeSent ? (
                                <form onSubmit={handleSendCode}>
                                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                        <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input
                                            type="tel"
                                            placeholder="+1 555 555 5555"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem 0.75rem 2.8rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                outline: 'none',
                                                fontSize: '16px' // Prevent zoom on mobile
                                            }}
                                        />
                                    </div>
                                    <div id="recaptcha-container"></div>
                                    {message && (
                                        <div style={{ marginBottom: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
                                            {message}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isLoading || !phoneNumber}
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: 'white',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: (isLoading || !phoneNumber) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            opacity: (isLoading || !phoneNumber) ? 0.7 : 1
                                        }}
                                    >
                                        {isLoading ? 'Sending...' : 'Send Verification Code'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyCode}>
                                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem 1rem 0.75rem 2.8rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '12px',
                                                outline: 'none',
                                                letterSpacing: '2px',
                                                fontSize: '16px'
                                            }}
                                        />
                                    </div>
                                    {message && (
                                        <div style={{ marginBottom: '1rem', color: message.includes('sent') ? '#10b981' : '#dc2626', fontSize: '0.875rem' }}>
                                            {message}
                                        </div>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={isLoading || !verificationCode}
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem',
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: 'white',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                            borderRadius: '12px',
                                            cursor: (isLoading || !verificationCode) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                            opacity: (isLoading || !verificationCode) ? 0.7 : 1
                                        }}
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                                    </button>
                                    <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsCodeSent(false)}
                                            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem' }}
                                        >
                                            Change Phone Number
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
