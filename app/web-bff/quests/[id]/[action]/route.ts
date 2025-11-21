// =========================================================
// silkpanda/momentum/app/web-bff/quests/[id]/[action]/route.ts
// EMBEDDED WEB BFF
// Handles quest actions: claim, complete, approve
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

export async function POST(req: Request, { params }: { params: { id: string, action: string } }) {
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { id, action } = params;

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    const API_URL = `${API_BASE_URL}/quests/${id}/${action}`;

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
        return NextResponse.json({ message: `BFF Error: Failed to ${action} quest`, error: err.message }, { status: 500 });
    }
}
