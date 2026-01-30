import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../../pages/Dashboard';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock contexts
vi.mock('../../context/DataContext', () => ({
    useData: vi.fn(),
}));
vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

function renderDashboard() {
    return render(
        <MemoryRouter>
            <Dashboard />
        </MemoryRouter>
    );
}

describe('Dashboard', () => {
    it('shows loading state', () => {
        useAuth.mockReturnValue({ user: { name: 'John' } });
        useData.mockReturnValue({ connections: [], logs: [], isLoading: true });
        renderDashboard();
        expect(screen.getByText('Loading network data...')).toBeInTheDocument();
    });

    it('displays welcome message with first name', () => {
        useAuth.mockReturnValue({ user: { name: 'John Doe' } });
        useData.mockReturnValue({ connections: [], logs: [], isLoading: false });
        renderDashboard();
        expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
    });

    it('displays fallback greeting when user name is missing', () => {
        useAuth.mockReturnValue({ user: null });
        useData.mockReturnValue({ connections: [], logs: [], isLoading: false });
        renderDashboard();
        expect(screen.getByText('Welcome, there!')).toBeInTheDocument();
    });

    it('displays total connections stat', () => {
        useAuth.mockReturnValue({ user: { name: 'User' } });
        useData.mockReturnValue({
            connections: [{ id: '1' }, { id: '2' }, { id: '3' }],
            logs: [],
            isLoading: false,
        });
        renderDashboard();
        expect(screen.getByText('Total Connections')).toBeInTheDocument();
        // The stat value "3" appears as a <p> inside a stat card
        const statCard = screen.getByText('Total Connections').closest('.card');
        expect(statCard).toHaveTextContent('3');
    });

    it('displays growth moments from logs with learning tag', () => {
        useAuth.mockReturnValue({ user: { name: 'User' } });
        useData.mockReturnValue({
            connections: [],
            logs: [
                { id: 'l1', tags: ['learning'], notes: 'Learned React' },
                { id: 'l2', tags: ['meeting'], notes: 'Team sync' },
                { id: 'l3', tags: ['learning', 'work'], notes: 'Workshop' },
            ],
            isLoading: false,
        });
        renderDashboard();
        expect(screen.getByText('Growth Moments')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // 2 logs with 'learning'
    });

    it('shows empty state for no interactions', () => {
        useAuth.mockReturnValue({ user: { name: 'User' } });
        useData.mockReturnValue({ connections: [], logs: [], isLoading: false });
        renderDashboard();
        expect(screen.getByText('No interactions logged yet.')).toBeInTheDocument();
    });

    it('shows recent interactions (max 5)', () => {
        useAuth.mockReturnValue({ user: { name: 'User' } });
        useData.mockReturnValue({
            connections: [],
            logs: [
                { id: '1', notes: 'Log 1', created_at: '2024-01-01' },
                { id: '2', notes: 'Log 2', created_at: '2024-01-02' },
                { id: '3', notes: 'Log 3', created_at: '2024-01-03' },
                { id: '4', notes: 'Log 4', created_at: '2024-01-04' },
                { id: '5', notes: 'Log 5', created_at: '2024-01-05' },
                { id: '6', notes: 'Log 6', created_at: '2024-01-06' },
            ],
            isLoading: false,
        });
        renderDashboard();
        expect(screen.getByText('Log 1')).toBeInTheDocument();
        expect(screen.getByText('Log 5')).toBeInTheDocument();
        expect(screen.queryByText('Log 6')).not.toBeInTheDocument();
    });

    it('displays upcoming follow-ups count for overdue and due_soon connections', () => {
        const overdue = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
        const dueSoon = new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString();
        const healthy = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        useAuth.mockReturnValue({ user: { name: 'User' } });
        useData.mockReturnValue({
            connections: [
                { id: '1', frequency: 90, lastContact: overdue },
                { id: '2', frequency: 90, lastContact: dueSoon },
                { id: '3', frequency: 90, lastContact: healthy },
            ],
            logs: [],
            isLoading: false,
        });
        renderDashboard();
        const statCard = screen.getByText('Upcoming Follow-ups').closest('.card');
        expect(statCard).toHaveTextContent('2');
    });

    it('renders action buttons', () => {
        useAuth.mockReturnValue({ user: { name: 'User' } });
        useData.mockReturnValue({ connections: [], logs: [], isLoading: false });
        renderDashboard();
        expect(screen.getByText('Add Connection')).toBeInTheDocument();
    });
});
