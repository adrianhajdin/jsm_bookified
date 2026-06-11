/**
 * 60db STT WebSocket — wss://api.60db.ai/ws/stt?apiKey=...
 *
 * Docs: https://docs.60db.ai/websocket-api/stt
 * Handshake lifecycle:  connecting -> connection_established -> start ->
 *                        connected -> speech_started -> transcription ->
 *                        stop -> session_stopped
 */

export interface SttSocketEvents {
    onPartial?: (text: string) => void;
    onFinal?: (text: string) => void;
    onSpeechStart?: () => void;
    onReady?: () => void;
    onError?: (err: Error) => void;
    onClose?: () => void;
}

export interface SttSocketOpts {
    apiBase: string;
    apiKey: string;
    sampleRate?: number;
    utteranceEndMs?: number;
}

export class SttSocket {
    private ws: WebSocket | null = null;
    private ready = false;

    constructor(private opts: SttSocketOpts, private events: SttSocketEvents) {}

    async open(): Promise<void> {
        const wsBase = this.opts.apiBase.replace(/^http/, 'ws').replace(/\/$/, '');
        const url = `${wsBase}/ws/stt?apiKey=${encodeURIComponent(this.opts.apiKey)}`;

        return new Promise((resolve, reject) => {
            const ws = new WebSocket(url);
            this.ws = ws;

            ws.onerror = () => reject(new Error('60db STT WebSocket error'));
            ws.onclose = () => {
                this.ready = false;
                this.events.onClose?.();
            };
            ws.onmessage = (e) => this.handle(e.data, resolve);
        });
    }

    sendAudio(base64Pcm: string): void {
        if (!this.ready || this.ws?.readyState !== WebSocket.OPEN) return;
        this.ws.send(
            JSON.stringify({
                type: 'audio',
                audio: base64Pcm,
                encoding: 'linear',
                sample_rate: this.opts.sampleRate ?? 16_000,
            }),
        );
    }

    close(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify({ type: 'stop' }));
            } catch {
                /* ignore */
            }
        }
        this.ws?.close();
        this.ws = null;
        this.ready = false;
    }

    private handle(raw: unknown, resolveOpen: () => void): void {
        if (typeof raw !== 'string') return;
        let msg: Record<string, unknown>;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }
        const type = msg.type as string;

        switch (type) {
            case 'connecting':
                return;
            case 'connection_established':
                this.ws?.send(
                    JSON.stringify({
                        type: 'start',
                        encoding: 'linear',
                        sample_rate: this.opts.sampleRate ?? 16_000,
                        utterance_end_ms: this.opts.utteranceEndMs ?? 500,
                        continuous_mode: true,
                    }),
                );
                return;
            case 'connected':
                this.ready = true;
                this.events.onReady?.();
                resolveOpen();
                return;
            case 'speech_started':
                this.events.onSpeechStart?.();
                return;
            case 'transcription': {
                const text = String(msg.transcript ?? msg.text ?? '');
                const isFinal = Boolean(msg.is_final);
                const speechFinal = Boolean(msg.speech_final);
                if (!text) return;
                if (isFinal && speechFinal) this.events.onFinal?.(text);
                else this.events.onPartial?.(text);
                return;
            }
            case 'session_stopped':
                this.ready = false;
                return;
            case 'error':
                this.events.onError?.(new Error(String(msg.message ?? 'STT error')));
                return;
        }
    }
}
