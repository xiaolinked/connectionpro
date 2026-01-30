import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext();

export const useData = () => {
    return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
    const [connections, setConnections] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const { isAuthenticated, isLoading: authLoading } = useAuth();

    // Load connections and logs from API
    useEffect(() => {
        const loadData = async () => {
            if (!isAuthenticated) {
                setConnections([]);
                setLogs([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                // Fetch independently to be resilient
                // Note: API returns paginated responses with { items: [], total, limit, offset }
                const connectionsPromise = api.getConnections()
                    .then(data => setConnections(data.items || data))
                    .catch(err => console.error("Failed to load connections", err));

                const logsPromise = api.getLogs()
                    .then(data => setLogs(data.items || data))
                    .catch(err => console.error("Failed to load logs", err));

                await Promise.all([connectionsPromise, logsPromise]);
            } catch (err) {
                console.error("Critical error in loadData", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading) {
            loadData();
        }
    }, [isAuthenticated, authLoading]);

    const addConnection = async (connection) => {
        try {
            const newConnection = await api.createConnection(connection);
            setConnections((prev) => [...prev, newConnection]);
            return newConnection;
        } catch (err) {
            console.error("Failed to add connection", err);
            throw err;
        }
    };

    const bulkAddConnections = async (newConnections) => {
        for (const conn of newConnections) {
            await addConnection(conn);
        }
    };

    const updateConnection = async (id, updates) => {
        try {
            const updated = await api.updateConnection(id, updates);
            setConnections((prev) =>
                prev.map((c) => (c.id === id ? updated : c))
            );
            return updated;
        } catch (err) {
            console.error("Failed to update connection", err);
            throw err;
        }
    };

    const deleteConnection = async (id) => {
        try {
            await api.deleteConnection(id);
            setConnections((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            console.error("Failed to delete connection", err);
        }
    };

    const addLog = async (log) => {
        try {
            const newLog = await api.createLog({
                connection_id: log.connection_id || log.connectionId || null,
                type: log.type || 'interaction',
                notes: log.notes,
                tags: log.tags || []
            });
            setLogs((prev) => [newLog, ...prev]);

            // Update lastContact on the connection
            const connId = log.connection_id || log.connectionId;
            if (connId) {
                await updateConnection(connId, { lastContact: log.date || new Date().toISOString() });
            }

            return newLog;
        } catch (err) {
            console.error("Failed to add log", err);
            throw err;
        }
    };

    const deleteLog = async (id) => {
        try {
            await api.deleteLog(id);
            setLogs((prev) => prev.filter((l) => l.id !== id));
        } catch (err) {
            console.error("Failed to delete log", err);
        }
    };

    return (
        <DataContext.Provider
            value={{
                connections,
                logs,
                isLoading,
                addConnection,
                bulkAddConnections,
                updateConnection,
                deleteConnection,
                addLog,
                deleteLog,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};
