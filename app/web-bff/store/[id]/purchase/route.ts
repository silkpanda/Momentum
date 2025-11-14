// =========================================================
// silkpanda/momentum/app/web-bff/store/[id]/purchase/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles purchasing a store item (POST)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

/**
 * @desc    Purchase a store item
 * @route   POST /web-bff/store/:id/purchase
 * @access  Private
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id: itemId } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `http://localhost:3000/api/v1/store-items/${itemId}/purchase`;

    try {
        // 1. Get the body (which contains the memberId)
        const body = await req.json();

        // 2. Forward the POST request to the internal 'momentum-api'
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await apiResponse.json();

        // 3. Return the API's response to our client
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to purchase item', error: err.message }, { status: 500 });
    }
}