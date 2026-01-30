import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ToastProvider, useToast, TOAST_TYPES } from '../../context/ToastContext';

// Test component that exposes toast context functions
function ToastTester() {
    const { toast, showToast, hideToast } = useToast();
    return (
        <div>
            <span data-testid="toast-message">{toast?.message ?? ''}</span>
            <span data-testid="toast-type">{toast?.type ?? ''}</span>
            <button data-testid="show-success" onClick={() => showToast('Success!', TOAST_TYPES.SUCCESS)}>
                Show Success
            </button>
            <button data-testid="show-error" onClick={() => showToast('Error!', TOAST_TYPES.ERROR)}>
                Show Error
            </button>
            <button data-testid="show-no-dismiss" onClick={() => showToast('Persistent', TOAST_TYPES.INFO, 0)}>
                Show No Dismiss
            </button>
            <button data-testid="hide" onClick={hideToast}>
                Hide
            </button>
        </div>
    );
}

function renderWithProvider() {
    return render(
        <ToastProvider>
            <ToastTester />
        </ToastProvider>
    );
}

describe('ToastContext', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts with no toast visible', () => {
        renderWithProvider();
        expect(screen.getByTestId('toast-message').textContent).toBe('');
        expect(screen.getByTestId('toast-type').textContent).toBe('');
    });

    it('shows success toast when showToast is called', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderWithProvider();

        await user.click(screen.getByTestId('show-success'));

        expect(screen.getByTestId('toast-message').textContent).toBe('Success!');
        expect(screen.getByTestId('toast-type').textContent).toBe('success');
    });

    it('shows error toast when showToast is called with ERROR type', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderWithProvider();

        await user.click(screen.getByTestId('show-error'));

        expect(screen.getByTestId('toast-message').textContent).toBe('Error!');
        expect(screen.getByTestId('toast-type').textContent).toBe('error');
    });

    it('hides toast when hideToast is called', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderWithProvider();

        await user.click(screen.getByTestId('show-success'));
        expect(screen.getByTestId('toast-message').textContent).toBe('Success!');

        await user.click(screen.getByTestId('hide'));
        expect(screen.getByTestId('toast-message').textContent).toBe('');
    });

    it('auto-dismisses toast after default duration', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderWithProvider();

        await user.click(screen.getByTestId('show-success'));
        expect(screen.getByTestId('toast-message').textContent).toBe('Success!');

        // Advance time past default duration (3000ms)
        await act(async () => {
            vi.advanceTimersByTime(3100);
        });

        expect(screen.getByTestId('toast-message').textContent).toBe('');
    });

    it('does not auto-dismiss when duration is 0', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderWithProvider();

        await user.click(screen.getByTestId('show-no-dismiss'));
        expect(screen.getByTestId('toast-message').textContent).toBe('Persistent');

        // Advance time past default duration
        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        // Toast should still be visible
        expect(screen.getByTestId('toast-message').textContent).toBe('Persistent');
    });

    it('replaces existing toast when new toast is shown', async () => {
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderWithProvider();

        await user.click(screen.getByTestId('show-success'));
        expect(screen.getByTestId('toast-message').textContent).toBe('Success!');

        await user.click(screen.getByTestId('show-error'));
        expect(screen.getByTestId('toast-message').textContent).toBe('Error!');
        expect(screen.getByTestId('toast-type').textContent).toBe('error');
    });
});

describe('useToast hook', () => {
    it('throws error when used outside ToastProvider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        const TestComponent = () => {
            useToast();
            return null;
        };

        expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider');
        consoleSpy.mockRestore();
    });
});
