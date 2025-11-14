// =========================================================
// silkpanda/momentum/app/web-bff/dashboard-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the main dashboard
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Internal API URLs
const HOUSEHOLD_API_URL = 'http://localhost:3000/api/v1/households';
const TASK_API_URL = 'http://localhost:3000/api/v1/tasks';
const STORE_API_URL = 'http://localhost:3000/api/v1/store-items';

/**
 * @desc    Get all data for the dashboard
 * @route   GET /web-bff/dashboard-data
 * @access  Private (via DashboardLayout)
 */
export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 1. Make parallel calls to the internal 'momentum-api'
        const [householdResponse, taskResponse, storeResponse] = await Promise.all([
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(STORE_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        // 2. Check all responses
        if (!householdResponse.ok || !taskResponse.ok || !storeResponse.ok) {
            throw new Error('Failed to fetch one or more dashboard resources from internal API');
        }

        // 3. Parse data
        const householdData = await householdResponse.json();
        const taskData = await taskResponse.json();
        const storeData = await storeResponse.json();

        // 4. Aggregate and return the combined data
        return NextResponse.json({
            members: householdData.data.household.memberProfiles || [],
            tasks: taskData.data.tasks || [],
            storeItems: storeData.data.storeItems || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch dashboard data', error: err.message }, { status: 500 });
    }
}