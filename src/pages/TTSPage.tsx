import { useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { ttsApi, type GeminiVoice } from "../api/tts";
import { useLocalStorage } from "../hooks/useLocalStorage";

export default function TTSPage() {
  const [voices, setVoices] = useState<GeminiVoice[]>([]);
  const [availableKeys, setAvailableKeys] = useState<number | null>(null);
  const [model, setModel] = useState<string>("");

  // Form state
  const [text, setText] = useLocalStorage("tts.text", "");
  const [voiceId, setVoiceId] = useLocalStorage("tts.voiceId", "Charon");
  const [autoDownload, setAutoDownload] = useLocalStorage("tts.autoDownload", false);
  const [downloadFolder, setDownloadFolder] = useLocalStorage("tts.downloadFolder", "");

  // Playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastVoice, setLastVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // UI state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ttsApi.health()
      .then((h) => {
        setAvailableKeys(h.available_keys);
        setModel(h.model);
      })
      .catch(() => setAvailableKeys(0));

    ttsApi.listVoices()
      .then((r) => setVoices(r.voices))
      .catch((e: unknown) => setError((e as Error).message));
  }, []);

  const generate = async () => {
    if (!text.trim()) return;
    setGenerating(true);
    setError(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    try {
      const result = await ttsApi.generate({ text: text.trim(), voice_id: voiceId });
      setAudioUrl(result.blobUrl);
      setLastVoice(result.voiceId);
      setTimeout(() => audioRef.current?.play(), 50);

      if (autoDownload) {
        if (!downloadFolder) throw new Error("Auto download đang bật nhưng chưa chọn thư mục lưu");
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const savePath = `${downloadFolder}\\tts-${ts}.wav`;
        const buf = await fetch(result.blobUrl).then((r) => r.arrayBuffer());
        await writeFile(savePath, new Uint8Array(buf));
      }
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const pickFolder = async () => {
    const selected = await open({ directory: true, title: "Chọn thư mục lưu audio" });
    if (selected) setDownloadFolder(selected as string);
  };

  const downloadCurrent = async () => {
    if (!audioUrl) return;
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const savePath = downloadFolder
      ? `${downloadFolder}\\tts-${ts}.wav`
      : null;
    if (!savePath) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `tts-${ts}.wav`;
      a.click();
      return;
    }
    const buf = await fetch(audioUrl).then((r) => r.arrayBuffer());
    await writeFile(savePath, new Uint8Array(buf));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gemini TTS</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {model ? `${model}` : "Text-to-Speech với Gemini"}
          </p>
        </div>
        {availableKeys !== null && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${availableKeys > 0 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
            {availableKeys > 0 ? `${availableKeys} key(s)` : "No keys"}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Text input */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder="Nhập nội dung cần chuyển thành giọng nói..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">{text.length.toLocaleString()} ký tự</p>
          </div>

          {/* Audio player */}
          {audioUrl && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Voice: <span className="font-medium text-gray-700">{lastVoice}</span>
                </span>
                <button
                  onClick={downloadCurrent}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                >
                  ↓ Tải xuống WAV
                </button>
              </div>
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full h-10"
              />
            </div>
          )}
        </div>

        {/* Right: Settings */}
        <div className="space-y-4">
          {/* Voice selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice</label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              {voices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Auto download */}
          <div className="rounded-lg border border-gray-200 p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDownload}
                onChange={(e) => setAutoDownload(e.target.checked)}
                className="accent-violet-600"
              />
              <span className="text-sm text-gray-700">Tự động lưu file</span>
            </label>
            {autoDownload && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500 truncate">{downloadFolder || "Chưa chọn thư mục"}</p>
                <button
                  onClick={pickFolder}
                  className="text-xs text-violet-600 hover:text-violet-800 font-medium"
                >
                  Chọn thư mục...
                </button>
              </div>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || !text.trim()}
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? "Đang tạo..." : "Tạo giọng nói"}
          </button>
        </div>
      </div>
    </div>
  );
}
