// =========================================================
// silkpanda/momentum/app/web-bff/auth/signup/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Handles Parent sign-up
// =========================================================
import { NextResponse } from 'next/server';

// This is our internal API's URL.
// In production, this would be a secure environment variable.
const API_URL = 'http://localhost:3000/api/v1/auth/signup';

/**
 * @desc    Handle Parent Sign-up
 * @route   POST /web-bff/auth/signup
 * @access  Public
 */
export async function POST(req: Request) {
    try {
        // 1. Get the body from our frontend client (SignUpForm.tsx)
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
        // This catches errors in the BFF itself (e.g., network failure)
        return NextResponse.json({ message: 'BFF Error: Failed to process signup', error: err.message }, { status: 500 });
    }
}