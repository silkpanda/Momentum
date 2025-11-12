// =========================================================
// silkpanda/momentum-web/app/members/loading.tsx
// Loading UI for the Members page
// =========================================================
import React from 'react';
import { Loader } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
            <Loader className="w-6 h-6 text-action-primary animate-spin" />
            <p className="ml-3 text-text-secondary">Loading family members...</p>
        </div>
    );
}