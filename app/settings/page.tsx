// =========================================================
// silkpanda/momentum/app/settings/page.tsx
// Placeholder Page for App Settings (Phase 3.5)
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';
import { Suspense } from 'react';
import Loading from './loading'; // Import the new loading file

/**
 * @fileoverview Page wrapper for the Parent Settings UI.
 * @component SettingsPage
 */
export default function SettingsPage() {
    return (
        <DashboardLayout>
            {/* H1 - Title using mandated typography */}
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Settings
            </h1>

            {/* Wrap content in Suspense */}
            <Suspense fallback={<Loading />}>
                <div className="bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle">
                    <h2 className="text-xl font-medium text-text-primary">Momentum Mode</h2>
                    <p className="text-text-secondary mt-2">
                        Controls for toggling gamification elements (streaks, points, etc.) will be implemented here.
                    </p>
                </div>
            </Suspense>

        </DashboardLayout>
    );
}