import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { ASPECT_RATIO_DIMENSIONS } from "./types";
import type { AAModel, AspectRatioKey, DimensionOption } from "./types";

export function useAAModels(mode: "text_to_image" | "image_editing") {
  const [models, setModels] = useState<AAModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modelSearch, setModelSearch] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>("1:1 (Square)");
  const [dimension, setDimension] = useState<DimensionOption>(ASPECT_RATIO_DIMENSIONS["1:1 (Square)"][2]);
  const [gensPerModel, setGensPerModel] = useState(1);

  useEffect(() => {
    api.aaGetModels(mode).then((loaded) => {
      setModels(loaded);
      // Auto-select the top-ranked model when list loads (if user hasn't picked yet).
      // Top-ranked = highest Elo score for the given mode.
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
        if (ranked.length > 0) {
          return new Set([ranked[0].id]);
        }
        return prev;
      });
    }).catch((e) => { throw e; });
  }, [mode]);

  const toggleModel = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectTop = (n: number) => {
    const top = models
      .filter((m) => (mode === "text_to_image" ? m.hasTtiEndpoint : m.hasItiEndpoint))
      .slice(0, n)
      .map((m) => m.id);
    setSelectedIds(new Set(top));
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
  };
}
