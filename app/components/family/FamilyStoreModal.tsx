// =========================================================
// silkpanda/momentum/app/components/family/FamilyStoreModal.tsx
// Modal for viewing/purchasing store items as a specific family member.
// =========================================================
'use client';

import React, { useState } from 'react';
import { X, Gift, ShoppingCart, Loader, AlertTriangle, Check } from 'lucide-react';
import { IHouseholdMemberProfile } from '../members/MemberList';
import { IStoreItem } from '../store/StoreItemList';

interface FamilyStoreModalProps {
    member: IHouseholdMemberProfile;
    allItems: IStoreItem[];
    token: string;
    onClose: () => void;
}

// Reusable Store Item Row
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

// Main Modal
const FamilyStoreModal: React.FC<FamilyStoreModalProps> = ({ member, allItems, token, onClose }) => {

    // We need local state for points so it can be updated after a purchase
    const [currentPoints, setCurrentPoints] = useState(member.pointsTotal);
    const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePurchase = async (item: IStoreItem) => {
        if (purchasingItemId) return;
        if (currentPoints < item.cost) {
            setError("Not enough points.");
            return;
        }

        setPurchasingItemId(item._id);
        setError(null);

        try {
            const response = await fetch(`/api/v1/store-items/${item._id}/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ memberId: member.familyMemberId._id }), // <-- Pass selected member's ID
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to purchase item.');
            }

            // On success, update the local points state
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

                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: member.profileColor || '#6B7280' }}
                        >
                            {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-medium text-text-primary">
                            {member.displayName}'s Store
                        </h3>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-semibold text-action-primary">{currentPoints}</p>
                        <p className="text-xs text-text-secondary">Available Points</p>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <p className="text-sm text-signal-alert mb-2 text-center">{error}</p>
                )}

                {/* Store Item List */}
                <div className="flex-1 overflow-y-auto">
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
            </div>
        </div>
    );
};

export default FamilyStoreModal;