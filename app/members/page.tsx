// =========================================================
// silkpanda/momentum-web/app/members/page.tsx
// Parent Family Member Management Route (Phase 2.2)
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';
import MemberList from '../components/members/MemberList';
import Loading from './loading'; // We'll create this next
import { Suspense } from 'react';

/**
 * @fileoverview Page wrapper for the Parent Member Management UI.
 * @component MemberPage
 */
export default function MemberPage() {
    return (
        <DashboardLayout>
            {/* H1 - Title using mandated typography */}
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Manage Family Members
            </h1>

            {/* Wrap MemberList in Suspense to handle its own data fetching */}
            <Suspense fallback={<Loading />}>
                <MemberList />
            </Suspense>

        </DashboardLayout>
    );
}