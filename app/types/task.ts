// =========================================================
// momentum-web/app/types/task.ts
// Centralized Task Type Definitions
// =========================================================

export interface ITask {
    _id: string;
    title: string;
    description: string;
    pointsValue: number;
    isCompleted: boolean;
    assignedTo: {
        _id: string;
        displayName: string;
        profileColor?: string;
    }[];
    householdRefId: string;
}
