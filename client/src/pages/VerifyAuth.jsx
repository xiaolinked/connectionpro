import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

const VerifyAuth = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const hasVerified = useRef(false);

    useEffect(() => {
        const verifyToken = async () => {
            // Prevent multiple verification attempts
            if (hasVerified.current) return;
            hasVerified.current = true;

            const token = searchParams.get('token');
            if (!token) {
                setError('No token provided');
                setStatus('error');
                return;
            }

            try {
                const data = await api.verifyMagicLink(token);
                login(data.access_token, data.user);
                setStatus('success');
                // Brief delay to show success state before redirecting
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 1000);
            } catch (err) {
                console.error("Verification failed", err);
                setError(err.message || 'Verification failed');
                setStatus('error');
            }
        };

        verifyToken();
    }, []);

    return (
        <div style={{ maxWidth: '400px', margin: '150px auto', textAlign: 'center' }} className="card">
            {status === 'verifying' && (
                <>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1.5rem' }} />
                    <h1 style={{ fontSize: '1.25rem' }}>Verifying your magic link...</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>One moment while we log you in.</p>
                </>
            )}

            {status === 'success' && (
                <>
                    <div style={{ color: '#10b981', fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
                    <h1 style={{ fontSize: '1.25rem' }}>Authenticated Successfully!</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>Redirecting to dashboard...</p>
                </>
            )}

            {status === 'error' && (
                <>
                    <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1.5rem' }} />
                    <h1 style={{ fontSize: '1.25rem' }}>Authentication Failed</h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>{error}</p>
                    <button
                        onClick={() => navigate('/register')}
                        className="btn btn-primary"
                        style={{ marginTop: '1.5rem', marginInline: 'auto' }}
                    >
                        Return to Login
                    </button>
                </>
            )}
        </div>
    );
};

export default VerifyAuth;
