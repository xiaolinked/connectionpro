import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../../components/dashboard/StatCard';
import React from 'react';

// Simple mock icon component
const MockIcon = (props) => <svg data-testid="mock-icon" {...props} />;

describe('StatCard', () => {
    it('renders title and value', () => {
        render(<StatCard title="Total Connections" value={42} icon={MockIcon} />);
        expect(screen.getByText('Total Connections')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders the icon', () => {
        render(<StatCard title="Test" value={0} icon={MockIcon} />);
        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });

    it('renders without icon gracefully', () => {
        render(<StatCard title="No Icon" value={5} />);
        expect(screen.getByText('No Icon')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('displays string values', () => {
        render(<StatCard title="Status" value="Active" icon={MockIcon} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays zero value', () => {
        render(<StatCard title="Empty" value={0} icon={MockIcon} />);
        expect(screen.getByText('0')).toBeInTheDocument();
    });
});
