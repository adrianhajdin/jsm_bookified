/**
 * 60db voice agent — composes STT WS + LLM REST + TTS WS into one
 * conversational lifecycle, matching the surface of `@vapi-ai/web`.
 *
 *   start()  -> open sockets, TTS greeting, begin mic capture
 *   stop()   -> close sockets, release mic
 *
 * Per-turn flow:
 *   user audio -> STT partial/final
 *   final transcript -> LLM call (with searchBook tool defined)
 *     |- if tool call -> run searchBookSegments -> re-call LLM with tool result
 *     |- else if reply looks evasive AND user msg is a content question
 *        -> retrieval-fallback: inject top-3 segments, re-call LLM once
 *   reply -> TTS WS -> audio_chunk events -> AudioPlayer
 */
import { searchBookSegments } from '@/lib/actions/book.actions';
import {
    SIXTYDB_DEFAULT_VOICE_ID,
    SIXTYDB_RAG_FALLBACK_TOP_K,
    SIXTYDB_SYSTEM_PROMPT,
    SIXTYDB_TOOLS,
} from '@/lib/constants';
import { AudioPlayer, MicCapture } from '@/lib/sixtydb/audio-pipeline';
import {
    chatCompletion,
    looksLikeContentQuestion,
    looksLikeRefusal,
    type ChatMessage,
    type ToolCall,
} from '@/lib/sixtydb/chat-client';
import { SttSocket } from '@/lib/sixtydb/stt-socket';
import { TtsSocket } from '@/lib/sixtydb/tts-socket';

const MAX_TOOL_ROUNDS = 2;

export type AgentStatus = 'idle' | 'connecting' | 'starting' | 'listening' | 'thinking' | 'speaking';

export interface AgentBook {
    _id: string;
    title: string;
    author: string;
    persona?: string;
}

export interface AgentEvents {
    onStatus?: (s: AgentStatus) => void;
    onPartialUser?: (text: string) => void;
    onFinalUser?: (text: string) => void;
    onPartialAssistant?: (text: string) => void;
    onFinalAssistant?: (text: string) => void;
    onError?: (err: Error) => void;
}

export interface AgentOpts {
    apiBase: string;
    apiKey: string;
    book: AgentBook;
    firstMessage: string;
}

export class SixtyDbAgent {
    private stt: SttSocket | null = null;
    private tts: TtsSocket | null = null;
    private mic: MicCapture | null = null;
    private player = new AudioPlayer();
    private history: ChatMessage[] = [];
    private busy = false;
    private stopped = false;

    constructor(private opts: AgentOpts, private events: AgentEvents) {
        this.history.push({ role: 'system', content: SIXTYDB_SYSTEM_PROMPT(opts.book) });
        this.player.onAllPlayed(() => {
            if (this.stopped) return;
            if (!this.busy) this.events.onStatus?.('listening');
        });
    }

    async start(): Promise<void> {
        this.events.onStatus?.('connecting');

        this.stt = new SttSocket(
            { apiBase: this.opts.apiBase, apiKey: this.opts.apiKey },
            {
                onPartial: (t) => this.events.onPartialUser?.(t),
                onFinal: (t) => this.handleUserFinal(t),
                onError: (e) => this.events.onError?.(e),
                onClose: () => {/* surfaced via stop() */},
            },
        );

        this.tts = new TtsSocket(
            {
                apiBase: this.opts.apiBase,
                apiKey: this.opts.apiKey,
                voiceId: this.opts.book.persona || SIXTYDB_DEFAULT_VOICE_ID,
            },
            {
                onAudio: (b64) => this.player.enqueue(b64),
                onSpeakStart: () => this.events.onStatus?.('speaking'),
                onSpeakEnd: () => {/* AudioPlayer.onAllPlayed flips status back */},
                onError: (e) => this.events.onError?.(e),
            },
        );

        await Promise.all([this.stt.open(), this.tts.open()]);
        if (this.stopped) return;

        this.events.onStatus?.('starting');
        await this.tts.speak(this.opts.firstMessage);
        this.history.push({ role: 'assistant', content: this.opts.firstMessage });
        this.events.onFinalAssistant?.(this.opts.firstMessage);

        this.mic = new MicCapture((b64) => this.stt?.sendAudio(b64));
        await this.mic.start();
    }

    stop(): void {
        this.stopped = true;
        this.mic?.stop();
        this.stt?.close();
        this.tts?.close();
        this.player.stop();
        this.events.onStatus?.('idle');
    }

    private async handleUserFinal(text: string): Promise<void> {
        if (this.stopped || !text.trim()) return;
        this.events.onFinalUser?.(text);
        this.history.push({ role: 'user', content: text });
        this.busy = true;
        this.events.onStatus?.('thinking');

        try {
            const reply = await this.runTurn(text);
            if (this.stopped) return;
            this.history.push({ role: 'assistant', content: reply });
            this.events.onFinalAssistant?.(reply);
            await this.tts?.speak(reply);
        } catch (e) {
            this.events.onError?.(e as Error);
        } finally {
            this.busy = false;
        }
    }

    /** One full turn — tool round-trip first, then retrieval fallback. */
    private async runTurn(userText: string): Promise<string> {
        let reply = await this.callLlmWithTools(this.history.slice());
        if (this.stopped) return '';

        if (!reply && looksLikeContentQuestion(userText)) {
            // No content at all came back — try retrieval fallback once.
            return this.retrievalFallback(userText);
        }
        if (looksLikeRefusal(reply) && looksLikeContentQuestion(userText)) {
            return this.retrievalFallback(userText);
        }
        return reply;
    }

    private async callLlmWithTools(messages: ChatMessage[]): Promise<string> {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const r = await chatCompletion({
                apiBase: this.opts.apiBase,
                apiKey: this.opts.apiKey,
                messages,
                tools: SIXTYDB_TOOLS,
            });
            if (this.stopped) return '';

            if (!r.toolCalls.length) return r.content;

            // Execute every tool call locally, append tool messages, re-call.
            messages = [
                ...messages,
                { role: 'assistant', content: r.content || '' },
            ];
            for (const call of r.toolCalls) {
                const toolResult = await this.runTool(call);
                messages.push({
                    role: 'tool',
                    name: call.function.name,
                    tool_call_id: call.id,
                    content: toolResult,
                });
            }
        }
        // Tool-call ping-pong runaway — return the last assistant message.
        const last = messages.reverse().find((m) => m.role === 'assistant');
        return last?.content ?? '';
    }

    private async runTool(call: ToolCall): Promise<string> {
        if (call.function.name !== 'searchBook') return `Unknown tool: ${call.function.name}`;
        let args: { bookId?: string; query?: string };
        try {
            args = JSON.parse(call.function.arguments || '{}');
        } catch {
            args = {};
        }
        const bookId = args.bookId || this.opts.book._id;
        const query = (args.query || '').trim();
        if (!query) return 'No query provided.';

        const r = await searchBookSegments(bookId, query, SIXTYDB_RAG_FALLBACK_TOP_K);
        if (!r.success || !r.data?.length) return 'No information found about this topic in the book.';
        return r.data.map((s) => (s as { content: string }).content).join('\n\n');
    }

    private async retrievalFallback(userText: string): Promise<string> {
        const r = await searchBookSegments(this.opts.book._id, userText, SIXTYDB_RAG_FALLBACK_TOP_K);
        if (!r.success || !r.data?.length) return "I couldn't find that in the book — could you rephrase?";

        const excerpts = r.data.map((s) => (s as { content: string }).content).join('\n\n');
        const messages: ChatMessage[] = [
            ...this.history.slice(),
            {
                role: 'system',
                content: `Relevant book excerpts you may use to answer the user's question. Paraphrase — don't quote verbatim.\n\n${excerpts}`,
            },
        ];
        const reply = await chatCompletion({
            apiBase: this.opts.apiBase,
            apiKey: this.opts.apiKey,
            messages,
        });
        return reply.content || "I couldn't find that in the book — could you rephrase?";
    }
}
