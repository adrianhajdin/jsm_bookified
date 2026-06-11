'use client';

import React, { useEffect, useState } from 'react';
import { voiceCategories, voiceOptions, VOICE_PROVIDER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { VoiceSelectorProps } from '@/types';

// ---------- ElevenLabs static catalog (Vapi path) -----------------------

interface VoiceCardProps {
    id: string;
    name: string;
    description: string;
    selected: boolean;
    disabled?: boolean;
}

const VoiceCard = ({ id, name, description, selected, disabled }: VoiceCardProps) => (
    <Label
        className={cn(
            'voice-selector-option',
            selected ? 'voice-selector-option-selected' : 'voice-selector-option-default',
            disabled && 'voice-selector-option-disabled',
        )}
    >
        <RadioGroupItem value={id} id={id} className="sr-only" />
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'w-4 h-4 rounded-full border flex items-center justify-center',
                        selected ? 'border-[#663820]' : 'border-gray-300',
                    )}
                >
                    {selected && <div className="w-2 h-2 rounded-full bg-[#663820]" />}
                </div>
                <span className="font-bold text-[#212a3b]">{name}</span>
            </div>
            <p className="text-xs text-[#777] leading-relaxed">{description}</p>
        </div>
    </Label>
);

const ElevenLabsSelector = ({ value, onChange, disabled, className }: VoiceSelectorProps) => (
    <div className={cn('space-y-6', className)}>
        <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="space-y-8">
            {(['male', 'female'] as const).map((gender) => (
                <div key={gender} className="space-y-4">
                    <h4 className="text-sm font-medium text-[#777] capitalize">{gender} Voices</h4>
                    <div className="voice-selector-options">
                        {voiceCategories[gender].map((voiceId) => {
                            const v = voiceOptions[voiceId as keyof typeof voiceOptions];
                            return (
                                <VoiceCard
                                    key={voiceId}
                                    id={voiceId}
                                    name={v.name}
                                    description={v.description}
                                    selected={value === voiceId}
                                    disabled={disabled}
                                />
                            );
                        })}
                    </div>
                </div>
            ))}
        </RadioGroup>
    </div>
);

// ---------- 60db dynamic catalog -----------------------------------------

interface SixtyDbVoice {
    voice_id: string;
    name?: string;
    description?: string;
    gender?: string;
    language?: string;
}

const SixtyDbSelector = ({ value, onChange, disabled, className }: VoiceSelectorProps) => {
    const [voices, setVoices] = useState<SixtyDbVoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                // Default voices first, then merge the caller's voices on top.
                const [defaults, mine] = await Promise.all([
                    fetch('/api/sixtydb/discovery?kind=default-voices').then((r) => r.json()).catch(() => ({})),
                    fetch('/api/sixtydb/discovery?kind=my-voices').then((r) => r.json()).catch(() => ({})),
                ]);
                if (cancelled) return;
                const arr = [...extractVoices(defaults), ...extractVoices(mine)];
                const dedup = Array.from(new Map(arr.map((v) => [v.voice_id, v])).values());
                setVoices(dedup);
            } catch (e) {
                if (!cancelled) setError((e as Error).message);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <p className="text-sm text-[#777]">Loading 60db voices…</p>;
    if (error) return <p className="text-sm text-red-600">Failed to load 60db voices: {error}</p>;
    if (!voices.length) return <p className="text-sm text-[#777]">No 60db voices available.</p>;

    return (
        <div className={cn('space-y-6', className)}>
            <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className="space-y-4">
                <h4 className="text-sm font-medium text-[#777]">60db Voices</h4>
                <div className="voice-selector-options">
                    {voices.map((v) => (
                        <VoiceCard
                            key={v.voice_id}
                            id={v.voice_id}
                            name={v.name || v.voice_id}
                            description={v.description || [v.gender, v.language].filter(Boolean).join(' · ') || ' '}
                            selected={value === v.voice_id}
                            disabled={disabled}
                        />
                    ))}
                </div>
            </RadioGroup>
        </div>
    );
};

function extractVoices(body: unknown): SixtyDbVoice[] {
    if (!body || typeof body !== 'object') return [];
    const data = (body as { data?: unknown }).data;
    if (Array.isArray(data)) return data as SixtyDbVoice[];
    if (Array.isArray(body)) return body as SixtyDbVoice[];
    return [];
}

// ---------- Provider switch ----------------------------------------------

const VoiceSelector = (props: VoiceSelectorProps) => {
    return VOICE_PROVIDER === '60db' ? <SixtyDbSelector {...props} /> : <ElevenLabsSelector {...props} />;
};

export default VoiceSelector;
