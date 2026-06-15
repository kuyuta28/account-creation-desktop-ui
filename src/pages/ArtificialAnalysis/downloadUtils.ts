

import { api } from "../../api/client";

export function buildFilename(modelName: string): string {
  const now = new Date();
  const ts =
    [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("") +
    "_" +
    [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  const safeName = modelName.replace(/[\\\/:*?"<>|]/g, "_");
  return `${safeName}_${ts}_${rand}.png`;
}

export async function downloadAAImage(params: {
  email: string;
  imageId: string;
  modelName: string;
  downloadFolder: string;
}): Promise<void> {
  const { email, imageId, modelName } = params;
  const filename = buildFilename(modelName);

  const buf = await api.aaImageDownload(email, imageId, modelName);
  // Browser download: create a Blob, point an <a download> at it, click,
  // release. The downloadFolder prop is intentionally ignored — web
  // apps cannot write to a chosen local folder; the user picks the
  // save location from the browser's own download dialog.
  const blob = new Blob([new Uint8Array(buf)], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
