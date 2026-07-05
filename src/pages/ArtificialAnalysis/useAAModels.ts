import { useState } from "react";
import { api } from "../../api/client";
import { ASPECT_RATIO_DIMENSIONS } from "./types";
import type { AAModel, AspectRatioKey, DimensionOption } from "./types";

export function useAAModels(mode: "text_to_image" | "image_editing", selectedEmail: string) {
  const [models, setModels] = useState<AAModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modelSearch, setModelSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>("1:1 (Square)");
  const [dimension, setDimension] = useState<DimensionOption>(ASPECT_RATIO_DIMENSIONS["1:1 (Square)"][2]);
  const [gensPerModel, setGensPerModel] = useState(1);

  // Refresh model list live từ AA Image Lab qua Browser Gateway.
  // Bỏ cache — mỗi lần bấm = 1 browser session scrape DOM tươi.
  const refreshModels = async () => {
    if (!selectedEmail || refreshing) return;
    setRefreshing(true);
    setRefreshError("");
    try {
      const loaded = await api.aaRefreshModels(selectedEmail, mode);
      setModels(loaded);
      // Auto-select top-ranked model nếu user chưa pick.
      setSelectedIds((prev) => {
        if (prev.size > 0) return prev;
        const ranked = loaded
          .filter((m) => (mode === "text_to_image" ? m.hasTtiEndpoint : m.hasItiEndpoint))
          .filter((m) => (mode === "text_to_image" ? m.ttiElo !== null : m.itiElo !== null))
          .sort((a, b) => {
            const aElo = mode === "text_to_image" ? a.ttiElo! : a.itiElo!;
            const bElo = mode === "text_to_image" ? b.ttiElo! : b.itiElo!;
            return bElo - aElo;
          });
        return ranked.length > 0 ? new Set([ranked[0].id]) : prev;
      });
    } catch (e) {
      setRefreshError(String(e));
    } finally {
      setRefreshing(false);
    }
  };

  const toggleModel = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectTop = (n: number) => {
    const ranked = models
      .filter((m) => (mode === "text_to_image" ? m.hasTtiEndpoint : m.hasItiEndpoint))
      .filter((m) => (mode === "text_to_image" ? m.ttiElo !== null : m.itiElo !== null))
      .sort((a, b) => {
        const aElo = mode === "text_to_image" ? a.ttiElo! : a.itiElo!;
        const bElo = mode === "text_to_image" ? b.ttiElo! : b.itiElo!;
        return bElo - aElo;
      });
    setSelectedIds(new Set(ranked.slice(0, n).map((m) => m.id)));
  };

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
      m.creator.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const estCost = (() => {
    let total = 0;
    for (const id of selectedIds) {
      const m = models.find((x) => x.id === id);
      if (!m) continue;
      const price = mode === "text_to_image" ? m.ttiPricePerGeneration : m.itiPricePerGeneration;
      total += (price ?? 0) * gensPerModel;
    }
    return total;
  })();

  return {
    models,
    filteredModels,
    selectedIds,
    setSelectedIds,
    modelSearch,
    setModelSearch,
    toggleModel,
    selectTop,
    aspectRatio,
    setAspectRatio,
    dimension,
    setDimension,
    gensPerModel,
    setGensPerModel,
    estCost,
    refreshModels,
    refreshing,
    refreshError,
  };
}
