# WebSocket Implementation Summary

## Overview
We have successfully integrated real-time WebSocket updates into the Momentum application to improve the user experience, specifically targeting the "jarring" re-renders on the Kiosk Dashboard.

## Key Changes

### 1. Backend (`momentum-api`)
- **`src/controllers/storeItemController.ts`**: 
    - Added `io.emit('store_item_updated', ...)` for `create`, `update`, and `delete` operations.
    - Fixed file corruption issues.
- **`src/controllers/householdController.ts`**:
    - Added `io.emit('household_updated', ...)` for `updateHousehold`, `addMemberToHousehold`, `updateMemberProfile`, and `removeMemberFromHousehold`.
    - Fixed file corruption issues.
- **`src/controllers/transactionController.ts`**:
    - Added `io.emit('member_points_updated', ...)` when a store item is purchased.

### 2. Frontend (`momentum-web`)
- **`lib/socket.ts`**:
    - Defined `StoreItemUpdatedEvent` and `HouseholdUpdatedEvent` interfaces.
    - Added `STORE_ITEM_UPDATED` and `HOUSEHOLD_UPDATED` to `SOCKET_EVENTS`.
- **`app/components/kiosk/KioskDashboard.tsx`**:
    - Removed `fetchData()` from `handleModalClose` to prevent page re-renders.
    - Added `useSocketEvent` listeners for:
        - `SOCKET_EVENTS.STORE_ITEM_UPDATED`: Updates the store inventory list in real-time.
        - `SOCKET_EVENTS.HOUSEHOLD_UPDATED`: Refreshes the dashboard data if the household structure changes (e.g., new member).
        - `SOCKET_EVENTS.MEMBER_POINTS_UPDATED`: (Already present) Updates member points.
        - `SOCKET_EVENTS.TASK_UPDATED`: (Already present) Updates task lists.

### 3. Mobile App (`momentum-mobile`)
- **`src/screens/family/FamilyScreen.tsx`**:
    - Integrated `useSocket` to listen for real-time events.
    - Auto-refreshes dashboard data on `task_updated`, `member_points_updated`, and `household_updated`.
- **`src/constants/socketEvents.ts`**:
    - Defined shared event constants and types.

## Result
The Kiosk Dashboard now updates instantly when data changes on the server (or from another client), without requiring a full page refresh or a manual re-fetch when closing modals. This provides a much smoother, "app-like" feel.
The Mobile App also now listens for these events and stays in sync.

## Next Steps
- **Mobile App Integration**: The `momentum-mobile` app needs to be refactored to listen for these same WebSocket events to ensure it stays in sync with the Kiosk.
- **Authentication**: Currently, the WebSocket connection is open. Future improvements should add authentication (e.g., passing the JWT in the handshake).
