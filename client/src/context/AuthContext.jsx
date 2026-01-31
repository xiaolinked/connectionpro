
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const token = await firebaseUser.getIdToken();
                    api.setToken(token);

                    // Sync with backend to ensure user exists in DB
                    // This is "login" in terms of backend session
                    await api.login({ token });

                    // Fetch full user profile from our DB
                    const dbUser = await api.getMe();
                    setUser({ ...dbUser, ...firebaseUser });
                } catch (error) {
                    console.error("Failed to sync user with backend:", error);
                    // Force logout if backend sync fails (e.g. server down)
                    // Or keep firebase user but marked as "offline"?
                    // For now, let's allow it but warn.
                    setUser(firebaseUser);
                }
            } else {
                api.setToken(null);
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const loginWithEmail = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const registerWithEmail = (email, password) => {
        return createUserWithEmailAndPassword(auth, email, password);
    };

    const setupRecaptcha = (elementId) => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                }
            });
        }
    };

    const loginWithPhone = (phoneNumber) => {
        return signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    };

    const logout = () => {
        return signOut(auth);
    };

    const updateUser = async (updates) => {
        const updatedUser = await api.updateMe(updates);
        setUser(prev => ({ ...prev, ...updatedUser }));
        return updatedUser;
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            loginWithGoogle,
            loginWithEmail,
            registerWithEmail,
            setupRecaptcha,
            loginWithPhone,
            logout,
            updateUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};
