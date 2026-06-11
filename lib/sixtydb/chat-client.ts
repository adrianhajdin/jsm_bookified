/**
 * 60db chat completions client (OpenAI-compatible).
 *
 * Docs: https://docs.60db.ai/api-reference/chat-completions
 * Auth: `Authorization: Bearer ${apiKey}`.
 */
import { SIXTYDB_LLM_MODEL } from '@/lib/constants';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
}

export interface ChatResult {
    content: string;
    toolCalls: ToolCall[];
    finishReason?: string;
}

export interface ChatRequest {
    apiKey: string;
    apiBase: string;
    messages: ChatMessage[];
    tools?: unknown[];
    temperature?: number;
    topK?: number;
    maxTokens?: number;
    signal?: AbortSignal;
}

export async function chatCompletion(req: ChatRequest): Promise<ChatResult> {
    const res = await fetch(`${req.apiBase.replace(/\/$/, '')}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${req.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: SIXTYDB_LLM_MODEL,
            messages: req.messages,
            tool: req.tools,
            stream: false,
            temperature: req.temperature ?? 0.7,
            top_k: req.topK ?? 20,
            max_tokens: req.maxTokens,
            chat_template_kwargs: { enable_thinking: false },
        }),
        signal: req.signal,
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`60db /v1/chat/completions ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const choice = data?.choices?.[0];
    const msg = choice?.message ?? {};

    // 60db follows OpenAI's tool_calls array shape per docs.
    const rawCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
    const toolCalls: ToolCall[] = rawCalls.map((c: ToolCall) => ({
        id: c.id,
        type: 'function',
        function: { name: c.function?.name, arguments: c.function?.arguments ?? '{}' },
    }));

    return {
        content: (msg.content || '').trim(),
        toolCalls,
        finishReason: choice?.finish_reason,
    };
}

/**
 * Light heuristic — used by the retrieval-fallback path in agent.ts.
 * True when the user's utterance looks like a content question that
 * the LLM should have answered using the book.
 */
export function looksLikeContentQuestion(text: string): boolean {
    const t = text.trim().toLowerCase();
    if (t.length < 6) return false;
    if (/^(hi|hey|hello|thanks|thank you|bye|goodbye|ok|okay|cool|nice)\b/.test(t)) return false;
    return /(what|who|where|when|why|how|tell me|explain|summari[sz]e|describe|quote|chapter|character|passage|page)/.test(t);
}

/**
 * True when the assistant's reply admits ignorance — used as the second
 * condition for triggering retrieval fallback.
 */
export function looksLikeRefusal(reply: string): boolean {
    const r = reply.trim().toLowerCase();
    if (!r) return true;
    return /(i don't know|i'm not sure|i can't (find|recall)|no information|couldn't find|not (found|sure))/i.test(r);
}
