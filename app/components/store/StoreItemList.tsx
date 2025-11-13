// =========================================================
// silkpanda/momentum/app/components/store/StoreItemList.tsx
// Renders the list of store items and handles CRUD.
// =========================================================
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader, AlertTriangle, Plus, Trash, Edit, ShoppingCart, Gift } from 'lucide-react';
import { useSession } from '../layout/SessionContext';
import CreateStoreItemModal from './CreateStoreItemModal';
import EditStoreItemModal from './EditStoreItemModal';
import DeleteStoreItemModal from './DeleteStoreItemModal';

// --- Interface ---
//
export interface IStoreItem {
    _id: string;
    itemName: string;
    description: string;
    costInPoints: number;
    householdRefId: string;
}

// --- Store Item Component ---
const StoreItem: React.FC<{
    item: IStoreItem;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ item, onEdit, onDelete }) => (
    <li className="flex items-center justify-between p-4 bg-bg-surface rounded-lg shadow border border-border-subtle">
        <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 bg-action-primary/10 p-2 rounded-lg">
                <Gift className="w-5 h-5 text-action-primary" />
            </div>
            <div>
                <p className="text-base font-medium text-text-primary">{item.itemName}</p>
                <p className="text-sm text-text-secondary">{item.description || 'No description'}</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="text-center">
                <p className="text-lg font-semibold text-signal-success">{item.costInPoints}</p>
                <p className="text-xs text-text-secondary">Points</p>
            </div>

            {/* Actions */}
            <button onClick={onEdit} className="p-2 text-text-secondary hover:text-action-primary transition-colors" title="Edit Item">
                <Edit className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="p-2 text-text-secondary hover:text-signal-alert transition-colors" title="Delete Item">
                <Trash className="w-4 h-4" />
            </button>
        </div>
    </li>
);

// --- Main Store Item List Component ---
const StoreItemList: React.FC = () => {
    const [items, setItems] = useState<IStoreItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<IStoreItem | null>(null);

    const { token } = useSession();

    const fetchItems = useCallback(async () => {
        if (!token) {
            setError('Session invalid. Please log in again.');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            //
            const response = await fetch(`/api/v1/store-items`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch store items.');
            }
            const data = await response.json();
            if (data.status === 'success') {
                setItems(data.data.storeItems || []);
                setError(null);
            } else {
                throw new Error(data.message || 'Could not retrieve items.');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleItemCreated = () => {
        fetchItems(); // Re-fetch all items
    };

    const handleItemUpdated = () => {
        fetchItems(); // Re-fetch all items
    };

    const handleItemDeleted = () => {
        fetchItems(); // Re-fetch all items
    };

    // Click Handlers for opening modals
    const openEditModal = (item: IStoreItem) => {
        setSelectedItem(item);
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (item: IStoreItem) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex justify-center items-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                <Loader className="w-6 h-6 text-action-primary animate-spin" />
                <p className="ml-3 text-text-secondary">Loading items...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-border-subtle">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <p className="text-sm font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header and "Add Item" Button */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-text-secondary">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'} in Store
                    {loading && <Loader className="w-4 h-4 ml-2 inline animate-spin" />}
                </h2>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center rounded-lg py-2 px-4 text-sm font-medium shadow-sm 
                     bg-action-primary text-white transition-all duration-200 
                     hover:bg-action-hover focus:ring-4 focus:ring-action-primary/50"
                >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add New Item
                </button>
            </div>

            {/* Render Item List */}
            {items.length > 0 ? (
                <ul className="space-y-4">
                    {items.map((item) => (
                        <StoreItem
                            key={item._id}
                            item={item}
                            onEdit={() => openEditModal(item)}
                            onDelete={() => openDeleteModal(item)}
                        />
                    ))}
                </ul>
            ) : (
                <div className="text-center p-8 bg-bg-surface rounded-lg shadow-md border border-border-subtle">
                    <ShoppingCart className="w-12 h-12 mx-auto text-text-secondary/50" />
                    <p className="mt-4 text-text-secondary">No items found in your store.</p>
                    <p className="text-sm text-text-secondary/80">Click "Add New Item" to create rewards.</p>
                </div>
            )}

            {/* Conditionally render the modals */}
            {isCreateModalOpen && (
                <CreateStoreItemModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onItemCreated={handleItemCreated}
                />
            )}

            {isEditModalOpen && selectedItem && (
                <EditStoreItemModal
                    item={selectedItem}
                    onClose={() => setIsEditModalOpen(false)}
                    onItemUpdated={handleItemUpdated}
                />
            )}

            {isDeleteModalOpen && selectedItem && (
                <DeleteStoreItemModal
                    item={selectedItem}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onItemDeleted={handleItemDeleted}
                />
            )}
        </div>
    );
};

export default StoreItemList;