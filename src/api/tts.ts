/**
 * tts.ts — API client cho Gemini TTS Proxy (port 8700).
 *
 * /health và /voices trả về ApiResponse[T] envelope.
 * /tts trả về binary WAV — không envelope.
 */

if (!import.meta.env.VITE_TTS_BASE_URL)
  throw new Error("VITE_TTS_BASE_URL không được cấu hình");

const TTS_BASE = `${import.meta.env.VITE_TTS_BASE_URL}/api`;

// ── Envelope ──────────────────────────────────────────────────────────────────

interface _ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta: { request_id: string; ts: string };
}

const _parseEnvelope = async <T>(r: Response): Promise<T> => {
  const body = (await r.json()) as _ApiEnvelope<T>;
  if (!body.success) {
    throw new Error(body.error?.message ?? `HTTP ${r.status}`);
  }
  return body.data as T;
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TTSHealth {
  status: "ok";
  model: string;
  default_voice: string;
  default_speed: number;
  voice_speed: number;
  available_keys: number;
  available_today: number;
  keys: Array<{ key: string; remaining: number; max_rpd: number }>;
}

export interface GeminiVoice {
  voice_id: string;
  name: string;
}

export interface TTSVoicesResponse {
  voices: GeminiVoice[];
  count: number;
}

export interface TTSGenerateParams {
  text: string;
  voice_id: string;   // Gemini voice name, e.g. "Charon"
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const _get = <T>(path: string) =>
  fetch(`${TTS_BASE}${path}`).then((r) => {
    if (!r.ok) throw new Error(`TTS API error ${r.status}`);
    return _parseEnvelope<T>(r);
  });

// ── TTS API ───────────────────────────────────────────────────────────────────

export const ttsApi = {
  health: () => _get<TTSHealth>("/health"),

  listVoices: () => _get<TTSVoicesResponse>("/voices"),

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
      // /tts trả về envelope JSON khi lỗi
      try {
        const errBody = (await r.json()) as _ApiEnvelope<never>;
        throw new Error(errBody.error?.message ?? `TTS generate error ${r.status}`);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`TTS generate error ${r.status}`);
        }
        throw e;
      }
    }

    const blob = await r.blob();
    return {
      blobUrl: URL.createObjectURL(blob),
      voiceId: r.headers.get("X-Voice-Id") ?? params.voice_id,
    };
  },
};