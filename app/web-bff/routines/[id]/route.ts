// =========================================================
// silkpanda/momentum/app/web-bff/routines/[id]/route.ts
// EMBEDDED WEB BFF
// Handle individual routine operations (Update)
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const API_BASE_URL = 'http://localhost:3000/api/v1/routines';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id } = params;

        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': authorization,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ message: data.message || 'Failed to update routine' }, { status: response.status });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
