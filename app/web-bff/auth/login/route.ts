// =========================================================
// silkpanda/momentum/app/web-bff/auth/login/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles Parent login
// =========================================================
import { NextResponse } from 'next/server';
import { API_BASE_URL } from '@/lib/config';

// This is our internal API's URL.
const API_URL = `${API_BASE_URL}/auth/login`;

/**
 * @desc    Handle Parent Login
 * @route   POST /web-bff/auth/login
 * @access  Public
 */
export async function POST(req: Request) {
    try {
        // 1. Get the body from our frontend client (LoginForm.tsx)
        const body = await req.json();

        // 2. Forward the request to the internal 'momentum-api'
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await apiResponse.json();

        // 3. Return the API's response (or error) back to our frontend client
        if (!apiResponse.ok) {
            return NextResponse.json({ message: data.message || 'API Error' }, { status: apiResponse.status });
        }

        // 4. Send the successful response (including the JWT) to the client
        return NextResponse.json(data);

    } catch (err: any) {
        // This catches errors in the BFF itself
        return NextResponse.json({ message: 'BFF Error: Failed to process login', error: err.message }, { status: 500 });
    }
}