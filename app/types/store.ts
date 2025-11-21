// =========================================================
// momentum-web/app/types/store.ts
// Centralized Store Item Type Definitions
// =========================================================

export interface IStoreItem {
    _id: string;
    itemName: string;
    description: string;
    cost: number;
    householdRefId: string;
}
