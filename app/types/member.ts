// =========================================================
// momentum-web/app/types/member.ts
// Centralized Member Type Definitions
// =========================================================

export interface IHouseholdMemberProfile {
    _id: string;
    familyMemberId: {
        _id: string;
        firstName: string;
        lastName: string;
        role: 'Parent' | 'Child';
    };
    displayName: string;
    profileColor: string;
    pointsTotal: number;
    role: 'Parent' | 'Child';
    focusModeEnabled?: boolean;
}
