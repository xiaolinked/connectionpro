import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../../pages/Settings';
import React from 'react';

const mockLogout = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: { name: 'John Doe', email: 'john@example.com' },
        logout: mockLogout,
        updateUser: mockUpdateUser,
    }),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe('Settings', () => {
    it('renders settings page title', () => {
        render(<Settings />);
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('displays user profile information', () => {
        render(<Settings />);
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('displays profile section header', () => {
        render(<Settings />);
        expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });

    it('displays account security section', () => {
        render(<Settings />);
        expect(screen.getByText('Account security')).toBeInTheDocument();
        expect(screen.getByText(/magic link/i)).toBeInTheDocument();
    });

    it('displays session validity info', () => {
        render(<Settings />);
        expect(screen.getByText(/7 days/)).toBeInTheDocument();
    });

    it('renders logout button', () => {
        render(<Settings />);
        expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls logout when button is clicked', async () => {
        render(<Settings />);
        const user = userEvent.setup();
        await user.click(screen.getByText('Logout'));
        expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('displays Account Actions section', () => {
        render(<Settings />);
        expect(screen.getByText('Account Actions')).toBeInTheDocument();
    });

    it('has Save Changes button disabled when no changes', () => {
        render(<Settings />);
        const saveBtn = screen.getByText('Save Changes');
        expect(saveBtn.closest('button')).toBeDisabled();
    });

    it('enables Save Changes button when name is edited', async () => {
        render(<Settings />);
        const user = userEvent.setup();
        const input = screen.getByDisplayValue('John Doe');
        await user.clear(input);
        await user.type(input, 'Jane Doe');
        expect(screen.getByText('Save Changes').closest('button')).not.toBeDisabled();
    });

    it('calls updateUser and shows success message on save', async () => {
        mockUpdateUser.mockResolvedValueOnce({ name: 'Jane Doe', email: 'john@example.com' });
        render(<Settings />);
        const user = userEvent.setup();
        const input = screen.getByDisplayValue('John Doe');
        await user.clear(input);
        await user.type(input, 'Jane Doe');
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Profile updated successfully.')).toBeInTheDocument();
        });
        expect(mockUpdateUser).toHaveBeenCalledWith({ name: 'Jane Doe' });
    });

    it('shows error message on save failure', async () => {
        mockUpdateUser.mockRejectedValueOnce(new Error('Network error'));
        render(<Settings />);
        const user = userEvent.setup();
        const input = screen.getByDisplayValue('John Doe');
        await user.clear(input);
        await user.type(input, 'New Name');
        await user.click(screen.getByText('Save Changes'));
        await waitFor(() => {
            expect(screen.getByText('Failed to update profile.')).toBeInTheDocument();
        });
    });
});
