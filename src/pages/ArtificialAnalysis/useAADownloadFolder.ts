import { useState } from "react";

/**
 * useAADownloadFolder — the Tauri desktop build had a native folder
 * picker; in the web build the user types a path/label for their own
 * reference and the actual file save goes through the browser's own
 * download dialog (see downloadUtils.ts). The state shape is preserved
 * so call sites in the AA page don't change.
 */
export function useAADownloadFolder() {
  const [downloadFolder, setDownloadFolder] = useState<string>(
    () => localStorage.getItem("aa_download_folder") ?? ""
  );

  const handlePickFolder = () => {
    const path = window.prompt(
      "Nhập đường dẫn thư mục lưu ảnh (chỉ ghi nhớ — web app dùng browser download):"
    );
    if (typeof path === "string" && path) {
      setDownloadFolder(path);
      localStorage.setItem("aa_download_folder", path);
    }
  };

  return { downloadFolder, handlePickFolder };
}
