// =========================================================
// silkpanda/momentum/momentum-f93a728fe5c8fecb2f9f6bbd2c2a49cf91a087f2/app/components/layout/DashboardLayout.tsx
// REFACTORED to provide SessionContext
// =========================================================
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Zap, LogOut, Settings, Award } from 'lucide-react';
import Link from 'next/link';
// Import the new SessionContext and UserData interface
import { SessionContext, UserData } from './SessionContext';
import Loading from '../../dashboard/loading';

// --- NavLink Component (Moved outside DashboardLayout) ---
interface NavLinkProps {
    href: string;
    Icon: React.ElementType;
    label: string;
}

const NavLink: React.FC<NavLinkProps> = ({ href, Icon, label }) => (
    <Link
        href={href}
        className="flex items-center space-x-2 p-3 rounded-lg text-text-secondary hover:bg-border-subtle hover:text-action-primary transition-colors"
    >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

// --- Main Dashboard Layout Component ---
const DashboardLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    // State is now for the *entire session*
    const [user, setUser] = useState<UserData | null>(null);
    const [householdId, setHouseholdId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    useEffect(() => {
        // 1. Get the real JWT from secure storage
        const sessionToken = localStorage.getItem('momentum_token');

        if (!sessionToken) {
            // If no token, redirect to login immediately
            router.replace('/login');
            return;
        }

        setToken(sessionToken); // Store the token in state

        // 2. Fetch authenticated user data
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/v1/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`, // Use the real token
                    },
                });

                if (!response.ok) {
                    // Token invalid (expired, bad signature, user deleted), redirect to login
                    localStorage.removeItem('momentum_token'); // Clear the bad token
                    throw new Error('Authentication failed');
                }

                const data = await response.json();

                // Set the state that will be passed to the Context
                //
                setUser(data.data.user);
                setHouseholdId(data.data.householdId);

            } catch (e) {
                console.error('Auth check error:', e);
                router.replace('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleLogout = () => {
        // Clear the token from storage
        localStorage.removeItem('momentum_token');
        // Redirect to home page
        router.replace('/');
    };

    if (loading) {
        // Display the loading page while authentication is in progress
        return <Loading />;
    }

    // If we redirected, the component won't render here.
    // Update check to include all session data
    if (!user || !householdId || !token) {
        // This state can happen briefly before redirect
        return <Loading />;
    }

    return (
        // Wrap the entire layout in the Context Provider
        <SessionContext.Provider value={{ user, householdId, token }}>
            <div className="min-h-screen flex bg-bg-canvas">

                {/* Sidebar Navigation */}
                <aside className="w-64 bg-bg-surface border-r border-border-subtle p-4 flex flex-col justify-between">
                    <div className="space-y-6">
                        {/* Logo/Title */}
                        <div className="text-2xl font-bold text-action-primary flex items-center">
                            <Zap className="w-6 h-6 mr-2" />
                            Momentum
                        </div>

                        {/* User Profile Info */}
                        <div className="pb-4 border-b border-border-subtle">
                            <p className="text-lg font-medium text-text-primary">Welcome, {user.firstName}!</p>
                            <p className="text-sm text-text-secondary">{user.role} Dashboard</p>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="flex flex-col space-y-1">
                            <NavLink href="/dashboard" Icon={LayoutDashboard} label="Dashboard" />
                            {/* MVP Navigation Links (Phase 2.2 - 3.4) */}
                            <NavLink href="/tasks" Icon={Award} label="Tasks" />
                            <NavLink href="/members" Icon={Users} label="Family Members" />
                            <NavLink href="/store" Icon={Award} label="Reward Store" />
                            <NavLink href="/settings" Icon={Settings} label="Settings" />
                        </nav>
                    </div>

                    {/* Logout Link */}
                    <div className="pt-4 border-t border-border-subtle">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-2 p-3 rounded-lg text-signal-alert hover:bg-signal-alert/10 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {/* The child page (e.g., MemberList) is rendered here */}
                        {children}
                    </div>
                </main>
            </div>
        </SessionContext.Provider>
    );
};

export default DashboardLayout;