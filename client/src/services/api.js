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
            throw new Error(error.detail || 'Request failed');
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

    async verifyMagicLink(token) {
        return this.fetch(`${API_BASE_URL}/auth/verify?token=${token}`, {
            method: 'POST',
        });
    }

    async getMe() {
        return this.fetch(`${API_BASE_URL}/auth/me`);
    }

    async updateMe(updates) {
        return this.fetch(`${API_BASE_URL}/auth/me`, {
            method: 'PUT',
            body: JSON.stringify(updates),
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
    async getLogs() {
        return this.fetch(`${API_BASE_URL}/logs`);
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
}

export const api = new ApiService();
