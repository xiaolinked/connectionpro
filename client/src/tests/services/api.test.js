import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to mock fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://test-api:8000');

// Dynamic import after mocks are set up
const { api } = await import('../../services/api');

beforeEach(() => {
    mockFetch.mockReset();
    api.setToken(null);
});

function mockResponse(data, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
    };
}

describe('ApiService', () => {
    describe('setToken', () => {
        it('sets the auth token', () => {
            api.setToken('my-token');
            // Token is used in subsequent requests - test via fetch call
            mockFetch.mockResolvedValueOnce(mockResponse({ id: '1' }));
            api.getMe();
            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer my-token',
                    }),
                })
            );
        });

        it('does not send auth header when token is null', () => {
            api.setToken(null);
            mockFetch.mockResolvedValueOnce(mockResponse({ exists: true }));
            api.checkEmail('test@test.com');
            const callHeaders = mockFetch.mock.calls[0][1].headers;
            expect(callHeaders.Authorization).toBeUndefined();
        });
    });

    describe('Auth methods', () => {
        it('checkEmail sends GET with email param', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ exists: true }));
            const result = await api.checkEmail('user@test.com');
            expect(result.exists).toBe(true);
            expect(mockFetch.mock.calls[0][0]).toContain('/auth/check-email?email=user%40test.com');
        });

        it('register sends POST with name and email', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ magic_link: 'http://...' }));
            const result = await api.register('John Doe', 'john@test.com');
            expect(result.magic_link).toBe('http://...');
            const callArgs = mockFetch.mock.calls[0];
            expect(callArgs[1].method).toBe('POST');
            expect(JSON.parse(callArgs[1].body)).toEqual({
                name: 'John Doe',
                email: 'john@test.com',
            });
        });

        it('verifyMagicLink sends POST with token in body', async () => {
            mockFetch.mockResolvedValueOnce(
                mockResponse({ access_token: 'jwt-123', user: { id: '1' } })
            );
            const result = await api.verifyMagicLink('magic-token');
            expect(result.access_token).toBe('jwt-123');
            const callArgs = mockFetch.mock.calls[0];
            expect(callArgs[0]).toContain('/auth/verify');
            expect(callArgs[1].method).toBe('POST');
            expect(JSON.parse(callArgs[1].body)).toEqual({ token: 'magic-token' });
        });

        it('getMe sends GET to /users/me', async () => {
            api.setToken('valid-token');
            mockFetch.mockResolvedValueOnce(
                mockResponse({ id: '1', name: 'John', email: 'john@test.com' })
            );
            const result = await api.getMe();
            expect(result.name).toBe('John');
            expect(mockFetch.mock.calls[0][0]).toContain('/users/me');
        });

        it('updateMe sends PUT to /users/me with updates', async () => {
            api.setToken('valid-token');
            mockFetch.mockResolvedValueOnce(
                mockResponse({ id: '1', name: 'Updated Name', email: 'john@test.com' })
            );
            const result = await api.updateMe({ name: 'Updated Name' });
            expect(result.name).toBe('Updated Name');
            expect(mockFetch.mock.calls[0][0]).toContain('/users/me');
            expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
            expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ name: 'Updated Name' });
        });
    });

    describe('Connection methods', () => {
        beforeEach(() => api.setToken('valid-token'));

        it('getConnections sends GET', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse([{ id: '1', name: 'Alice' }]));
            const result = await api.getConnections();
            expect(result).toHaveLength(1);
            expect(mockFetch.mock.calls[0][0]).toContain('/connections');
        });

        it('getConnection sends GET with id', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ id: 'c1', name: 'Bob' }));
            const result = await api.getConnection('c1');
            expect(result.name).toBe('Bob');
            expect(mockFetch.mock.calls[0][0]).toContain('/connections/c1');
        });

        it('createConnection sends POST with data', async () => {
            const newConn = { name: 'New Person', company: 'Corp' };
            mockFetch.mockResolvedValueOnce(mockResponse({ id: 'c2', ...newConn }));
            const result = await api.createConnection(newConn);
            expect(result.name).toBe('New Person');
            expect(mockFetch.mock.calls[0][1].method).toBe('POST');
        });

        it('updateConnection sends PUT with id and updates', async () => {
            mockFetch.mockResolvedValueOnce(
                mockResponse({ id: 'c1', name: 'Updated' })
            );
            const result = await api.updateConnection('c1', { name: 'Updated' });
            expect(result.name).toBe('Updated');
            expect(mockFetch.mock.calls[0][1].method).toBe('PUT');
            expect(mockFetch.mock.calls[0][0]).toContain('/connections/c1');
        });

        it('deleteConnection sends DELETE and returns true for 204', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 204,
                json: () => Promise.resolve(null),
            });
            const result = await api.deleteConnection('c1');
            expect(result).toBe(true);
            expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
        });
    });

    describe('Log methods', () => {
        beforeEach(() => api.setToken('valid-token'));

        it('getLogs sends GET', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse([{ id: 'l1', notes: 'test' }]));
            const result = await api.getLogs();
            expect(result).toHaveLength(1);
        });

        it('createLog sends POST with log data', async () => {
            const logData = { notes: 'Had a meeting', type: 'meeting' };
            mockFetch.mockResolvedValueOnce(mockResponse({ id: 'l2', ...logData }));
            const result = await api.createLog(logData);
            expect(result.notes).toBe('Had a meeting');
            expect(mockFetch.mock.calls[0][1].method).toBe('POST');
        });

        it('deleteLog sends DELETE', async () => {
            mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) });
            const result = await api.deleteLog('l1');
            expect(result).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('throws on 401 Unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ detail: 'Invalid token' }),
            });
            await expect(api.getMe()).rejects.toThrow('Unauthorized');
        });

        it('throws error detail on non-ok response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ detail: 'Bad request data' }),
            });
            await expect(api.checkEmail('bad')).rejects.toThrow('Bad request data');
        });

        it('throws generic error when response body is not JSON', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.reject(new Error('not json')),
            });
            await expect(api.getConnections()).rejects.toThrow('An error occurred');
        });
    });

    describe('enrichLinkedin', () => {
        beforeEach(() => api.setToken('valid-token'));

        it('polls until success', async () => {
            // First call: POST /enrich returns task_id
            mockFetch.mockResolvedValueOnce(mockResponse({ task_id: 'task-1' }));
            // Second call: GET /tasks/task-1 returns Pending
            mockFetch.mockResolvedValueOnce(mockResponse({ status: 'Pending' }));
            // Third call: GET /tasks/task-1 returns Success
            mockFetch.mockResolvedValueOnce(
                mockResponse({
                    status: 'Success',
                    data: { name: 'John', role: 'Dev', company: 'Acme', location: 'SF', industry: '' },
                })
            );

            const result = await api.enrichLinkedin('https://linkedin.com/in/john');
            expect(result.name).toBe('John');
            expect(mockFetch).toHaveBeenCalledTimes(3);
        });

        it('throws on task failure', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ task_id: 'task-2' }));
            mockFetch.mockResolvedValueOnce(
                mockResponse({ status: 'Failure', error: 'Scraping blocked' })
            );

            await expect(
                api.enrichLinkedin('https://linkedin.com/in/blocked')
            ).rejects.toThrow('Scraping blocked');
        });
    });

    // Regression tests: Ensure API endpoints match backend routes
    // These tests prevent drift between frontend API calls and backend route definitions
    describe('Endpoint path regression tests', () => {
        beforeEach(() => api.setToken('valid-token'));

        // CRITICAL: getMe must call /users/me, NOT /auth/me
        // The backend defines the endpoint at /users/me but frontend was incorrectly calling /auth/me
        // This caused 404 errors which triggered spurious logouts
        it('REGRESSION: getMe calls /users/me not /auth/me', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ id: '1' }));
            await api.getMe();
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('/users/me');
            expect(url).not.toContain('/auth/me');
        });

        it('REGRESSION: updateMe calls /users/me not /auth/me', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ id: '1' }));
            await api.updateMe({ name: 'Test' });
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('/users/me');
            expect(url).not.toContain('/auth/me');
        });

        // Ensure auth endpoints use correct paths
        it('verifyMagicLink calls /auth/verify with POST', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ access_token: 'token' }));
            await api.verifyMagicLink('token');
            const url = mockFetch.mock.calls[0][0];
            expect(url).toContain('/auth/verify');
            expect(mockFetch.mock.calls[0][1].method).toBe('POST');
        });

        it('checkEmail calls /auth/check-email', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ exists: true }));
            await api.checkEmail('test@test.com');
            expect(mockFetch.mock.calls[0][0]).toContain('/auth/check-email');
        });

        it('register calls /auth/register', async () => {
            mockFetch.mockResolvedValueOnce(mockResponse({ magic_link: 'link' }));
            await api.register('Name', 'email@test.com');
            expect(mockFetch.mock.calls[0][0]).toContain('/auth/register');
        });
    });

    describe('Error handling', () => {
        it('throws Unauthorized error on 401 response', async () => {
            api.setToken('expired-token');
            mockFetch.mockResolvedValueOnce(mockResponse({}, 401));
            await expect(api.getMe()).rejects.toThrow('Unauthorized');
        });

        it('throws error with detail message from server', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ detail: 'Invalid request' }),
            });
            await expect(api.checkEmail('bad')).rejects.toThrow('Invalid request');
        });

        it('handles object error details by stringifying them', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 422,
                json: () => Promise.resolve({ detail: [{ msg: 'field required' }] }),
            });
            await expect(api.checkEmail('bad')).rejects.toThrow('[{"msg":"field required"}]');
        });
    });
});
