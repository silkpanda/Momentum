// =========================================================
// silkpanda/momentum-web/components/layout/DashboardLayout.tsx
// Protected Parent Dashboard Layout (Phase 2.3)
// =========================================================
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Zap, LogOut, Settings, Award } from 'lucide-react';
import Link from 'next/link';
// Import loading component with correct relative path
import Loading from '../../dashboard/loading';

// Simulated User Data (Based on API response from /auth/me)
interface UserData {
    firstName: string;
    role: 'Parent' | 'Child';
    householdId: string;
}

interface NavLinkProps {
    href: string;
    Icon: React.ElementType;
    label: string;
}

// --- Navigation Link Component ---
const NavLink: React.FC<NavLinkProps> = ({ href, Icon, label }) => (
    <Link
        href={href}
        className="flex items-center space-x-2 p-3 rounded-lg text-text-secondary hover:bg-border-subtle hover:text-action-primary transition-colors"
    >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{label}</span>
    </Link>
);


const DashboardLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 1. [FIX] Get the REAL token from localStorage
        const token = localStorage.getItem('momentum_token');

        if (!token) {
            // If no token, redirect to login immediately
            router.replace('/login');
            return;
        }

        // 2. Fetch authenticated user data
        const fetchUser = async () => {
            try {
                // NOTE: The request URL /api/v1/auth/me is correct.
                // The next.config.mjs rewrite will proxy this to http://localhost:3000
                const response = await fetch('/api/v1/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    // Token invalid (expired, bad signature, user deleted), redirect to login
                    throw new Error('Authentication failed');
                }

                const data = await response.json();
                // The API returns data.user and data.householdId
                setUser({
                    firstName: data.data.user.firstName,
                    role: data.data.user.role,
                    householdId: data.data.householdId,
                });
            } catch (e) {
                console.error('Auth check error:', e);
                router.replace('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    if (loading) {
        // Display the loading page while authentication is in progress
        return <Loading />;
    }

    // If we redirected, the component won't render here.
    if (!user) return null;

    // --- Main Layout Structure ---
    return (
        // Outer canvas wrapper (bg-bg-canvas)
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
                        onClick={() => router.replace('/')}
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
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;