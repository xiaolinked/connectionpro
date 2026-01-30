import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../../pages/Register';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../services/api', () => ({
    api: {
        checkEmail: vi.fn(),
        register: vi.fn(),
        sendLoginLink: vi.fn(),
    },
}));

// Mock useAuth
const mockUser = null;
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser
    })
}));

import { api } from '../../services/api';

const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the email input form initially', () => {
        renderWithRouter(<Register />);
        expect(screen.getByText('ConnectionPro')).toBeInTheDocument();
        expect(screen.getByText('Welcome')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    describe('Existing user flow', () => {
        it('sends magic link directly for existing user using sendLoginLink', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockResolvedValueOnce({ exists: true });
            api.sendLoginLink.mockResolvedValueOnce({
                message: 'Magic link sent',
                magic_link: 'http://localhost:5173/verify?token=existing-user-token',
            });

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'existing@example.com');
            await user.click(screen.getByText('Continue'));

            await waitFor(() => {
                expect(screen.getByText('Welcome back! Click the link below to sign in:')).toBeInTheDocument();
                expect(screen.getByText('🔗 Click here to sign in')).toHaveAttribute(
                    'href',
                    'http://localhost:5173/verify?token=existing-user-token'
                );
            });

            expect(api.checkEmail).toHaveBeenCalledWith('existing@example.com');
            expect(api.sendLoginLink).toHaveBeenCalledWith('existing@example.com');
            // REGRESSION: register should NOT be called for existing users (would overwrite name)
            expect(api.register).not.toHaveBeenCalled();
        });
    });

    describe('New user flow', () => {
        it('shows name form for new user', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockResolvedValueOnce({ exists: false });

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'new@example.com');
            await user.click(screen.getByText('Continue'));

            await waitFor(() => {
                expect(screen.getByText('Create your account')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
            });

            expect(api.checkEmail).toHaveBeenCalledWith('new@example.com');
            // register should NOT be called yet
            expect(api.register).not.toHaveBeenCalled();
        });

        it('creates account with name for new user', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockResolvedValueOnce({ exists: false });
            api.register.mockResolvedValueOnce({
                message: 'Magic link sent',
                magic_link: 'http://localhost:5173/verify?token=new-user-token',
            });

            renderWithRouter(<Register />);

            // Step 1: Enter email
            await user.type(screen.getByPlaceholderText('Enter your email'), 'new@example.com');
            await user.click(screen.getByText('Continue'));

            // Step 2: Enter name
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
            });

            await user.type(screen.getByPlaceholderText('Full Name'), 'John Doe');
            await user.click(screen.getByText('Create Account'));

            // Step 3: Verify magic link displayed
            await waitFor(() => {
                expect(screen.getByText('Account created! Click the link below to sign in:')).toBeInTheDocument();
                expect(screen.getByText('🔗 Click here to sign in')).toHaveAttribute(
                    'href',
                    'http://localhost:5173/verify?token=new-user-token'
                );
            });

            expect(api.register).toHaveBeenCalledWith('John Doe', 'new@example.com');
        });

        it('allows going back from name form to email form', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockResolvedValueOnce({ exists: false });

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'new@example.com');
            await user.click(screen.getByText('Continue'));

            await waitFor(() => {
                expect(screen.getByText('Create your account')).toBeInTheDocument();
            });

            await user.click(screen.getByText('Back'));

            await waitFor(() => {
                expect(screen.getByText('Welcome')).toBeInTheDocument();
                expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
            });
        });
    });

    describe('Error handling', () => {
        it('shows error message when checkEmail fails', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockRejectedValueOnce(new Error('Network error'));

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'fail@example.com');
            await user.click(screen.getByText('Continue'));

            await waitFor(() => {
                expect(screen.getByText('Error: Network error')).toBeInTheDocument();
            });
        });

        it('shows error message when register fails', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockResolvedValueOnce({ exists: false });
            api.register.mockRejectedValueOnce(new Error('Registration failed'));

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'new@example.com');
            await user.click(screen.getByText('Continue'));

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
            });

            await user.type(screen.getByPlaceholderText('Full Name'), 'John Doe');
            await user.click(screen.getByText('Create Account'));

            await waitFor(() => {
                expect(screen.getByText('Error: Registration failed')).toBeInTheDocument();
            });
        });
    });

    describe('Loading states', () => {
        it('shows checking state during email check', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockImplementation(() => new Promise(resolve =>
                setTimeout(() => resolve({ exists: false }), 100)
            ));

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'slow@example.com');
            await user.click(screen.getByText('Continue'));

            expect(screen.getByText('Checking...')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Checking/i })).toBeDisabled();

            await waitFor(() => {
                expect(screen.queryByText('Checking...')).not.toBeInTheDocument();
            });
        });

        it('shows creating state during registration', async () => {
            const user = userEvent.setup();
            api.checkEmail.mockResolvedValueOnce({ exists: false });
            api.register.mockImplementation(() => new Promise(resolve =>
                setTimeout(() => resolve({ magic_link: 'http://...' }), 100)
            ));

            renderWithRouter(<Register />);

            await user.type(screen.getByPlaceholderText('Enter your email'), 'slow@example.com');
            await user.click(screen.getByText('Continue'));

            await waitFor(() => {
                expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
            });

            await user.type(screen.getByPlaceholderText('Full Name'), 'John Doe');
            await user.click(screen.getByText('Create Account'));

            expect(screen.getByText('Creating...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
            });
        });
    });
});
