/**
 * Browser audio glue for the 60db voice loop.
 *
 *   MicCapture       — open getUserMedia, downsample 48k Float32 -> 16k Int16, emit base64
 *   AudioPlayer      — queue base64 LINEAR16 24k chunks and play via Web Audio
 *   decodePcmBase64  — shared helper
 */

const STT_SAMPLE_RATE = 16_000; // /ws/stt expects linear16 @ 16k for browser mode
const TTS_SAMPLE_RATE = 24_000; // /ws/tts emits LINEAR16 @ 24k per docs

export type MicChunkHandler = (base64Pcm: string) => void;

export class MicCapture {
    private stream: MediaStream | null = null;
    private audioCtx: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private processor: ScriptProcessorNode | null = null;
    private buffer: number[] = [];
    private readonly chunkSamples: number;

    constructor(private onChunk: MicChunkHandler, chunkDurationMs = 100) {
        this.chunkSamples = Math.round((STT_SAMPLE_RATE * chunkDurationMs) / 1000);
    }

    async start(): Promise<void> {
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        });

        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new Ctx();
        this.source = this.audioCtx.createMediaStreamSource(this.stream);

        // ScriptProcessorNode is deprecated but still the simplest path
        // that runs on the main thread without an AudioWorklet build step.
        this.processor = this.audioCtx.createScriptProcessor(4096, 1, 1);
        this.processor.onaudioprocess = (e) => this.handleFrame(e.inputBuffer.getChannelData(0));
        this.source.connect(this.processor);
        this.processor.connect(this.audioCtx.destination);
    }

    stop(): void {
        this.processor?.disconnect();
        this.source?.disconnect();
        this.stream?.getTracks().forEach((t) => t.stop());
        void this.audioCtx?.close();
        this.processor = null;
        this.source = null;
        this.stream = null;
        this.audioCtx = null;
        this.buffer = [];
    }

    private handleFrame(input: Float32Array): void {
        const inputRate = this.audioCtx?.sampleRate ?? 48_000;
        const ratio = inputRate / STT_SAMPLE_RATE;
        for (let i = 0; i < input.length; i += ratio) {
            this.buffer.push(input[Math.floor(i)]);
            if (this.buffer.length >= this.chunkSamples) this.flush();
        }
    }

    private flush(): void {
        const samples = this.buffer.splice(0, this.chunkSamples);
        const pcm = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.onChunk(int16ToBase64(pcm));
    }
}

export class AudioPlayer {
    private ctx: AudioContext | null = null;
    private playheadTime = 0;
    private playing = false;
    private onIdle?: () => void;

    onAllPlayed(cb: () => void): void {
        this.onIdle = cb;
    }

    enqueue(base64Pcm: string): void {
        if (!this.ctx) {
            const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.ctx = new Ctx({ sampleRate: TTS_SAMPLE_RATE });
        }
        const ctx = this.ctx;
        const float = decodePcmBase64(base64Pcm);
        const buf = ctx.createBuffer(1, float.length, TTS_SAMPLE_RATE);
        buf.getChannelData(0).set(float);

        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);

        const now = ctx.currentTime;
        const startAt = Math.max(now, this.playheadTime);
        src.start(startAt);
        this.playheadTime = startAt + buf.duration;
        this.playing = true;

        src.onended = () => {
            if (ctx.currentTime >= this.playheadTime - 0.01) {
                this.playing = false;
                this.onIdle?.();
            }
        };
    }

    isPlaying(): boolean {
        return this.playing;
    }

    stop(): void {
        void this.ctx?.close();
        this.ctx = null;
        this.playheadTime = 0;
        this.playing = false;
    }
}

export function decodePcmBase64(b64: string): Float32Array {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const view = new DataView(bytes.buffer);
    const out = new Float32Array(bytes.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = view.getInt16(i * 2, true) / 0x8000;
    }
    return out;
}

function int16ToBase64(pcm: Int16Array): string {
    const bytes = new Uint8Array(pcm.buffer);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}
