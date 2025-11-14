// =========================================================
// silkpanda/momentum/app/web-bff/tasks/[id]/complete/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles marking a task as complete
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * @desc    Mark a task as complete
 * @route   POST /web-bff/tasks/:id/complete
 * @access  Private (via DashboardLayout)
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: taskId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `http://localhost:3000/api/v1/tasks/${taskId}/complete`;

    try {
        const body = await req.json();

        // 1. Forward the POST request to the internal 'momentum-api'
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await apiResponse.json();

        // 2. Return the API's response (or error) to our client
        if (!apiResponse.ok) {
            return NextResponse.json({ message: data.message || 'API Error' }, { status: apiResponse.status });
        }

        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to complete task', error: err.message }, { status: 500 });
    }
}