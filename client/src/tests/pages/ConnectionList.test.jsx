import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConnectionList from '../../pages/ConnectionList';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../context/DataContext', () => ({
    useData: vi.fn(),
}));

import { useData } from '../../context/DataContext';

const mockConnections = [
    { id: '1', name: 'Alice Johnson', role: 'Engineer', company: 'Acme', tags: ['work', 'python'], lastContact: '2024-01-15T00:00:00' },
    { id: '2', name: 'Bob Smith', role: 'Designer', company: 'DesignCo', tags: ['friend'], lastContact: '2024-03-20T00:00:00' },
    { id: '3', name: 'Carol White', role: 'PM', company: 'BigTech', tags: ['mentor', 'vip'], lastContact: null },
];

function renderConnectionList() {
    return render(
        <MemoryRouter>
            <ConnectionList />
        </MemoryRouter>
    );
}

describe('ConnectionList', () => {
    it('shows loading state', () => {
        useData.mockReturnValue({ connections: [], isLoading: true });
        renderConnectionList();
        expect(screen.getByText('Loading your network...')).toBeInTheDocument();
    });

    it('shows empty state when no connections', () => {
        useData.mockReturnValue({ connections: [], isLoading: false });
        renderConnectionList();
        expect(screen.getByText(/haven.*added any connections yet/)).toBeInTheDocument();
    });

    it('renders connections in table view by default', () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('displays role and company', () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();
        expect(screen.getByText('Engineer')).toBeInTheDocument();
        expect(screen.getByText('Acme')).toBeInTheDocument();
    });

    it('filters connections by name search', async () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();

        const searchInput = screen.getByPlaceholderText('Search by name, company, or tag...');
        await userEvent.setup().type(searchInput, 'Alice');

        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
        expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument();
    });

    it('filters connections by company search', async () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();

        const searchInput = screen.getByPlaceholderText('Search by name, company, or tag...');
        await userEvent.setup().type(searchInput, 'DesignCo');

        expect(screen.getByText('Bob Smith')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('filters connections by tag search', async () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();

        const searchInput = screen.getByPlaceholderText('Search by name, company, or tag...');
        await userEvent.setup().type(searchInput, 'mentor');

        expect(screen.getByText('Carol White')).toBeInTheDocument();
        expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });

    it('shows no-results message when search has no matches', async () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();

        const searchInput = screen.getByPlaceholderText('Search by name, company, or tag...');
        await userEvent.setup().type(searchInput, 'zzzznonexistent');

        expect(screen.getByText('No connections match your search.')).toBeInTheDocument();
    });

    it('renders Add New button', () => {
        useData.mockReturnValue({ connections: [], isLoading: false });
        renderConnectionList();
        expect(screen.getByText('+ Add New')).toBeInTheDocument();
    });

    it('renders page title', () => {
        useData.mockReturnValue({ connections: [], isLoading: false });
        renderConnectionList();
        expect(screen.getByText('My Network')).toBeInTheDocument();
    });

    it('shows tags in table view', () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();
        expect(screen.getByText('work')).toBeInTheDocument();
        expect(screen.getByText('python')).toBeInTheDocument();
    });

    it('shows last contact date or dash for null', () => {
        useData.mockReturnValue({ connections: mockConnections, isLoading: false });
        renderConnectionList();
        // Carol has no lastContact
        expect(screen.getByText('-')).toBeInTheDocument();
    });
});
