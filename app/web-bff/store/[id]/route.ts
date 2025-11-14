// =========================================================
// silkpanda/momentum/app/web-bff/store/[id]/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles updating (PATCH) and deleting (DELETE) a store item
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * @desc    Update a store item
 * @route   PATCH /web-bff/store/:id
 * @access  Private
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: itemId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `http://localhost:3000/api/v1/store-items/${itemId}`;

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
        return NextResponse.json({ message: 'BFF Error: Failed to update store item', error: err.message }, { status: 500 });
    }
}

/**
 * @desc    Delete a store item
 * @route   DELETE /web-bff/store/:id
 * @access  Private
 */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: itemId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `http://localhost:3000/api/v1/store-items/${itemId}`;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'DELETE',
            headers: {
                'Authorization': authorization,
            },
        });

        if (apiResponse.status === 204) {
            return new NextResponse(null, { status: 204 });
        }

        const data = await apiResponse.json();
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to delete store item', error: err.message }, { status: 500 });
    }
}