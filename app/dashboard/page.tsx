// =========================================================
// silkpanda/momentum-web/app/dashboard/page.tsx
// Main Dashboard View
// REFACTORED to show high-level stats (Phase 3.5)
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';
import { Suspense } from 'react';
import Loading from './loading'; // Use the existing loading component
import DashboardHome from '../components/dashboard/DashboardHome'; // Import the new component

/**
 * @fileoverview Main dashboard view, now renders the DashboardHome component.
 * @component DashboardPage
 */
export default function DashboardPage() {
    return (
        <DashboardLayout>
            {/* H1 - Title using mandated typography */}
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Family Dashboard
            </h1>

            {/* Wrap the new data-fetching component in Suspense */}
            <Suspense fallback={<Loading />}>
                <DashboardHome />
            </Suspense>

        </DashboardLayout>
    );
}