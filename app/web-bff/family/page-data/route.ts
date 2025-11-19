// =========================================================
// silkpanda/momentum/app/web-bff/family/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Family View" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Internal API URLs
const AUTH_ME_URL = 'http://localhost:3000/api/v1/auth/me';
const TASK_API_URL = 'http://localhost:3000/api/v1/tasks';
const STORE_API_URL = 'http://localhost:3000/api/v1/store-items';

/**
 * @desc    Get all data for the Family View page
 * @route   GET /web-bff/family/page-data
 * @access  Private (via DashboardLayout)
 */
export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 1. First, get user data to extract householdId
        const meResponse = await fetch(AUTH_ME_URL, {
            headers: { 'Authorization': authorization }
        });

        if (!meResponse.ok) {
            throw new Error('Failed to fetch user data');
        }

        const meData = await meResponse.json();
        const householdId = meData.data.householdId;

        if (!householdId) {
            throw new Error('No household ID found for user');
        }

        // 2. Make parallel calls to the internal 'momentum-api' with the householdId
        const [householdResponse, taskResponse, storeResponse] = await Promise.all([
            fetch(`http://localhost:3000/api/v1/households/${householdId}`, {
                headers: { 'Authorization': authorization }
            }),
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(STORE_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        // 3. Check all responses
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');
        if (!taskResponse.ok) throw new Error('Failed to fetch task data');
        if (!storeResponse.ok) throw new Error('Failed to fetch store item data');


        // 4. Parse data
        const householdData = await householdResponse.json();
        const taskData = await taskResponse.json();
        const storeData = await storeResponse.json();

        // 5. Aggregate and return the combined data
        return NextResponse.json({
            memberProfiles: householdData.data.memberProfiles || [],
            tasks: taskData.data.tasks || [],
            storeItems: storeData.data.storeItems || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch family page data', error: err.message }, { status: 500 });
    }
}