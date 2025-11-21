// =========================================================
// silkpanda/momentum/app/web-bff/auth/me/route.ts
// EMBEDDED WEB BFF (v4 Blueprint)
// Securely validates the user's session token
// =========================================================
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

// This is our internal API's URL.
const API_URL = `${API_BASE_URL}/auth/me`;

/**
 * @desc    Get the authenticated user's data
 * @route   GET /web-bff/auth/me
 * @access  Private (requires token)
 */
export async function GET() {
    const headersList = headers();
    const authorization = headersList.get('authorization');

    // 1. Validate the Authorization header exists
    if (!authorization) {
        return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
    }

    try {
        // 2. Forward the request (with token) to the internal 'momentum-api'
        const apiResponse = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Authorization': authorization,
            },
        });

        const data = await apiResponse.json();

        // 3. Return the API's response (or error) back to our frontend client
        if (!apiResponse.ok) {
            return NextResponse.json({ message: data.message || 'API Error' }, { status: apiResponse.status });
        }

        // 3. Fetch household data to get the user's role
        const householdId = data.data.householdId;
        const userId = data.data.user._id;

        if (householdId) {
            const householdResponse = await fetch(`${API_BASE_URL}/households/${householdId}`, {
                method: 'GET',
                headers: {
                    'Authorization': authorization,
                },
            });

            if (householdResponse.ok) {
                const householdData = await householdResponse.json();
                const memberProfile = householdData.data.memberProfiles.find(
                    (m: any) => m.familyMemberId === userId || m.familyMemberId._id === userId
                );

                if (memberProfile) {
                    data.data.user.role = memberProfile.role;
                }
            }
        }

        return NextResponse.json(data);

    } catch (err: any) {
        return NextResponse.json({ message: 'BFF Error: Failed to validate session', error: err.message }, { status: 500 });
    }
}