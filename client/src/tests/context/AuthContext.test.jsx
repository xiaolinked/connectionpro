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
        vi.resetAllMocks(); // Reset mock implementations too
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

        // Wait for getMe to be called (it will reject)
        await waitFor(() => {
            expect(api.getMe).toHaveBeenCalled();
        });

        // After getMe rejects, logout() should be called, clearing the token
        await waitFor(() => {
            expect(mockStore['cp_token']).toBeUndefined();
        });

        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
    });

    // Regression test: Prevent race condition where API calls are made before token is set
    // Issue: When navigating to a detail page, components could call API before useEffect set the token
    it('sets API token synchronously on mount when token exists in localStorage', () => {
        mockStore['cp_token'] = 'sync-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'User', email: 'a@b.com' });

        // Before render completes, the token should already be set on the API
        // This prevents race conditions where child components make API calls before useEffect runs
        renderWithAuth();

        // Check that setToken was called IMMEDIATELY during initialization (synchronously)
        // This is the first call, before any async operations complete
        expect(api.setToken).toHaveBeenCalledWith('sync-token');

        // Verify it was called at least once (during initialization)
        expect(api.setToken.mock.calls[0][0]).toBe('sync-token');
    });

    // Regression test: After login(), the useEffect should NOT call getMe() again
    // Issue: login() sets user data, but useEffect would then call getMe() creating a race condition
    it('does not call getMe after login() since user is already set', async () => {
        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        // Click login button
        await act(async () => {
            screen.getByTestId('login-btn').click();
        });

        // Wait for state to settle
        await waitFor(() => {
            expect(screen.getByTestId('authenticated').textContent).toBe('true');
        });

        // getMe should NOT have been called because login() already provided user data
        // The loginCalledRef flag should have prevented the redundant call
        expect(api.getMe).not.toHaveBeenCalled();
    });

    // Regression test: Ensure API token is set before any child component effects run
    // This tests the timing of token initialization
    it('token is available immediately for child component API calls', () => {
        mockStore['cp_token'] = 'child-component-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'User', email: 'a@b.com' });

        // Track the order of setToken calls
        const setTokenCalls = [];
        api.setToken.mockImplementation((token) => {
            setTokenCalls.push({ token, timestamp: Date.now() });
        });

        renderWithAuth();

        // The first setToken call should happen synchronously with the passed token
        expect(setTokenCalls.length).toBeGreaterThanOrEqual(1);
        expect(setTokenCalls[0].token).toBe('child-component-token');
    });

    // Test that authentication state persists across component re-renders
    it('maintains authentication state across re-renders', async () => {
        mockStore['cp_token'] = 'persistent-token';
        api.getMe.mockResolvedValue({ id: '1', name: 'Persistent User', email: 'a@b.com' });

        const { rerender } = renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('authenticated').textContent).toBe('true');
        });

        // Re-render the component tree
        rerender(
            <AuthProvider>
                <AuthConsumer />
            </AuthProvider>
        );

        // Authentication should still be valid
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toBe('Persistent User');
    });
});

