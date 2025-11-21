// =========================================================
// silkpanda/momentum/app/web-bff/meals/plans/route.ts
// EMBEDDED WEB BFF
// Handles creating a new meal plan
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

const API_URL = `${API_BASE_URL}/meals/plans`;

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
        return NextResponse.json({ message: 'BFF Error: Failed to create meal plan', error: err.message }, { status: 500 });
    }
}
