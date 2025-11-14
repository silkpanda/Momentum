// =========================================================
// silkpanda/momentum/app/web-bff/tasks/page-data/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Aggregates all data for the "Manage Tasks" page
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Internal API URLs
const TASK_API_URL = 'http://localhost:3000/api/v1/tasks';
const HOUSEHOLD_API_URL = 'http://localhost:3000/api/v1/households';

/**
 * @desc    Get all data for the Task management page
 * @route   GET /web-bff/tasks/page-data
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
        const [taskResponse, householdResponse] = await Promise.all([
            fetch(TASK_API_URL, { headers: { 'Authorization': authorization } }),
            fetch(HOUSEHOLD_API_URL, { headers: { 'Authorization': authorization } }),
        ]);

        if (!taskResponse.ok) throw new Error('Failed to fetch tasks');
        if (!householdResponse.ok) throw new Error('Failed to fetch household data');

        const taskData = await taskResponse.json();
        const householdData = await householdResponse.json();

        // 2. Aggregate and return the combined data
        return NextResponse.json({
            tasks: taskData.data.tasks || [],
            householdMembers: householdData.data.household.memberProfiles || [],
        });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to fetch task page data', error: err.message }, { status: 500 });
    }
}