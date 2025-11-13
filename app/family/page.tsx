// =========================================================
// silkpanda/momentum/app/family/page.tsx
// New "Kiosk" style Family Dashboard Route
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';
import { Suspense } from 'react';
import Loading from '../dashboard/loading';
import FamilyDashboard from '../components/family/FamilyDashboard';

/**
 * @fileoverview Page wrapper for the user-agnostic Family Dashboard.
 * @component FamilyPage
 */
export default function FamilyPage() {
    return (
        <DashboardLayout>
            {/* H1 - Title using mandated typography */}
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Family View
            </h1>
            <p className="text-text-secondary mb-6">Select a family member to view their tasks and rewards.</p>

            {/* Wrap component in Suspense to handle its own data fetching */}
            <Suspense fallback={<Loading />}>
                <FamilyDashboard />
            </Suspense>

        </DashboardLayout>
    );
}