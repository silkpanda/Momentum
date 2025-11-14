// =========================================================
// silkpanda/momentum/app/web-bff/store/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles creating a new store item (POST)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const API_URL = 'http://localhost:3000/api/v1/store-items';

/**
 * @desc    Create a new store item
 * @route   POST /web-bff/store
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

        // 2. Return the API's response to our client
        return NextResponse.json(data, { status: apiResponse.status });

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to create store item', error: err.message }, { status: 500 });
    }
}