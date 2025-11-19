// =========================================================
// silkpanda/momentum/app/meals/page.tsx
// Main Meals Page
// =========================================================
'use client';

// =========================================================
// silkpanda/momentum/app/meals/page.tsx
// Main Meals Page
// =========================================================
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '../components/layout/SessionContext';
import MealDashboard from '../components/meals/MealDashboard';
import Loading from '../dashboard/loading';
import DashboardLayout from '../components/layout/DashboardLayout';

function MealsContent() {
    const { token } = useSession();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMealsData = async () => {
            if (!token) return;

            try {
                const response = await fetch('/web-bff/meals/page-data', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch meals data');
                }

                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMealsData();
    }, [token]);

    if (isLoading) return <Loading />;

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-signal-alert mb-2">Error loading meals</div>
                <div className="text-text-secondary">{error}</div>
            </div>
        );
    }

    return (
        <MealDashboard
            recipes={data.recipes}
            restaurants={data.restaurants}
            mealPlans={data.mealPlans}
        />
    );
}

export default function MealsPage() {
    return (
        <DashboardLayout>
            <MealsContent />
        </DashboardLayout>
    );
}
