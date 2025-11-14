// =========================================================
// silkpanda/momentum/app/web-bff/tasks/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles creating a task (POST)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const API_URL = 'http://localhost:3000/api/v1/tasks';

/**
 * @desc    Create a new task
 * @route   POST /web-bff/tasks
 * @access  Private
 */
export async function POST(req: Request) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await req.json();

        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to create task', error: err.message }, { status: 500 });
    }
}