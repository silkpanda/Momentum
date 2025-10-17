import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'my-jwt';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
      }
      setIsLoading(false);
    };
    loadToken();
  }, []);

  // --- CORRECTED NAVIGATION LOGIC ---
  useEffect(() => {
    if (isLoading) return; // Wait until token is loaded

    const inApp = segments[0] === '(tabs)';
    
    // Check if the current route is one of the auth screens
    const inAuthScreen = segments[0] === 'login' || segments[0] === 'register';

    if (!token) {
      // User is not logged in.
      if (!inAuthScreen) {
        // If they are not on login or register, redirect them to login.
        router.replace('/login');
      }
      // If they are on login or register, do nothing.
    } else {
      // User is logged in.
      if (inAuthScreen) {
        // If they are on login or register, redirect them into the app.
        router.replace('/(tabs)');
      }
    }
  }, [token, segments, isLoading, router]);

  const login = (newToken: string) => {
    setToken(newToken);
    SecureStore.setItemAsync(TOKEN_KEY, newToken);
    router.replace('/(tabs)');
  };

  const logout = () => {
    setToken(null);
    SecureStore.deleteItemAsync(TOKEN_KEY);
    router.replace('/login');
  };

  const value = {
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}