// =========================================================
// silkpanda/momentum/app/web-bff/tasks/[id]/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles updating (PATCH) and deleting (DELETE) a single task
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * @desc    Update a task
 * @route   PATCH /web-bff/tasks/:id
 * @access  Private
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: taskId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `http://localhost:3000/api/v1/tasks/${taskId}`;

    try {
        const body = await req.json();

        const apiResponse = await fetch(API_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to update task', error: err.message }, { status: 500 });
    }
}

/**
 * @desc    Delete a task
 * @route   DELETE /web-bff/tasks/:id
 * @access  Private
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: taskId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `http://localhost:3000/api/v1/tasks/${taskId}`;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Authorization': authorization,
            },
        });

        // DELETE often returns 204 No Content, which has no JSON body
        if (apiResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to delete task', error: err.message }, { status: 500 });
    }
}