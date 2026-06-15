/**
 * tts.ts — API client cho Gemini TTS Proxy.
 *
 * /health và /voices trả về ApiResponse[T] envelope.
 * /tts trả về binary WAV — không envelope.
 *
 * VITE_TTS_BASE_URL is optional — defaults to "/tts" so the web app can
 * be served from the same host as the traefik reverse proxy in the dev
 * docker stack (TTS path is /tts/*, TTS_BASE_URL becomes "/tts/api").
 */

import { TTS_BASE_URL } from "../config";

const TTS_BASE = `${TTS_BASE_URL}/api`;

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

export interface NineRouterKey {
  id: string;
  provider: string;
  name: string | null;
  email: string | null;
  priority: number;
  isActive: number;
  api_key: string | null;       // giá trị thật — admin view
  data_email: string | null;
  data_len: number;
  createdAt: string;
  updatedAt: string;
}

export interface NineRouterKeysData {
  db_path: string;
  db_exists: boolean;
  db_size_bytes: number;
  db_mtime: string | null;
  total_connections: number;
  active_connections: number;
  inactive_connections: number;
  keys: NineRouterKey[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const _get = <T>(path: string) =>
  fetch(`${TTS_BASE}${path}`).then(async (r) => {
    if (!r.ok) {
      try {
        const body = (await r.json()) as _ApiEnvelope<never>;
        throw new Error(body.error?.message ?? `TTS API error ${r.status}`);
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(`TTS API error ${r.status}`);
        }
        throw e;
      }
    }
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

  // ── Admin: 9router keys (real values — admin only) ─────────────────
  adminNineRouterKeys: () => _get<NineRouterKeysData>("/admin/9router/keys"),

  adminNineRouterReload: async (): Promise<{ reloaded: number }> => {
    const r = await fetch(`${TTS_BASE}/admin/9router/reload`, { method: "POST" });
    return _parseEnvelope<{ reloaded: number }>(r);
  },
};