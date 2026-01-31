import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../services/api';

const Onboarding = () => {
    const { user, updateUser } = useAuth();
    const { addConnection, addLog } = useData();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [name, setName] = useState(user?.name || '');
    const [connectionName, setConnectionName] = useState('');
    const [interactionType, setInteractionType] = useState('Coffee Chat');
    const [notes, setNotes] = useState('');

    const handleStep1 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await updateUser({ name });
            setStep(2);
        } catch (error) {
            console.error("Failed to update name:", error);
            // Handle error (maybe toast)
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2 = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // 1. Create Connection via Context (updates global state)
            const connection = await addConnection({
                name: connectionName,
                howMet: "Initial Onboarding",
                frequency: 30, // Default frequency
                tags: ["New Connection"]
            });

            // 2. Log First Interaction via Context
            if (notes) {
                await addLog({
                    connection_id: connection.id,
                    type: interactionType,
                    notes: notes,
                    tags: ["Onboarding"]
                });
            }

            // 3. Mark Onboarding Complete
            await updateUser({ is_onboarded: true });

            navigate('/');
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
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
            background: 'var(--bg-main)',
            padding: '20px'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                padding: '40px',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <h1 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>
                    {step === 1 ? 'Welcome to ConnectionPro!' : 'Let\'s Get Started'}
                </h1>
                <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>
                    {step === 1
                        ? 'First, let\'s make sure we have your name right.'
                        : 'Add your first professional connection to start tracking.'}
                </p>

                {step === 1 ? (
                    <form onSubmit={handleStep1}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--color-accent-primary)',
                                color: '#000',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isLoading ? 'wait' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Saving...' : 'Next'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleStep2}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                Connection Name
                            </label>
                            <input
                                type="text"
                                value={connectionName}
                                onChange={(e) => setConnectionName(e.target.value)}
                                placeholder="e.g. Jane Doe"
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                Recent Interaction (Optional)
                            </label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {['Coffee Chat', 'Meeting', 'Call', 'Email'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setInteractionType(type)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: `1px solid ${interactionType === type ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                                            background: interactionType === type ? 'var(--color-accent-primary)' : 'var(--color-bg-secondary)',
                                            color: interactionType === type ? '#000' : 'var(--color-text-primary)',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            fontWeight: interactionType === type ? '600' : '500'
                                        }}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="What did you talk about?"
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-input)',
                                    color: 'var(--text-primary)',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--color-accent-primary)',
                                color: '#000',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: isLoading ? 'wait' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Finishing...' : 'Complete Setup'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
