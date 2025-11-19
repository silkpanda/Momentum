// =========================================================
// silkpanda/momentum/app/quests/page.tsx
// Main Quests Page
// =========================================================
'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '../components/layout/SessionContext';
import QuestList, { IQuest } from '../components/quests/QuestList';
import Loading from '../dashboard/loading';
import DashboardLayout from '../components/layout/DashboardLayout';

function QuestsContent() {
    const { token } = useSession();
    const [quests, setQuests] = useState<IQuest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuests = async () => {
            if (!token) return;

            try {
                const response = await fetch('/web-bff/quests/page-data', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch quests');
                }

                const data = await response.json();
                setQuests(data.quests);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuests();
    }, [token]);

    if (isLoading) return <Loading />;

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-signal-alert mb-2">Error loading quests</div>
                <div className="text-text-secondary">{error}</div>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-3xl font-semibold text-text-primary mb-6">Quests</h1>
            <QuestList initialQuests={quests} />
        </>
    );
}

export default function QuestsPage() {
    return (
        <DashboardLayout>
            <QuestsContent />
        </DashboardLayout>
    );
}
