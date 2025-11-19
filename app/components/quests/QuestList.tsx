// =========================================================
// silkpanda/momentum/app/components/quests/QuestList.tsx
// List of available and active quests
// =========================================================
'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import QuestItem from './QuestItem';
import CreateQuestModal from './CreateQuestModal';

export interface IQuest {
    _id: string;
    title: string;
    description?: string;
    pointsValue: number;
    questType: 'one-time' | 'recurring';
    status: 'active' | 'claimed' | 'completed' | 'approved';
    createdBy: string;
    claimedBy?: string[]; // Array of member IDs who claimed it
    completedBy?: string[]; // Array of member IDs who completed it
    maxClaims?: number;
    dueDate?: string;
    recurrence?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        nextReset: string;
    };
}

interface QuestListProps {
    initialQuests: IQuest[];
}

const QuestList: React.FC<QuestListProps> = ({ initialQuests }) => {
    const { user } = useSession();
    const [quests, setQuests] = useState<IQuest[]>(initialQuests);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'claimed' | 'completed'>('all');

    const handleQuestCreated = (newQuest: IQuest) => {
        setQuests([newQuest, ...quests]);
    };

    const handleQuestUpdated = (updatedQuest: IQuest) => {
        setQuests(quests.map(q => q._id === updatedQuest._id ? updatedQuest : q));
    };

    const handleQuestDeleted = (questId: string) => {
        setQuests(quests.filter(q => q._id !== questId));
    };

    const filteredQuests = quests.filter(quest => {
        if (filter === 'all') return true;
        return quest.status === filter;
    });

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Quests Board</h1>
                    <p className="text-text-secondary">Complete quests to earn extra points!</p>
                </div>

                {user?.role === 'Parent' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-action-primary text-white rounded-lg hover:bg-action-hover transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Quest
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {(['all', 'active', 'claimed', 'completed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors
                            ${filter === f
                                ? 'bg-action-primary text-white'
                                : 'bg-bg-surface text-text-secondary hover:bg-border-subtle'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Quest Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuests.length > 0 ? (
                    filteredQuests.map((quest) => (
                        <QuestItem
                            key={quest._id}
                            quest={quest}
                            onUpdate={handleQuestUpdated}
                            onDelete={handleQuestDeleted}
                        />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 bg-bg-surface rounded-xl border border-border-subtle border-dashed">
                        <div className="mx-auto w-12 h-12 bg-bg-canvas rounded-full flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-text-tertiary" />
                        </div>
                        <h3 className="text-lg font-medium text-text-primary">No quests found</h3>
                        <p className="text-text-secondary">Try adjusting your filters or create a new quest.</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <CreateQuestModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onQuestCreated={handleQuestCreated}
                />
            )}
        </div>
    );
};

export default QuestList;
