const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
    constructor() {
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async fetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            // Handle unauthorized - potentially clear token and redirect
            // Since this is a service, we'll let the context handle logout if needed
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            // Ensure error message is a string
            let errorMessage = error.detail || 'Request failed';
            if (typeof errorMessage === 'object') {
                errorMessage = JSON.stringify(errorMessage);
            }
            throw new Error(errorMessage);
        }

        if (response.status === 204) return true;
        return response.json();
    }

    // ===== AUTH METHODS =====
    async checkEmail(email) {
        return this.fetch(`${API_BASE_URL}/auth/check-email?email=${encodeURIComponent(email)}`);
    }

    async register(name, email) {
        return this.fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({ name, email }),
        });
    }

    async sendLoginLink(email) {
        return this.fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async verifyMagicLink(token) {
        // Must send token in body as per backend expectation
        return this.fetch(`${API_BASE_URL}/auth/verify`, {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async getMe() {
        return this.fetch(`${API_BASE_URL}/users/me`);
    }

    async updateMe(updates) {
        return this.fetch(`${API_BASE_URL}/users/me`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async deleteMe() {
        return this.fetch(`${API_BASE_URL}/users/me`, {
            method: 'DELETE',
        });
    }

    // ===== CONNECTION METHODS =====
    async getConnections() {
        return this.fetch(`${API_BASE_URL}/connections`);
    }

    async getConnection(id) {
        return this.fetch(`${API_BASE_URL}/connections/${id}`);
    }

    async createConnection(connectionData) {
        return this.fetch(`${API_BASE_URL}/connections`, {
            method: 'POST',
            body: JSON.stringify(connectionData)
        });
    }

    async updateConnection(id, updates) {
        return this.fetch(`${API_BASE_URL}/connections/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteConnection(id) {
        return this.fetch(`${API_BASE_URL}/connections/${id}`, {
            method: 'DELETE'
        });
    }

    async enrichLinkedin(url) {
        // Enrichment uses a query param, we'll use the internal fetch for auth
        const response = await this.fetch(`${API_BASE_URL}/enrich?linkedin_url=${encodeURIComponent(url)}`, {
            method: 'POST'
        });

        // The server returns task_id, we need to poll
        const { task_id } = response;

        // Poll for result
        for (let i = 0; i < 15; i++) { // Retry 15 times
            await new Promise(r => setTimeout(r, 1000));
            const statusRes = await this.fetch(`${API_BASE_URL}/tasks/${task_id}`);
            if (statusRes.status === 'Success') return statusRes.data;
            if (statusRes.status === 'Failure') throw new Error(statusRes.error);
        }
        throw new Error('Enrichment timed out');
    }

    // ===== LOG METHODS =====
    async getLogs(limit = 20) {
        // For dashboard - just fetch recent logs
        return this.fetch(`${API_BASE_URL}/logs?limit=${limit}`);
    }

    async getLogsByConnection(connectionId) {
        // Fetch all logs for a specific connection
        return this.fetch(`${API_BASE_URL}/logs?connection_id=${connectionId}&limit=500`);
    }

    async createLog(logData) {
        return this.fetch(`${API_BASE_URL}/logs`, {
            method: 'POST',
            body: JSON.stringify(logData)
        });
    }

    async deleteLog(id) {
        return this.fetch(`${API_BASE_URL}/logs/${id}`, {
            method: 'DELETE'
        });
    }

    // ===== TAGS METHODS =====
    async getTags(type) {
        return this.fetch(`${API_BASE_URL}/tags/${type}`);
    }
}

export const api = new ApiService();
