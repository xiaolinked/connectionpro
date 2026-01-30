import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => {
        // Initialize token from localStorage AND set it on the API immediately
        const storedToken = localStorage.getItem('cp_token');
        if (storedToken) {
            api.setToken(storedToken);  // Set token synchronously to prevent race conditions
        }
        return storedToken;
    });
    const [isLoading, setIsLoading] = useState(true);

    // Track if login() was called to skip the getMe refetch
    const loginCalledRef = useRef(false);

    useEffect(() => {
        const loadUser = async () => {
            // If login() was just called, user is already set - skip getMe
            if (loginCalledRef.current) {
                loginCalledRef.current = false;
                setIsLoading(false);
                return;
            }

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
        loginCalledRef.current = true; // Mark that login was called
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
