import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Layout from '../../components/layout/Layout';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

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
        // The sidebar has "Connection" text and a "Pro" span
        expect(screen.getByText('Pro')).toBeInTheDocument();
        const heading = screen.getByText('Pro').closest('h2');
        expect(heading).toBeInTheDocument();
        expect(heading.textContent).toContain('Connection');
    });

    it('renders navigation links', () => {
        renderLayout();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Connections')).toBeInTheDocument();
        expect(screen.getByText('Add New')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('has correct link destinations', () => {
        renderLayout();
        const links = screen.getAllByRole('link');
        const hrefs = links.map((l) => l.getAttribute('href'));
        expect(hrefs).toContain('/');
        expect(hrefs).toContain('/connections');
        expect(hrefs).toContain('/add');
        expect(hrefs).toContain('/settings');
    });

    it('highlights active Dashboard link on /', () => {
        renderLayout('/');
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink.className).toContain('active');
    });

    it('highlights active Connections link on /connections', () => {
        renderLayout('/connections');
        const connectionsLink = screen.getByText('Connections').closest('a');
        expect(connectionsLink.className).toContain('active');
    });
});
