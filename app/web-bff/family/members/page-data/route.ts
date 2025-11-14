// =========================================================
// silkpanda/momentum/app/web-bff/members/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Manage Members" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Internal API URLs
const HOUSEHOLD_API_URL = 'http://localhost:3000/api/v1/households';
const TASK_API_URL = 'http://localhost:3000/api/v1/tasks';

/**
 * @desc    Get all data for the Member management page
 * @route   GET /web-bff/members/page-data
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
        const [householdResponse, taskResponse] = await Promise.all([
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!householdResponse.ok) throw new Error('Failed to fetch household data');
        if (!taskResponse.ok) throw new Error('Failed to fetch task data');

        const householdData = await householdResponse.json();
        const taskData = await taskResponse.json();

        // 2. Aggregate and return the combined data
        return NextResponse.json({
            memberProfiles: householdData.data.household.memberProfiles || [],
            tasks: taskData.data.tasks || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch member page data', error: err.message }, { status: 500 });
    }
}