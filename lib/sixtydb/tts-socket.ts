/**
 * 60db TTS WebSocket — wss://api.60db.ai/ws/tts?apiKey=...
 *
 * Docs: https://docs.60db.ai/websocket-api/tts
 * Lifecycle:  connection_established -> create_context -> context_created
 *             -> send_text/flush_context -> audio_chunk -> flush_completed
 *             -> close_context
 *
 * Audio out: LINEAR16, 24 kHz, mono. Base64-encoded chunks.
 */

export interface TtsSocketEvents {
    onAudio?: (base64Pcm: string) => void;
    onSpeakStart?: () => void;
    onSpeakEnd?: () => void;
    onReady?: () => void;
    onError?: (err: Error) => void;
    onClose?: () => void;
}

export interface TtsSocketOpts {
    apiBase: string;
    apiKey: string;
    voiceId: string;
}

export class TtsSocket {
    private ws: WebSocket | null = null;
    private contextId: string | null = null;
    private contextReadyResolvers: Array<() => void> = [];
    private speakingFrames = 0;

    constructor(private opts: TtsSocketOpts, private events: TtsSocketEvents) {}

    async open(): Promise<void> {
        const wsBase = this.opts.apiBase.replace(/^http/, 'ws').replace(/\/$/, '');
        const url = `${wsBase}/ws/tts?apiKey=${encodeURIComponent(this.opts.apiKey)}`;

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            this.ws = ws;
            ws.onerror = () => reject(new Error('60db TTS WebSocket error'));
            ws.onclose = () => this.events.onClose?.();
            ws.onmessage = (e) => this.handle(e.data, resolve);
        });
    }

    /** Send a sentence/paragraph to be spoken, then flush. */
    async speak(text: string): Promise<void> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        await this.ensureContext();

        this.speakingFrames = 0;
        this.ws.send(
            JSON.stringify({ type: 'send_text', text, context_id: this.contextId }),
        );
        this.ws.send(
            JSON.stringify({ type: 'flush_context', context_id: this.contextId }),
        );
    }

    /** Cancel any in-flight playback and start a fresh context next turn. */
    interrupt(): void {
        if (!this.ws || !this.contextId || this.ws.readyState !== WebSocket.OPEN) return;
        try {
            this.ws.send(JSON.stringify({ type: 'close_context', context_id: this.contextId }));
        } catch {
            /* ignore */
        }
        this.contextId = null;
    }

    close(): void {
        this.interrupt();
        this.ws?.close();
        this.ws = null;
    }

    private ensureContext(): Promise<void> {
        if (this.contextId) return Promise.resolve();
        return new Promise((resolve) => {
            this.contextReadyResolvers.push(resolve);
            this.ws?.send(
                JSON.stringify({
                    type: 'create_context',
                    voice_id: this.opts.voiceId,
                    audio_encoding: 'LINEAR16',
                    sample_rate_hertz: 24_000,
                }),
            );
        });
    }

    private handle(raw: unknown, resolveOpen: () => void): void {
        if (typeof raw !== 'string') return;
        let msg: Record<string, unknown>;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }
        switch (msg.type) {
            case 'connection_established':
                this.events.onReady?.();
                resolveOpen();
                return;
            case 'context_created':
                this.contextId = String(msg.context_id || '');
                this.contextReadyResolvers.splice(0).forEach((fn) => fn());
                return;
            case 'audio_chunk': {
                const b64 = String(msg.audioContent ?? msg.audio ?? '');
                if (!b64) return;
                if (this.speakingFrames === 0) this.events.onSpeakStart?.();
                this.speakingFrames++;
                this.events.onAudio?.(b64);
                return;
            }
            case 'flush_completed':
                this.events.onSpeakEnd?.();
                this.speakingFrames = 0;
                return;
            case 'error':
                this.events.onError?.(new Error(String(msg.message ?? 'TTS error')));
                return;
        }
    }
}
