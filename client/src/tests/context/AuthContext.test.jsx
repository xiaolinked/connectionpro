import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';

// We need to mock localStorage properly before AuthProvider reads it
let mockStore = {};
const mockLocalStorage = {
    getItem: vi.fn((key) => mockStore[key] ?? null),
    setItem: vi.fn((key, value) => { mockStore[key] = String(value); }),
    removeItem: vi.fn((key) => { delete mockStore[key]; }),
    clear: vi.fn(() => { mockStore = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, writable: true });

// Mock the api module
vi.mock('../../services/api', () => ({
    api: {
        setToken: vi.fn(),
        getMe: vi.fn(),
    },
}));

import { api } from '../../services/api';
import { AuthProvider, useAuth } from '../../context/AuthContext';

// Test component that exposes auth context values
function AuthConsumer() {
    const { user, token, isLoading, isAuthenticated, login, logout } = useAuth();
    return (
        <div>
            <span data-testid="loading">{String(isLoading)}</span>
            <span data-testid="authenticated">{String(isAuthenticated)}</span>
            <span data-testid="user">{user ? user.name : 'none'}</span>
            <span data-testid="token">{token || 'none'}</span>
            <button data-testid="login-btn" onClick={() => login('new-token', { name: 'Test User' })}>
                Login
            </button>
            <button data-testid="logout-btn" onClick={logout}>
                Logout
            </button>
        </div>
    );
}

function renderWithAuth() {
    return render(
        <AuthProvider>
            <AuthConsumer />
        </AuthProvider>
    );
}

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = {};
        // Re-setup getItem after clearAllMocks
        mockLocalStorage.getItem.mockImplementation((key) => mockStore[key] ?? null);
        mockLocalStorage.setItem.mockImplementation((key, value) => { mockStore[key] = String(value); });
        mockLocalStorage.removeItem.mockImplementation((key) => { delete mockStore[key]; });
    });

    it('starts not authenticated when no token stored', async () => {
        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('none');
    });

    it('loads user from stored token', async () => {
        mockStore['cp_token'] = 'stored-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'Stored User', email: 'a@b.com' });

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('user').textContent).toBe('Stored User');
        });
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(api.setToken).toHaveBeenCalledWith('stored-token');
    });

    it('login stores token and sets user', async () => {
        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        // login() also triggers the useEffect because token changes, so we need getMe mock
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'Test User', email: 'test@test.com' });

        await act(async () => {
            screen.getByTestId('login-btn').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('user').textContent).toBe('Test User');
        });
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(mockStore['cp_token']).toBe('new-token');
        expect(api.setToken).toHaveBeenCalledWith('new-token');
    });

    it('logout clears token and user', async () => {
        mockStore['cp_token'] = 'existing-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'User', email: 'a@b.com' });

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('authenticated').textContent).toBe('true');
        });

        await act(async () => {
            screen.getByTestId('logout-btn').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('authenticated').textContent).toBe('false');
        });
        expect(screen.getByTestId('user').textContent).toBe('none');
        expect(mockStore['cp_token']).toBeUndefined();
        expect(api.setToken).toHaveBeenCalledWith(null);
    });

    it('logs out if getMe fails with stored token', async () => {
        mockStore['cp_token'] = 'bad-token';
        api.getMe.mockRejectedValueOnce(new Error('Token expired'));

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(mockStore['cp_token']).toBeUndefined();
    });
});
