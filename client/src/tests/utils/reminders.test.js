import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConnectionStatus, getSmartReminderMessage } from '../../utils/reminders';

describe('getConnectionStatus', () => {
    it('returns healthy for connection with no lastContact', () => {
        const conn = { name: 'Bob', frequency: 30 };
        const result = getConnectionStatus(conn);
        expect(result.status).toBe('healthy');
        expect(result.daysDiff).toBe(0);
    });

    it('returns healthy for recently contacted connection', () => {
        const now = new Date();
        const recent = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
        const conn = { name: 'Bob', frequency: 30, lastContact: recent.toISOString() };
        const result = getConnectionStatus(conn);
        expect(result.status).toBe('healthy');
    });

    it('returns overdue when days since contact exceeds frequency', () => {
        const now = new Date();
        const old = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago
        const conn = { name: 'Bob', frequency: 30, lastContact: old.toISOString() };
        const result = getConnectionStatus(conn);
        expect(result.status).toBe('overdue');
        expect(result.overdueBy).toBeGreaterThan(0);
    });

    it('returns due_soon when within 14 days of frequency', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000); // 20 days ago
        const conn = { name: 'Bob', frequency: 30, lastContact: daysAgo.toISOString() };
        const result = getConnectionStatus(conn);
        expect(result.status).toBe('due_soon');
        expect(result.dueIn).toBeDefined();
    });

    it('uses default frequency of 90 when not set', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000); // 50 days ago
        const conn = { name: 'Bob', lastContact: daysAgo.toISOString() };
        const result = getConnectionStatus(conn);
        // 50 days < 90 and 50 < 90-14=76, so healthy
        expect(result.status).toBe('healthy');
    });

    it('handles frequency=0 by defaulting to 90', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000);
        const conn = { name: 'Bob', frequency: 0, lastContact: daysAgo.toISOString() };
        const result = getConnectionStatus(conn);
        // parseInt(0) is falsy so falls back to 90
        expect(result.status).toBe('healthy');
    });

    it('calculates daysDiff correctly', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
        const conn = { name: 'Bob', frequency: 90, lastContact: daysAgo.toISOString() };
        const result = getConnectionStatus(conn);
        expect(result.daysDiff).toBe(10);
    });

    it('calculates overdueBy correctly', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
        const conn = { name: 'Bob', frequency: 30, lastContact: daysAgo.toISOString() };
        const result = getConnectionStatus(conn);
        expect(result.status).toBe('overdue');
        expect(result.overdueBy).toBe(15); // 45 - 30
    });

    it('calculates dueIn correctly', () => {
        const now = new Date();
        const daysAgo = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000); // 25 days ago
        const conn = { name: 'Bob', frequency: 30, lastContact: daysAgo.toISOString() };
        const result = getConnectionStatus(conn);
        expect(result.status).toBe('due_soon');
        expect(result.dueIn).toBe(5); // 30 - 25
    });
});

describe('getSmartReminderMessage', () => {
    it('returns null for healthy connection', () => {
        const conn = { name: 'Bob', frequency: 90 };
        const msg = getSmartReminderMessage(conn);
        expect(msg).toBeNull();
    });

    it('returns reconnect message for heavily overdue (>30 days)', () => {
        const now = new Date();
        const old = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000); // 150 days, overdue by 60
        const conn = { name: 'Alice', frequency: 90, lastContact: old.toISOString() };
        const msg = getSmartReminderMessage(conn);
        expect(msg).toContain("It's been a while");
        expect(msg).toContain('Alice');
    });

    it('returns catch-up message for moderately overdue (<=30 days)', () => {
        const now = new Date();
        const old = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000); // 40 days, overdue by 10
        const conn = { name: 'Bob', frequency: 30, lastContact: old.toISOString() };
        const msg = getSmartReminderMessage(conn);
        expect(msg).toContain('catch up');
        expect(msg).toContain('Bob');
        expect(msg).toContain('30');
    });

    it('returns due_soon message for connection approaching frequency', () => {
        const now = new Date();
        const recent = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
        const conn = { name: 'Bob', frequency: 30, lastContact: recent.toISOString() };
        const msg = getSmartReminderMessage(conn);
        expect(msg).toContain('Follow-up');
        expect(msg).toContain('Bob');
        expect(msg).toContain('days');
    });
});
