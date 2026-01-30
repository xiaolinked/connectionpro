import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from '../../components/layout/Layout';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        logout: vi.fn(),
    }),
}));

function renderLayout(route = '/') {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Layout>
                <div data-testid="child-content">Page Content</div>
            </Layout>
        </MemoryRouter>
    );
}

describe('Layout', () => {
    it('renders children in main content area', () => {
        renderLayout();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
        expect(screen.getByText('Page Content')).toBeInTheDocument();
    });

    it('renders sidebar with app name', () => {
        renderLayout();
        expect(screen.getByText('ConnectionPro')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        renderLayout();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Network')).toBeInTheDocument();
        expect(screen.getByText('Add Connection')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('has correct link destinations', () => {
        renderLayout();
        const links = screen.getAllByRole('link');
        const hrefs = links.map((l) => l.getAttribute('href'));
        expect(hrefs).toContain('/');
        expect(hrefs).toContain('/connections');
        expect(hrefs).toContain('/connections/new');
        expect(hrefs).toContain('/settings');
    });

    it('highlights active Dashboard link on /', () => {
        renderLayout('/');
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink.className).toContain('active');
    });

    it('highlights active Connections link on /connections', () => {
        renderLayout('/connections');
        const connectionsLink = screen.getByText('Network').closest('a');
        expect(connectionsLink.className).toContain('active');
    });
});
