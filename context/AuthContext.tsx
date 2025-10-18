import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_URLS } from '../constants/api';

const TOKEN_KEY = 'my-jwt';

// Interface for the User object (matches backend)
export interface User {
  _id: string;
  name: string;
  email: string;
  familyId: string;
  role: 'Parent' | 'Child';
  points: number;
  level: number;
  xp: number;
  currentStreak: number;
}

interface AuthContextType {
  token: string | null;
  user: User | null;          // The actual logged-in user
  viewingAs: User | null;     // The user profile being viewed (Parent or Child)
  familyMembers: User[];    // List of all members for hot-swap
  login: (token: string) => void;
  logout: () => void;
  setViewAs: (user: User) => void; // Function to swap profiles
  refreshUserData: () => void;     // Function to refresh points/stats
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
  const [viewingAs, setViewingAs] = useState<User | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Fetches data for the *authenticated* user
  const fetchUser = async (currentToken: string) => {
    try {
      const res = await fetch(API_URLS.USER_ME, {
        headers: { 'x-auth-token': currentToken },
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      
      const userData: User = await res.json();
      setUser(userData);
      setViewingAs(userData); // Default to viewing as self
      
      // After fetching self, fetch the rest of the family
      await fetchFamilyMembers(currentToken); 
      
    } catch (e) {
      console.error('Failed to fetch user, logging out:', e);
      await logout(); // Use await to ensure logout completes
    }
  };

  // Fetches all family members for profile swapping
  const fetchFamilyMembers = async (currentToken: string) => {
    try {
      const res = await fetch(API_URLS.FAMILY_MEMBERS, {
        headers: { 'x-auth-token': currentToken },
      });
      if (!res.ok) throw new Error('Failed to fetch family members');
      const membersData: User[] = await res.json();
      setFamilyMembers(membersData);
    } catch (e) {
      console.error('Failed to fetch family members:', e);
      // Don't log out, app can function without this
    }
  };
  
  // Public function to refresh data (e.g., after redeeming a reward)
  const refreshUserData = async () => {
    if (token) {
      await fetchUser(token);
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
    setIsLoading(true);
    setToken(newToken);
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await fetchUser(newToken); 
    setIsLoading(false);
    router.replace('/(tabs)');
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setViewingAs(null);
    setFamilyMembers([]);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    router.replace('/login');
  };
  
  // The hot-swap function
  const setViewAs = (userToView: User) => {
    setViewingAs(userToView);
  };

  const value = {
    token,
    user,
    viewingAs,
    familyMembers,
    login,
    logout,
    setViewAs,
    refreshUserData,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}