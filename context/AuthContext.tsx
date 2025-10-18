import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URLS } from '../constants/api'; // Import API URLs

const TOKEN_KEY = 'my-jwt';

// --- MODIFICATION: Update User type ---
interface User {
  _id: string;
  name: string;
  email: string;
  familyId: string;
  role: 'Parent' | 'Child';
  points: number;
  level: number;
  xp: number;
  currentStreak: number; // <-- ADDED THIS PROPERTY
}
// --- END MODIFICATION ---

interface AuthContextType {
  token: string | null;
  user: User | null; 
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
  const [user, setUser] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const fetchUser = async (currentToken: string) => {
    try {
      const res = await fetch(API_URLS.USER_ME, {
        headers: { 'x-auth-token': currentToken },
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const userData: User = await res.json();
      setUser(userData);
    } catch (e) {
      console.error('Failed to fetch user, logging out:', e);
      logout();
    }
  };

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          await fetchUser(storedToken);
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

  // Navigation logic (no changes)
  useEffect(() => {
    if (isLoading) return; 
    const inApp = segments[0] === '(tabs)';
    const inAuthScreen = segments[0] === 'login' || segments[0] === 'register';

    if (!token) {
      if (!inAuthScreen) {
        router.replace('/login');
      }
    } else {
      if (inAuthScreen) {
        router.replace('/(tabs)');
      }
    }
  }, [token, segments, isLoading, router]);

  const login = async (newToken: string) => {
    setToken(newToken);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await fetchUser(newToken); 
    router.replace('/(tabs)');
  };

  const logout = () => {
    setToken(null);
    setUser(null); 
    SecureStore.deleteItemAsync(TOKEN_KEY);
    router.replace('/login');
  };

  const value = {
    token,
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}