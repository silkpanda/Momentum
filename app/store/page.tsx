// =========================================================
// silkpanda/momentum/app/store/page.tsx
// Parent Reward Store Management Route (Phase 3.4)
// =========================================================
import DashboardLayout from '../components/layout/DashboardLayout';
import StoreItemList from '../components/store/StoreItemList';
import Loading from './loading'; // We will create this next
import { Suspense } from 'react';

/**
 * @fileoverview Page wrapper for the Parent Store Management UI.
 * @component StorePage
 */
export default function StorePage() {
    return (
        <DashboardLayout>
            <h1 className="text-3xl font-semibold text-text-primary mb-6">
                Manage Reward Store
            </h1>

            <Suspense fallback={<Loading />}>
                <StoreItemList />
            </Suspense>

        </DashboardLayout>
    );
}