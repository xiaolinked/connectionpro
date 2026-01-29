import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield, Save } from 'lucide-react';

const Settings = () => {
    const { user, logout, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    const hasChanges = name !== (user?.name || '');

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            await updateUser({ name });
            setSaveMessage('Profile updated successfully.');
        } catch {
            setSaveMessage('Failed to update profile.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Settings</h1>

            {/* Profile Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <User size={20} style={{ marginRight: '10px' }} />
                    Profile Information
                </h2>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="form-group">
                        <label htmlFor="settings-name">Full Name</label>
                        <input
                            id="settings-name"
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaveMessage(''); }}
                            style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'inherit', width: '100%', fontSize: 'inherit' }}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email Address</label>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            {user?.email || 'Loading...'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="btn btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 'fit-content',
                                opacity: (!hasChanges || isSaving) ? 0.5 : 1,
                            }}
                        >
                            <Save size={18} style={{ marginRight: '8px' }} />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                        {saveMessage && (
                            <span style={{ fontSize: '0.875rem', color: saveMessage.includes('success') ? '#10b981' : '#dc2626' }}>
                                {saveMessage}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Security Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                    <Shield size={20} style={{ marginRight: '10px' }} />
                    Account security
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    You are logged in via a secure magic link. No password is required for your account.
                </p>
                <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontSize: '0.85rem' }}>
                    Active Session: Your session is valid for 7 days from your last login.
                </div>
            </div>

            {/* Actions Section */}
            <div className="card" style={{ border: '1px solid #fee2e2', backgroundColor: 'rgba(254, 226, 226, 0.2)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#dc2626' }}>Account Actions</h2>
                <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Logout of your account to clear your session on this device.
                </p>
                <button
                    onClick={handleLogout}
                    className="btn"
                    style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'fit-content'
                    }}
                >
                    <LogOut size={18} style={{ marginRight: '8px' }} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Settings;
