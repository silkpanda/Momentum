// =========================================================
// silkpanda/momentum-web/app/dashboard/page.tsx
// Main Dashboard View
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';

/**
 * @fileoverview Placeholder for the main dashboard view content.
 * @component DashboardPage
 */
export default function DashboardPage() {
    return (
        <DashboardLayout>
            {/* H1 - Title using mandated typography */}
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Family Dashboard
            </h1>

            {/* Placeholder for future content blocks (e.g., stats, task summary) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Card Placeholder (Following mandate for bg-bg-surface, shadow, border) */}
                <div className="bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle">
                    <h2 className="text-xl font-medium text-text-primary">Point Totals</h2>
                    <p className="text-text-secondary mt-2">Family point data will go here.</p>
                </div>

                <div className="lg:col-span-2 bg-bg-surface p-6 rounded-lg shadow-md border border-border-subtle">
                    <h2 className="text-xl font-medium text-text-primary">Today's Tasks Summary</h2>
                    <p className="text-text-secondary mt-2">A feed of active, uncompleted tasks will be loaded here.</p>
                </div>

            </div>
        </DashboardLayout>
    );
}