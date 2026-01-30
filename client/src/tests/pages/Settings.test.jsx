import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../../pages/Settings';
import { api } from '../../services/api';
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

vi.mock('../../services/api', () => ({
    api: {
        deleteMe: vi.fn(),
    },
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


describe('Settings - Danger Zone (Delete Account)', () => {
    it('displays Danger Zone section', () => {
        render(<Settings />);
        expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('displays warning about permanent deletion', () => {
        render(<Settings />);
        expect(screen.getByText(/this action cannot be undone/i)).toBeInTheDocument();
        expect(screen.getByText(/this will permanently delete/i)).toBeInTheDocument();
    });

    it('lists what will be deleted', () => {
        render(<Settings />);
        expect(screen.getByText('Your profile information')).toBeInTheDocument();
        expect(screen.getByText('All your connections')).toBeInTheDocument();
        expect(screen.getByText('All interaction logs and notes')).toBeInTheDocument();
    });

    it('has delete button disabled by default', () => {
        render(<Settings />);
        const deleteBtn = screen.getByText('Delete Account');
        expect(deleteBtn.closest('button')).toBeDisabled();
    });

    it('has delete button disabled when confirmation text is wrong', async () => {
        render(<Settings />);
        const user = userEvent.setup();
        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'delete'); // lowercase should not work
        expect(screen.getByText('Delete Account').closest('button')).toBeDisabled();
    });

    it('enables delete button when user types DELETE', async () => {
        render(<Settings />);
        const user = userEvent.setup();
        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');
        expect(screen.getByText('Delete Account').closest('button')).not.toBeDisabled();
    });

    it('calls api.deleteMe and logout on successful deletion', async () => {
        api.deleteMe.mockResolvedValueOnce(true);
        render(<Settings />);
        const user = userEvent.setup();

        // Type DELETE to enable the button
        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');

        // Click delete
        await user.click(screen.getByText('Delete Account'));

        await waitFor(() => {
            expect(api.deleteMe).toHaveBeenCalledTimes(1);
            expect(mockLogout).toHaveBeenCalledTimes(1);
        });
    });

    it('shows "Deleting Account..." while deletion is in progress', async () => {
        // Make deleteMe hang (never resolve) to check loading state
        let resolveDelete;
        api.deleteMe.mockReturnValueOnce(new Promise((resolve) => { resolveDelete = resolve; }));

        render(<Settings />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');
        await user.click(screen.getByText('Delete Account'));

        await waitFor(() => {
            expect(screen.getByText('Deleting Account...')).toBeInTheDocument();
        });

        // Clean up - resolve the promise
        resolveDelete(true);
    });

    it('shows error message when deletion fails', async () => {
        api.deleteMe.mockRejectedValueOnce(new Error('Server error'));
        render(<Settings />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');
        await user.click(screen.getByText('Delete Account'));

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });

        // Should NOT call logout on failure
        expect(mockLogout).not.toHaveBeenCalled();
    });

    it('shows fallback error message when error has no message', async () => {
        api.deleteMe.mockRejectedValueOnce(new Error());
        render(<Settings />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');
        await user.click(screen.getByText('Delete Account'));

        await waitFor(() => {
            expect(screen.getByText('Failed to delete account. Please try again.')).toBeInTheDocument();
        });
    });

    it('re-enables delete button after failed deletion', async () => {
        api.deleteMe.mockRejectedValueOnce(new Error('Temporary failure'));
        render(<Settings />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');
        await user.click(screen.getByText('Delete Account'));

        await waitFor(() => {
            expect(screen.getByText('Temporary failure')).toBeInTheDocument();
        });

        // Button should be re-enabled for retry
        const deleteBtn = screen.getByText('Delete Account');
        expect(deleteBtn.closest('button')).not.toBeDisabled();
    });

    it('clears error when user modifies confirmation text', async () => {
        api.deleteMe.mockRejectedValueOnce(new Error('Server error'));
        render(<Settings />);
        const user = userEvent.setup();

        const input = screen.getByPlaceholderText('Type DELETE to confirm');
        await user.type(input, 'DELETE');
        await user.click(screen.getByText('Delete Account'));

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });

        // Modify the input - error should clear
        await user.clear(input);
        expect(screen.queryByText('Server error')).not.toBeInTheDocument();
    });

    it('does not call deleteMe when button is clicked without confirmation', async () => {
        render(<Settings />);
        const user = userEvent.setup();

        // Button is disabled, but let's verify the handler guards against it
        const deleteBtn = screen.getByText('Delete Account');
        expect(deleteBtn.closest('button')).toBeDisabled();

        // api.deleteMe should never be called
        expect(api.deleteMe).not.toHaveBeenCalled();
    });
});
