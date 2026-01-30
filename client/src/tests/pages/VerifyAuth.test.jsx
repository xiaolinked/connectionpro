import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VerifyAuth from '../../pages/VerifyAuth';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Mock api
vi.mock('../../services/api', () => ({
    api: {
        verifyMagicLink: vi.fn(),
    },
}));

// Mock auth context
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
    }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: vi.fn(),
    };
});

import { api } from '../../services/api';
import { useSearchParams } from 'react-router-dom';

describe('VerifyAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows verifying state initially', () => {
        useSearchParams.mockReturnValue([new URLSearchParams('?token=abc')]);
        api.verifyMagicLink.mockReturnValue(new Promise(() => { })); // never resolves

        render(
            <MemoryRouter>
                <VerifyAuth />
            </MemoryRouter>
        );
        expect(screen.getByText('Verifying your magic link...')).toBeInTheDocument();
    });

    it('shows success after verification', async () => {
        useSearchParams.mockReturnValue([new URLSearchParams('?token=valid')]);
        api.verifyMagicLink.mockResolvedValueOnce({
            access_token: 'jwt-123',
            user: { id: '1', name: 'User' },
        });

        render(
            <MemoryRouter>
                <VerifyAuth />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Authenticated Successfully!')).toBeInTheDocument();
        });
        expect(mockLogin).toHaveBeenCalledWith('jwt-123', { id: '1', name: 'User' });
    });

    it('shows error when no token provided', async () => {
        useSearchParams.mockReturnValue([new URLSearchParams('')]);

        render(
            <MemoryRouter>
                <VerifyAuth />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        });
        expect(screen.getByText('No token provided')).toBeInTheDocument();
    });

    it('shows error on verification failure', async () => {
        useSearchParams.mockReturnValue([new URLSearchParams('?token=bad')]);
        api.verifyMagicLink.mockRejectedValueOnce(new Error('Invalid token'));

        render(
            <MemoryRouter>
                <VerifyAuth />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        });
        expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });

    it('shows return to login button on error', async () => {
        useSearchParams.mockReturnValue([new URLSearchParams('?token=bad')]);
        api.verifyMagicLink.mockRejectedValueOnce(new Error('Failed'));

        render(
            <MemoryRouter>
                <VerifyAuth />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Return to Login')).toBeInTheDocument();
        });
    });
    it('verifies fix: shows stringified error when error detail is not a string (e.g. 422 validation)', async () => {
        useSearchParams.mockReturnValue([new URLSearchParams('?token=bad-format')]);
        // Simulate what happens when api.fetch throws with a non-string detail
        // We manually construct the error as if api.js did it (it now stringifies)
        const detail = [{ loc: ['body'], msg: 'required' }];
        const validationError = new Error(JSON.stringify(detail));

        api.verifyMagicLink.mockRejectedValueOnce(validationError);

        render(
            <MemoryRouter>
                <VerifyAuth />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Authentication Failed')).toBeInTheDocument();
        });

        // Should NOT show [object Object]
        expect(screen.queryByText(/object Object/)).not.toBeInTheDocument();
        // Should show the stringified JSON
        expect(screen.getByText(JSON.stringify(detail))).toBeInTheDocument();
    });
});
