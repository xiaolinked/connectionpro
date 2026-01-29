import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('cp_token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    // Update API with token for all subsequent requests
                    api.setToken(token);
                    const userData = await api.getMe();
                    setUser(userData);
                } catch (err) {
                    console.error("Auth verification failed", err);
                    logout();
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, [token]);

    const login = (newToken, userData) => {
        localStorage.setItem('cp_token', newToken);
        setToken(newToken);
        setUser(userData);
        api.setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('cp_token');
        setToken(null);
        setUser(null);
        api.setToken(null);
    };

    const updateUser = async (updates) => {
        const updatedUser = await api.updateMe(updates);
        setUser(updatedUser);
        return updatedUser;
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
