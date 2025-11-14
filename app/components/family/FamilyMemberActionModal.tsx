// =========================================================
// silkpanda/momentum/app/components/family/FamilyMemberActionModal.tsx
// New unified modal for the "Family View" page.
// REFACTORED (v4) to call Embedded Web BFF
//
// TELA CODICIS FIX: Updated component to use 'assignedToRefs'
// to match the synchronized ITask interface.
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle, CheckSquare, Loader, ShoppingCart, Gift, Package, AlertTriangle, User } from 'lucide-react';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { ITask } from '../tasks/TaskList';
import { IStoreItem } from '../store/StoreItemList';

// --- Props Interface ---
interface FamilyMemberActionModalProps {
    member: IHouseholdMemberProfile;
    allTasks: ITask[];
    allItems: IStoreItem[];
    token: string;
    onClose: () => void;
}

// --- Reusable Task Row Component ---
const MemberTaskItem: React.FC<{
    task: ITask;
    onComplete: () => void;
    isCompleting: boolean;
}> = ({ task, onComplete, isCompleting }) => (
    <li className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-subtle min-h-[68px]">
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Award className="w-4 h-4 text-action-primary" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary">{task.taskName}</p>
                <p className="text-xs text-text-secondary">{task.description || 'No description'}</p>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="text-right">
                <p className="text-sm font-semibold text-signal-success">+{task.pointsValue}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>
            <div className="w-10 text-right">
                {isCompleting ? (
                    <Loader className="w-5 h-5 text-action-primary animate-spin" />
                ) : (
                    <button
                        onClick={onComplete}
                        title={`Mark '${task.taskName}' complete`}
                        className="p-2 text-text-secondary hover:text-signal-success transition-colors"
                    >
                        <CheckSquare className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </li>
);

// --- Reusable Store Item Row Component ---
const MemberStoreItem: React.FC<{
    item: IStoreItem;
    onPurchase: () => void;
    canAfford: boolean;
    isPurchasing: boolean;
}> = ({ item, onPurchase, canAfford, isPurchasing }) => (
    <li className="flex items-center justify-between p-3 bg-bg-surface rounded-lg border border-border-subtle">
        <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Gift className="w-4 h-4 text-action-primary" />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary">{item.itemName}</p>
                <p className="text-xs text-text-secondary">{item.description || 'No description'}</p>
            </div>
        </div>
        <div className="flex items-center space-x-3">
            <div className="text-right">
                <p className="text-sm font-semibold text-signal-success">{item.cost}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>
            <div className="w-10 text-right">
                {isPurchasing ? (
                    <Loader className="w-5 h-5 text-action-primary animate-spin" />
                ) : (
                    <button
                        onClick={onPurchase}
                        disabled={!canAfford}
                        title={canAfford ? "Purchase Item" : "Not enough points"}
                        className="p-2 text-text-secondary hover:text-signal-success transition-colors
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    </li>
);

// --- Main Modal Component ---
const FamilyMemberActionModal: React.FC<FamilyMemberActionModalProps> = ({
    member, allTasks, allItems, token, onClose
}) => {

    // --- Shared State ---
    const [currentView, setCurrentView] = useState<'tasks' | 'store'>('tasks');
    const [currentPoints, setCurrentPoints] = useState(member.pointsTotal);
    const [error, setError] = useState<string | null>(null);

    // --- Task State ---
    const [tasks, setTasks] = useState(allTasks);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

    // --- Store State ---
    const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

    // --- Task Logic ---
    const handleMarkComplete = async (task: ITask) => {
        if (completingTaskId) return;
        setCompletingTaskId(task._id);
        setError(null);

        try {
            // REFACTORED (v4): Call the Embedded BFF endpoint
            const response = await fetch(`/web-bff/tasks/${task._id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ memberId: member.familyMemberId._id }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to complete task.');
            }
            // Optimistically update UI
            setTasks(currentTasks =>
                currentTasks.map(t =>
                    t._id === task._id ? { ...t, isCompleted: true } : t
                )
            );
            // Update points total
            setCurrentPoints(prevPoints => prevPoints + task.pointsValue);

        } catch (e: any) {
            setError(e.message);
        } finally {
            setCompletingTaskId(null);
        }
    };

    const incompleteTasks = tasks.filter(task =>
        !task.isCompleted &&
        task.assignedToRefs.some(profile => profile._id === member.familyMemberId._id) // FIX: Use assignedToRefs
    );

    // --- Store Logic ---
    const handlePurchase = async (item: IStoreItem) => {
        if (purchasingItemId) return;
        if (currentPoints < item.cost) {
            setError("Not enough points.");
            return;
        }
        setPurchasingItemId(item._id);
        setError(null);

        try {
            // REFACTORED (v4): Call the Embedded BFF endpoint
            const response = await fetch(`/web-bff/store/${item._id}/purchase`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ memberId: member.familyMemberId._id }),
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to purchase item.');
            }
            // Update points total
            setCurrentPoints(prevPoints => prevPoints - item.cost);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setPurchasingItemId(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg p-6 bg-bg-canvas rounded-xl shadow-xl border border-border-subtle max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full text-text-secondary hover:bg-border-subtle"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* --- Header --- */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: member.profileColor || '#6B7280' }}
                        >
                            {member.role === 'Parent' ? <User className="w-6 h-6" /> : member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="text-xl font-medium text-text-primary">
                                {member.displayName}
                            </h3>
                            <p className="text-sm text-text-secondary">{member.role}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-semibold text-action-primary">{currentPoints}</p>
                        <p className="text-xs text-text-secondary">Available Points</p>
                    </div>
                </div>

                {/* --- Tabs --- */}
                <div className="flex items-center space-x-2 mb-4">
                    <button
                        onClick={() => setCurrentView('tasks')}
                        className={`py-2 px-4 rounded-lg text-sm font-medium
                            ${currentView === 'tasks'
                                ? 'bg-action-primary text-white'
                                : 'bg-bg-surface text-text-secondary hover:bg-border-subtle'}`}
                    >
                        Tasks ({incompleteTasks.length})
                    </button>
                    <button
                        onClick={() => setCurrentView('store')}
                        className={`py-2 px-4 rounded-lg text-sm font-medium
                            ${currentView === 'store'
                                ? 'bg-action-primary text-white'
                                : 'bg-bg-surface text-text-secondary hover:bg-border-subtle'}`}
                    >
                        Store ({allItems.length})
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <p className="text-sm text-signal-alert mb-2 text-center">{error}</p>
                )}

                {/* --- Content Area --- */}
                <div className="flex-1 overflow-y-auto">
                    {/* --- Tasks View --- */}
                    {currentView === 'tasks' && (
                        <div>
                            {incompleteTasks.length > 0 ? (
                                <ul className="space-y-2">
                                    {incompleteTasks.map(task => (
                                        <MemberTaskItem
                                            key={task._id}
                                            task={task}
                                            onComplete={() => handleMarkComplete(task)}
                                            isCompleting={completingTaskId === task._id}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-text-secondary text-center p-8">
                                    No assigned tasks.
                                </p>
                            )}
                        </div>
                    )}

                    {/* --- Store View --- */}
                    {currentView === 'store' && (
                        <div>
                            {allItems.length > 0 ? (
                                <ul className="space-y-2">
                                    {allItems.map(item => (
                                        <MemberStoreItem
                                            key={item._id}
                                            item={item}
                                            onPurchase={() => handlePurchase(item)}
                                            canAfford={currentPoints >= item.cost}
                                            isPurchasing={purchasingItemId === item._id}
                                        />
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-text-secondary text-center p-8">
                                    No items in the store.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyMemberActionModal;