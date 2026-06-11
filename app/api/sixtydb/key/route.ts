import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Returns the 60db API key to the browser so it can open the STT/TTS
 * WebSockets. 60db has no token-mint endpoint yet, so this exposes the
 * long-lived key. Gated behind Clerk auth so only signed-in users hit it.
 */
export async function POST() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.SIXTYDB_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'SIXTYDB_API_KEY not set on the server.' },
            { status: 500 },
        );
    }

    return NextResponse.json({
        api_key: apiKey,
        api_base: process.env.SIXTYDB_API_BASE || 'https://api.60db.ai',
    });
}
