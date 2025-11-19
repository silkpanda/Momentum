// =========================================================
// silkpanda/momentum/app/components/quests/QuestItem.tsx
// Individual Quest Card with Actions
// =========================================================
'use client';

import React, { useState } from 'react';
import { Check, Trash, Clock, Zap, Award, User, Repeat, Pencil } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import { IQuest } from './QuestList';
import EditQuestModal from './EditQuestModal';

interface QuestItemProps {
    quest: IQuest;
    onUpdate: (quest: IQuest) => void;
    onDelete: (questId: string) => void;
}

const QuestItem: React.FC<QuestItemProps> = ({ quest, onUpdate, onDelete }) => {
    const { user, token } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isParent = user?.role === 'Parent';
    const isAssignedToMe = quest.claimedBy?.includes(user?._id || '');
    const isCompletedByMe = quest.completedBy?.includes(user?._id || '');

    // Helper to handle API calls
    const handleAction = async (action: 'claim' | 'complete' | 'approve' | 'delete') => {
        setIsLoading(true);
        try {
            let url = `/web-bff/quests/${quest._id}`;
            let method = 'POST';

            if (action === 'delete') {
                method = 'DELETE';
            } else {
                url += `/${action}`;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: action !== 'delete' ? JSON.stringify({ memberId: user?._id }) : undefined,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action} quest`);
            }

            if (action === 'delete') {
                onDelete(quest._id);
            } else {
                const data = await response.json();
                onUpdate(data.data.quest);
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} quest. Please try again.`);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = () => {
        switch (quest.status) {
            case 'active':
                return <span className="px-2 py-1 bg-action-primary/10 text-action-primary text-xs rounded-full font-medium">Active</span>;
            case 'claimed':
                return <span className="px-2 py-1 bg-brand-secondary/10 text-brand-secondary text-xs rounded-full font-medium">Claimed</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-signal-success/10 text-signal-success text-xs rounded-full font-medium">Waiting Approval</span>;
            case 'approved':
                return <span className="px-2 py-1 bg-text-tertiary/10 text-text-tertiary text-xs rounded-full font-medium">Done</span>;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="bg-bg-surface rounded-xl shadow-sm border border-border-subtle p-5 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
                <div>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${quest.questType === 'recurring' ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-action-primary/10 text-action-primary'}`}>
                                {quest.questType === 'recurring' ? <Repeat className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                            </div>
                            <div>
                                <h3 className="font-medium text-text-primary line-clamp-1">{quest.title}</h3>
                                <div className="flex items-center text-xs text-text-secondary mt-0.5">
                                    <Award className="w-3 h-3 mr-1 text-brand-secondary" />
                                    <span className="font-semibold text-brand-secondary">{quest.pointsValue} pts</span>
                                    {quest.recurrence && (
                                        <span className="ml-2 flex items-center">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {quest.recurrence.frequency}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {getStatusBadge()}
                    </div>

                    <p className="text-sm text-text-secondary mb-4 line-clamp-2 min-h-[2.5rem]">
                        {quest.description || "No description provided."}
                    </p>
                </div>

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between">
                    {/* Actions */}
                    <div className="flex space-x-2 w-full">
                        {isParent && (
                            <>
                                {/* Edit button disabled: API does not support updating quests
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    disabled={isLoading}
                                    className="p-2 text-text-tertiary hover:text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors"
                                    title="Edit Quest"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                */}
                                <button
                                    onClick={() => handleAction('delete')}
                                    disabled={isLoading}
                                    className="p-2 text-text-tertiary hover:text-signal-alert hover:bg-signal-alert/10 rounded-lg transition-colors"
                                    title="Delete Quest"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </>
                        )}

                        {/* Parent Approval Action */}
                        {isParent && quest.status === 'completed' && (
                            <button
                                onClick={() => handleAction('approve')}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 bg-signal-success text-white text-sm font-medium rounded-lg hover:bg-signal-success/90 transition-colors"
                            >
                                <Check className="w-4 h-4 mr-1.5" /> Approve
                            </button>
                        )}

                        {/* Member Actions */}
                        {!isParent && quest.status === 'active' && (
                            <button
                                onClick={() => handleAction('claim')}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 bg-action-primary text-white text-sm font-medium rounded-lg hover:bg-action-hover transition-colors"
                            >
                                <User className="w-4 h-4 mr-1.5" /> Claim
                            </button>
                        )}

                        {!isParent && quest.status === 'claimed' && isAssignedToMe && (
                            <button
                                onClick={() => handleAction('complete')}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center px-3 py-2 bg-signal-success text-white text-sm font-medium rounded-lg hover:bg-signal-success/90 transition-colors"
                            >
                                <Check className="w-4 h-4 mr-1.5" /> Complete
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <EditQuestModal
                    quest={quest}
                    onClose={() => setIsEditModalOpen(false)}
                    onQuestUpdated={onUpdate}
                />
            )}
        </>
    );
};

export default QuestItem;
