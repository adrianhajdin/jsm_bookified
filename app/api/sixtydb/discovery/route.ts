import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Server-side proxy for 60db discovery endpoints. Keeps the API key off
 * the wire so the browser can populate the voice / model pickers safely.
 *
 *   GET /api/sixtydb/discovery?kind=default-voices    -> /default-voices
 *   GET /api/sixtydb/discovery?kind=my-voices         -> /my-voices
 *   GET /api/sixtydb/discovery?kind=tts-models        -> /tts/models
 *   GET /api/sixtydb/discovery?kind=stt-models        -> /stt/models
 */
const PATH_MAP: Record<string, string> = {
    'default-voices': '/default-voices',
    'my-voices': '/my-voices',
    'tts-models': '/tts/models',
    'stt-models': '/stt/models',
};

export async function GET(request: Request) {
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

    const kind = new URL(request.url).searchParams.get('kind') ?? '';
    const path = PATH_MAP[kind];
    if (!path) {
        return NextResponse.json(
            {
                error: `Unknown kind '${kind}'. Use one of: ${Object.keys(PATH_MAP).join(', ')}.`,
            },
            { status: 400 },
        );
    }

    const apiBase = (process.env.SIXTYDB_API_BASE || 'https://api.60db.ai').replace(/\/$/, '');

    try {
        const res = await fetch(`${apiBase}${path}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: 'no-store',
        });
        const body = await res.text();
        return new NextResponse(body, {
            status: res.status,
            headers: { 'Content-Type': res.headers.get('Content-Type') ?? 'application/json' },
        });
    } catch (err) {
        return NextResponse.json(
            { error: `60db ${path} request failed: ${(err as Error).message}` },
            { status: 502 },
        );
    }
}
