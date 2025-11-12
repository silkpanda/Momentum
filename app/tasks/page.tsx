// =========================================================
// silkpanda/momentum-web/app/tasks/page.tsx
// Parent Task Management Route
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';
import TaskList from '../components/tasks/TaskList';
import Loading from '../dashboard/loading'; // Import the new loading file
import { Suspense } from 'react';

/**
 * @fileoverview Page wrapper for the Parent Task Management UI.
 * @component TaskPage
 */
export default function TaskPage() {
    return (
        <DashboardLayout>
            {/* H1 - Title using mandated typography */}
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Manage Household Tasks
            </h1>

            {/* Wrap TaskList in Suspense to handle its own data fetching */}
            <Suspense fallback={<Loading />}>
                <TaskList />
            </Suspense>

        </DashboardLayout>
    );
}