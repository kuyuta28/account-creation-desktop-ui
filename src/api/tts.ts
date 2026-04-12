/**
 * tts.ts — API client cho Gemini TTS Proxy (port 8700).
 *
 * Tách riêng khỏi client.ts vì TTS proxy chạy ở port khác (8700 vs 8709).
 */

if (!import.meta.env.VITE_TTS_BASE_URL)
  throw new Error("VITE_TTS_BASE_URL không được cấu hình");

const TTS_BASE = `${import.meta.env.VITE_TTS_BASE_URL}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TTSHealth {
  status: "ok";
  model: string;
  available_keys: number;
}

export interface GeminiVoice {
  voice_id: string;
  name: string;
}

export interface TTSGenerateParams {
  text: string;
  voice_id: string;   // Gemini voice name, e.g. "Charon"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const _json = async <T>(r: Response): Promise<T> => {
  if (!r.ok) {
    const text = await r.text().catch(() => `HTTP ${r.status}`);
    throw new Error(`TTS API error ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
};

const _get = <T>(path: string) =>
  fetch(`${TTS_BASE}${path}`).then((r) => _json<T>(r));

// ── TTS API ───────────────────────────────────────────────────────────────────

export const ttsApi = {
  health: () => _get<TTSHealth>("/health"),

  listVoices: () => _get<{ voices: GeminiVoice[]; count: number }>("/voices"),

  /** Generate TTS → trả về Blob URL (WAV) để play ngay. */
  generate: async (params: TTSGenerateParams): Promise<{ blobUrl: string; voiceId: string }> => {
    const body = {
      text: params.text,
      voice_id: params.voice_id,
    };

    const r = await fetch(`${TTS_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => `HTTP ${r.status}`);
      throw new Error(`TTS generate error ${r.status}: ${text.slice(0, 200)}`);
    }

    const blob = await r.blob();
    return {
      blobUrl: URL.createObjectURL(blob),
      voiceId: r.headers.get("X-Voice-Id") ?? params.voice_id,
    };
  },
};
