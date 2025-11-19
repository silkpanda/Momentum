// =========================================================
// silkpanda/momentum/app/routines/page.tsx
// Main Routines Page
// =========================================================
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '../components/layout/SessionContext';
import RoutineList, { IRoutine } from '../components/routines/RoutineList';
import Loading from '../dashboard/loading';
import DashboardLayout from '../components/layout/DashboardLayout';

function RoutinesContent() {
    const { token } = useSession();
    const [routines, setRoutines] = useState<IRoutine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoutines = async () => {
            if (!token) return;

            try {
                const response = await fetch('/web-bff/routines/page-data', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch routines');
                }

                const data = await response.json();
                setRoutines(data.routines);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRoutines();
    }, [token]);

    if (isLoading) return <Loading />;

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-signal-alert mb-2">Error loading routines</div>
                <div className="text-text-secondary">{error}</div>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-3xl font-semibold text-text-primary mb-6">Routines</h1>
            <RoutineList initialRoutines={routines} />
        </>
    );
}

export default function RoutinesPage() {
    return (
        <DashboardLayout>
            <RoutinesContent />
        </DashboardLayout>
    );
}
