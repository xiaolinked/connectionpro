import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SmartReminders from '../../components/dashboard/SmartReminders';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock useData hook
vi.mock('../../context/DataContext', () => ({
    useData: vi.fn(),
}));

import { useData } from '../../context/DataContext';

function renderSmartReminders() {
    return render(
        <MemoryRouter>
            <SmartReminders />
        </MemoryRouter>
    );
}

describe('SmartReminders', () => {
    it('returns null when no overdue connections', () => {
        useData.mockReturnValue({
            connections: [
                { id: '1', name: 'Alice', frequency: 90 }, // no lastContact = healthy
            ],
        });
        const { container } = renderSmartReminders();
        expect(container.innerHTML).toBe('');
    });

    it('shows overdue connections', () => {
        const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
        useData.mockReturnValue({
            connections: [
                { id: '1', name: 'Overdue Alice', frequency: 30, lastContact: old },
            ],
        });
        renderSmartReminders();
        expect(screen.getByText('Overdue Alice')).toBeInTheDocument();
        expect(screen.getByText('Smart Reminders')).toBeInTheDocument();
    });

    it('shows at most 3 reminders', () => {
        const old = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
        useData.mockReturnValue({
            connections: [
                { id: '1', name: 'A', frequency: 30, lastContact: old },
                { id: '2', name: 'B', frequency: 30, lastContact: old },
                { id: '3', name: 'C', frequency: 30, lastContact: old },
                { id: '4', name: 'D', frequency: 30, lastContact: old },
            ],
        });
        renderSmartReminders();
        // Should only show 3 names
        const names = ['A', 'B', 'C', 'D'];
        let found = 0;
        names.forEach((n) => {
            if (screen.queryByText(n)) found++;
        });
        expect(found).toBe(3);
    });

    it('sorts by most overdue first', () => {
        const veryOld = new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString();
        const old = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
        useData.mockReturnValue({
            connections: [
                { id: '1', name: 'LessOverdue', frequency: 30, lastContact: old },
                { id: '2', name: 'MostOverdue', frequency: 30, lastContact: veryOld },
            ],
        });
        renderSmartReminders();
        const items = screen.getAllByText(/Overdue|MostOverdue|LessOverdue/);
        // MostOverdue should appear before LessOverdue
        const text = document.body.textContent;
        expect(text.indexOf('MostOverdue')).toBeLessThan(text.indexOf('LessOverdue'));
    });

    it('renders links to connection detail pages', () => {
        const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
        useData.mockReturnValue({
            connections: [
                { id: 'conn-42', name: 'LinkTest', frequency: 30, lastContact: old },
            ],
        });
        renderSmartReminders();
        const link = screen.getByRole('link');
        expect(link.getAttribute('href')).toBe('/connections/conn-42');
    });

    it('shows due_soon connections', () => {
        // 80 days ago with 90-day frequency = due_soon (within 14-day window)
        const dueSoon = new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString();
        useData.mockReturnValue({
            connections: [
                { id: '1', name: 'DueSoonPerson', frequency: 90, lastContact: dueSoon },
            ],
        });
        renderSmartReminders();
        expect(screen.getByText('DueSoonPerson')).toBeInTheDocument();
    });

    it('shows overdue before due_soon', () => {
        const overdue = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
        const dueSoon = new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString();
        useData.mockReturnValue({
            connections: [
                { id: '1', name: 'DueSoonFirst', frequency: 90, lastContact: dueSoon },
                { id: '2', name: 'OverdueSecond', frequency: 90, lastContact: overdue },
            ],
        });
        renderSmartReminders();
        const text = document.body.textContent;
        expect(text.indexOf('OverdueSecond')).toBeLessThan(text.indexOf('DueSoonFirst'));
    });

    it('renders nothing for empty connections array', () => {
        useData.mockReturnValue({ connections: [] });
        const { container } = renderSmartReminders();
        expect(container.innerHTML).toBe('');
    });
});
