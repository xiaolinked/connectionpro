import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock localStorage
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
        getConnections: vi.fn(),
        getLogs: vi.fn(),
        createConnection: vi.fn(),
        updateConnection: vi.fn(),
        deleteConnection: vi.fn(),
        createLog: vi.fn(),
        deleteLog: vi.fn(),
    },
}));

import { api } from '../../services/api';
import { DataProvider, useData } from '../../context/DataContext';
import { AuthProvider } from '../../context/AuthContext';

// Test component that exposes data context
function DataConsumer() {
    const data = useData();
    return (
        <div>
            <span data-testid="loading">{String(data.isLoading)}</span>
            <span data-testid="connections-count">{data.connections.length}</span>
            <span data-testid="logs-count">{data.logs.length}</span>
        </div>
    );
}

function renderWithProviders() {
    return render(
        <AuthProvider>
            <DataProvider>
                <DataConsumer />
            </DataProvider>
        </AuthProvider>
    );
}

describe('DataContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStore = {};
        mockLocalStorage.getItem.mockImplementation((key) => mockStore[key] ?? null);
        mockLocalStorage.setItem.mockImplementation((key, value) => { mockStore[key] = String(value); });
        mockLocalStorage.removeItem.mockImplementation((key) => { delete mockStore[key]; });
    });

    it('starts with empty state when not authenticated', async () => {
        renderWithProviders();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('connections-count').textContent).toBe('0');
        expect(screen.getByTestId('logs-count').textContent).toBe('0');
    });

    it('loads connections and logs when authenticated', async () => {
        mockStore['cp_token'] = 'valid-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'User', email: 'a@b.com' });
        api.getConnections.mockResolvedValueOnce([
            { id: 'c1', name: 'Alice' },
            { id: 'c2', name: 'Bob' },
        ]);
        api.getLogs.mockResolvedValueOnce([
            { id: 'l1', notes: 'Met Alice' },
        ]);

        renderWithProviders();

        await waitFor(() => {
            expect(screen.getByTestId('connections-count').textContent).toBe('2');
        });
        expect(screen.getByTestId('logs-count').textContent).toBe('1');
    });

    it('handles connection load failure gracefully', async () => {
        mockStore['cp_token'] = 'valid-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'User', email: 'a@b.com' });
        api.getConnections.mockRejectedValueOnce(new Error('Network error'));
        api.getLogs.mockResolvedValueOnce([{ id: 'l1', notes: 'Log' }]);

        renderWithProviders();

        // Logs should still load even if connections fail
        await waitFor(() => {
            expect(screen.getByTestId('logs-count').textContent).toBe('1');
        });
    });

    it('handles log load failure gracefully', async () => {
        mockStore['cp_token'] = 'valid-token';
        api.getMe.mockResolvedValueOnce({ id: '1', name: 'User', email: 'a@b.com' });
        api.getConnections.mockResolvedValueOnce([{ id: 'c1', name: 'Alice' }]);
        api.getLogs.mockRejectedValueOnce(new Error('Network error'));

        renderWithProviders();

        await waitFor(() => {
            expect(screen.getByTestId('connections-count').textContent).toBe('1');
        });
    });

    it('clears data when user is not authenticated', async () => {
        renderWithProviders();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('connections-count').textContent).toBe('0');
        expect(screen.getByTestId('logs-count').textContent).toBe('0');
    });
});
