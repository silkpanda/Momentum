// =========================================================
// silkpanda/momentum-web/app/dashboard/loading.tsx
// Loading UI for Protected Routes
// =========================================================
import React from 'react';
import { Loader } from 'lucide-react';

/**
 * @fileoverview A simple, centrally aligned loading screen for protected routes.
 * @component Loading
 */
export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-canvas">
            <div className="flex flex-col items-center p-8 bg-bg-surface rounded-xl shadow-lg">
                {/* Loading Icon uses primary action color and spin animation */}
                <Loader className="w-8 h-8 text-action-primary animate-spin mb-3" />
                <p className="text-text-secondary font-medium">Loading Dashboard...</p>
            </div>
        </div>
    );
}