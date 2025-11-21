// =========================================================
// momentum-web/app/components/layout/SessionProvider.tsx
// Session Provider - Manages authentication state
// =========================================================
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { SessionContext, UserData } from './SessionContext';

export function SessionProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        console.log('[SessionProvider] Initializing');
        // Load token from localStorage
        const storedToken = localStorage.getItem('momentum_token');
        console.log('[SessionProvider] Stored token:', !!storedToken);

        if (storedToken) {
            setToken(storedToken);

            // Fetch user data
            console.log('[SessionProvider] Fetching user data');
            fetch('/web-bff/auth/me', {
                headers: { 'Authorization': `Bearer ${storedToken}` }
            })
                .then(res => {
                    console.log('[SessionProvider] Auth response status:', res.status);
                    if (!res.ok) throw new Error('Auth failed');
                    return res.json();
                })
                .then(data => {
                    console.log('[SessionProvider] User data received:', data);
                    // API returns { status: "success", data: { user, householdId } }
                    if (data.data && data.data.user && data.data.householdId) {
                        console.log('[SessionProvider] Setting user:', data.data.user);
                        setUser(data.data.user);
                        setHouseholdId(data.data.householdId);
                    } else {
                        console.error('[SessionProvider] Invalid data structure:', data);
                    }
                })
                .catch(err => {
                    console.error('[SessionProvider] Error fetching user:', err);
                    // Clear invalid token
                    localStorage.removeItem('momentum_token');
                    setToken(null);
                });
        } else {
            console.log('[SessionProvider] No token found');
        }
    }, []);

    console.log('[SessionProvider] Rendering - user:', !!user, 'token:', !!token, 'householdId:', householdId);

    return (
        <SessionContext.Provider value={{ user, householdId, token }}>
            {children}
        </SessionContext.Provider>
    );
}
