import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../../pages/Register';
import React from 'react';

// Mock the api module
vi.mock('../../services/api', () => ({
    api: {
        checkEmail: vi.fn(),
        register: vi.fn(),
    },
}));

import { api } from '../../services/api';

describe('Register', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the email step by default', () => {
        render(<Register />);
        expect(screen.getByText('Welcome to ConnectionPro')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('moves to name step for new users', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockResolvedValueOnce({ exists: false });

        render(<Register />);

        const emailInput = screen.getByPlaceholderText('john@example.com');
        await user.type(emailInput, 'new@test.com');
        await user.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
        });
    });

    it('goes to sent step for existing users', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockResolvedValueOnce({ exists: true });
        api.register.mockResolvedValueOnce({
            message: 'Magic link generated',
            magic_link: 'http://localhost:5173/verify?token=abc',
        });

        render(<Register />);

        const emailInput = screen.getByPlaceholderText('john@example.com');
        await user.type(emailInput, 'existing@test.com');
        await user.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(screen.getByText('Check your email!')).toBeInTheDocument();
        });
    });

    it('displays magic link in demo mode', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockResolvedValueOnce({ exists: true });
        api.register.mockResolvedValueOnce({
            message: 'Magic link generated',
            magic_link: 'http://localhost:5173/verify?token=demo-token',
        });

        render(<Register />);

        const emailInput = screen.getByPlaceholderText('john@example.com');
        await user.type(emailInput, 'demo@test.com');
        await user.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(screen.getByText(/demo-token/)).toBeInTheDocument();
        });
    });

    it('shows error on email check failure', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockRejectedValueOnce(new Error('Network error'));

        render(<Register />);

        const emailInput = screen.getByPlaceholderText('john@example.com');
        await user.type(emailInput, 'bad@test.com');
        await user.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    it('submits name form and shows sent step', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockResolvedValueOnce({ exists: false });
        api.register.mockResolvedValueOnce({
            message: 'Magic link generated',
            magic_link: 'http://localhost:5173/verify?token=new-token',
        });

        render(<Register />);

        // Email step
        await user.type(screen.getByPlaceholderText('john@example.com'), 'new@test.com');
        await user.click(screen.getByText('Next'));

        // Name step
        await waitFor(() => {
            expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
        });

        await user.type(screen.getByPlaceholderText('John'), 'Jane');
        await user.type(screen.getByPlaceholderText('Doe'), 'Smith');
        await user.click(screen.getByText('Complete & Send Magic Link'));

        await waitFor(() => {
            expect(screen.getByText('Check your email!')).toBeInTheDocument();
        });
        expect(api.register).toHaveBeenCalledWith('Jane Smith', 'new@test.com');
    });

    it('allows navigating back from name step', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockResolvedValueOnce({ exists: false });

        render(<Register />);

        await user.type(screen.getByPlaceholderText('john@example.com'), 'test@test.com');
        await user.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(screen.getByText('change my email address')).toBeInTheDocument();
        });

        await user.click(screen.getByText('change my email address'));

        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    });

    it('allows trying another email from sent step', async () => {
        const user = userEvent.setup();
        api.checkEmail.mockResolvedValueOnce({ exists: true });
        api.register.mockResolvedValueOnce({
            message: 'OK',
            magic_link: 'http://link',
        });

        render(<Register />);

        await user.type(screen.getByPlaceholderText('john@example.com'), 'x@test.com');
        await user.click(screen.getByText('Next'));

        await waitFor(() => {
            expect(screen.getByText('Try another email')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Try another email'));
        expect(screen.getByPlaceholderText('john@example.com')).toBeInTheDocument();
    });
});
