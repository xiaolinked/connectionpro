import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, User, Shield, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const Settings = () => {
    const { user, logout, updateUser } = useAuth();

    const [name, setName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Delete account state
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const hasChanges = name !== (user?.name || '');
    const canDelete = deleteConfirmation === 'DELETE';

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

    const handleDeleteAccount = async () => {
        if (!canDelete) return;

        setIsDeleting(true);
        setDeleteError('');

        try {
            await api.deleteMe();
            // After successful deletion, log the user out
            logout();
        } catch (err) {
            setDeleteError(err.message || 'Failed to delete account. Please try again.');
            setIsDeleting(false);
        }
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

            {/* Danger Zone - Delete Account */}
            <div className="card" style={{
                border: '1px solid rgba(220, 38, 38, 0.4)',
                backgroundColor: 'rgba(220, 38, 38, 0.05)'
            }}>
                <h2 style={{
                    fontSize: '1.25rem',
                    marginBottom: '1rem',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <AlertTriangle size={20} style={{ marginRight: '10px' }} />
                    Danger Zone
                </h2>
                <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                </p>

                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(220, 38, 38, 0.2)',
                    marginBottom: '1.5rem'
                }}>
                    <p style={{
                        color: '#dc2626',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        marginBottom: '0.5rem'
                    }}>
                        ⚠️ Warning: This will permanently delete:
                    </p>
                    <ul style={{
                        color: '#dc2626',
                        fontSize: '0.85rem',
                        marginLeft: '1.5rem',
                        listStyleType: 'disc'
                    }}>
                        <li>Your profile information</li>
                        <li>All your connections</li>
                        <li>All interaction logs and notes</li>
                    </ul>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>

                    <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => { setDeleteConfirmation(e.target.value); setDeleteError(''); }}
                        placeholder="Type DELETE to confirm"
                        style={{
                            padding: '0.75rem',
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderRadius: '8px',
                            border: canDelete ? '2px solid #dc2626' : '1px solid var(--color-border)',
                            color: 'inherit',
                            width: '100%',
                            fontSize: 'inherit',
                            maxWidth: '300px'
                        }}
                    />
                </div>

                {deleteError && (
                    <div style={{
                        marginBottom: '1rem',
                        padding: '0.75rem',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        borderRadius: '8px',
                        color: '#dc2626',
                        fontSize: '0.875rem'
                    }}>
                        {deleteError}
                    </div>
                )}

                <button
                    onClick={handleDeleteAccount}
                    disabled={!canDelete || isDeleting}
                    className="btn"
                    style={{
                        backgroundColor: canDelete ? '#dc2626' : '#6b7280',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'fit-content',
                        opacity: (!canDelete || isDeleting) ? 0.6 : 1,
                        cursor: (!canDelete || isDeleting) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Trash2 size={18} style={{ marginRight: '8px' }} />
                    {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
