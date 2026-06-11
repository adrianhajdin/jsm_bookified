'use client';

/**
 * 60db voice hook. Drop-in shape-equivalent to `useVapi` so VapiControls
 * can swap providers via env without touching its render code.
 *
 * Activated when NEXT_PUBLIC_VOICE_PROVIDER === '60db'.
 * See lib/sixtydb/agent.ts for the per-turn STT -> LLM -> TTS pipeline.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

import { useSubscription } from '@/hooks/useSubscription';
import { SixtyDbAgent, type AgentStatus } from '@/lib/sixtydb/agent';
import { endVoiceSession, startVoiceSession } from '@/lib/actions/session.actions';
import type { IBook, Messages } from '@/types';

const TIMER_INTERVAL_MS = 1000;
const SECONDS_PER_MINUTE = 60;
const DEFAULT_MAX_DURATION_MINUTES = 15;

function useLatestRef<T>(value: T) {
    const ref = useRef(value);
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref;
}

export function useSixtyDb(book: IBook) {
    const { userId } = useAuth();
    const { limits } = useSubscription();

    const [status, setStatus] = useState<AgentStatus>('idle');
    const [messages, setMessages] = useState<Messages[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [currentUserMessage, setCurrentUserMessage] = useState('');
    const [duration, setDuration] = useState(0);
    const [limitError, setLimitError] = useState<string | null>(null);
    const [isBillingError, setIsBillingError] = useState(false);

    const agentRef = useRef<SixtyDbAgent | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startedAtRef = useRef<number | null>(null);
    const sessionIdRef = useRef<string | null>(null);

    const maxDurationSeconds =
        (limits?.maxDurationPerSession ?? DEFAULT_MAX_DURATION_MINUTES) * SECONDS_PER_MINUTE;
    const maxDurationRef = useLatestRef(maxDurationSeconds);
    const durationRef = useLatestRef(duration);

    const cleanupTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        startedAtRef.current = null;
    }, []);

    const closeSession = useCallback(() => {
        agentRef.current?.stop();
        agentRef.current = null;
        cleanupTimer();
        if (sessionIdRef.current) {
            endVoiceSession(sessionIdRef.current, durationRef.current).catch((err) =>
                console.error('Failed to end voice session:', err),
            );
            sessionIdRef.current = null;
        }
    }, [cleanupTimer, durationRef]);

    useEffect(() => () => closeSession(), [closeSession]);

    const start = useCallback(async () => {
        if (!userId) {
            setLimitError('Please sign in to start a voice session.');
            return;
        }
        setLimitError(null);
        setIsBillingError(false);
        setStatus('connecting');
        setMessages([]);
        setCurrentMessage('');
        setCurrentUserMessage('');

        try {
            const session = await startVoiceSession(userId, book._id);
            if (!session.success) {
                setLimitError(session.error || 'Session limit reached. Please upgrade your plan.');
                setIsBillingError(!!session.isBillingError);
                setStatus('idle');
                return;
            }
            sessionIdRef.current = session.sessionId || null;

            const keyRes = await fetch('/api/sixtydb/key', { method: 'POST' });
            if (!keyRes.ok) throw new Error(`Failed to fetch 60db key: ${keyRes.status}`);
            const { api_key: apiKey, api_base: apiBase } = await keyRes.json();

            const firstMessage = `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;

            const agent = new SixtyDbAgent(
                { apiBase, apiKey, book, firstMessage },
                {
                    onStatus: (s) => setStatus(s),
                    onPartialUser: (t) => setCurrentUserMessage(t),
                    onFinalUser: (t) => {
                        setCurrentUserMessage('');
                        setMessages((prev) => [...prev, { role: 'user', content: t }]);
                    },
                    onFinalAssistant: (t) => {
                        setCurrentMessage('');
                        setMessages((prev) => [...prev, { role: 'assistant', content: t }]);
                    },
                    onPartialAssistant: (t) => setCurrentMessage(t),
                    onError: (err) => {
                        console.error('60db agent error:', err);
                        setLimitError('Session ended unexpectedly. Click the mic to start again.');
                        closeSession();
                        setStatus('idle');
                    },
                },
            );
            agentRef.current = agent;
            await agent.start();

            startedAtRef.current = Date.now();
            setDuration(0);
            timerRef.current = setInterval(() => {
                if (!startedAtRef.current) return;
                const d = Math.floor((Date.now() - startedAtRef.current) / TIMER_INTERVAL_MS);
                setDuration(d);
                if (d >= maxDurationRef.current) {
                    setLimitError(
                        `Session time limit (${Math.floor(maxDurationRef.current / SECONDS_PER_MINUTE)} minutes) reached. Upgrade your plan for longer sessions.`,
                    );
                    closeSession();
                    setStatus('idle');
                }
            }, TIMER_INTERVAL_MS);
        } catch (err) {
            console.error('Failed to start 60db session:', err);
            closeSession();
            setStatus('idle');
            setLimitError('Failed to start voice session. Please try again.');
        }
    }, [book, userId, closeSession, maxDurationRef]);

    const stop = useCallback(() => {
        closeSession();
        setStatus('idle');
    }, [closeSession]);

    const clearError = useCallback(() => {
        setLimitError(null);
        setIsBillingError(false);
    }, []);

    const isActive =
        status === 'starting' || status === 'listening' || status === 'thinking' || status === 'speaking';

    return {
        status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        start,
        stop,
        clearError,
        limitError,
        isBillingError,
        maxDurationSeconds,
    };
}

export default useSixtyDb;
