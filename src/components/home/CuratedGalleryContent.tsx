"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import Masonry from "react-masonry-css";
import { toast } from "sonner";
import { ItemModal } from "@/components/common/ItemModal";
import {
  getAspectRatio,
  MASONRY_BREAKPOINTS,
  MediaGrid,
} from "@/components/common/MediaGrid";
import { useNasaPopular, useNasaRecent } from "@/hooks/useNasaCurated";
import type { NasaSearchItem } from "@/utils/nasa";

type CuratedMode = "recent" | "popular";

const SKELETON_KEYS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
] as const;

type CuratedGalleryContentProps = {
  mode: CuratedMode;
};

export default function CuratedGalleryContent({
  mode,
}: CuratedGalleryContentProps) {
  const recentQuery = useNasaRecent();
  const popularQuery = useNasaPopular();

  const data = mode === "recent" ? recentQuery.data : popularQuery.data;
  const loading =
    mode === "recent" ? recentQuery.isLoading : popularQuery.isLoading;
  const error = mode === "recent" ? recentQuery.error : popularQuery.error;
  const pageTitle = mode === "recent" ? "Recent Highlights" : "Popular";
  const pageDescription =
    mode === "recent"
      ? "Fresh media recently added to NASA's public archive."
      : "Most viewed and highlighted media from NASA's archive.";

  const items = useMemo(() => data ?? [], [data]);
  const [selectedNasaId, setSelectedNasaId] = useState<string | null>(null);
  const preloadedImagesRef = useRef(new Set<string>());

  const preloadImage = (src?: string) => {
    if (!src || typeof window === "undefined") return;
    if (preloadedImagesRef.current.has(src)) return;

    preloadedImagesRef.current.add(src);
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
  };

  const preloadFromIndex = (index: number, sourceItems: NasaSearchItem[]) => {
    const current = sourceItems[index];
    if (!current) return;

    const currentThumb =
      current.links?.find(
        (l) => l.rel === "preview" || l.href.includes("~thumb"),
      )?.href ||
      current.links?.find((l) => l.href.includes("~small"))?.href ||
      current.links?.[0]?.href;

    preloadImage(currentThumb);

    const nextOne = sourceItems[index + 1];
    const nextTwo = sourceItems[index + 2];

    const nextOneThumb =
      nextOne?.links?.find(
        (l) => l.rel === "preview" || l.href.includes("~thumb"),
      )?.href ||
      nextOne?.links?.find((l) => l.href.includes("~small"))?.href ||
      nextOne?.links?.[0]?.href;

    const nextTwoThumb =
      nextTwo?.links?.find(
        (l) => l.rel === "preview" || l.href.includes("~thumb"),
      )?.href ||
      nextTwo?.links?.find((l) => l.href.includes("~small"))?.href ||
      nextTwo?.links?.[0]?.href;

    preloadImage(nextOneThumb);
    preloadImage(nextTwoThumb);
  };

  const skeletonAspectRatios = useMemo(() => {
    const recentRatios = items
      .map((item) => getAspectRatio(item.links))
      .slice(-SKELETON_KEYS.length);

    if (recentRatios.length === 0) {
      return SKELETON_KEYS.map(() => "16 / 9");
    }

    return SKELETON_KEYS.map(
      (_, index) => recentRatios[index % recentRatios.length],
    );
  }, [items]);

  useEffect(() => {
    if (!error) return;

    const message = error instanceof Error ? error.message : "Unexpected error";
    toast.error(message);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-12 md:py-20">
      <header className="mb-10 text-center lg:text-left">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">{pageDescription}</p>
      </header>

      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-20 text-center"
        >
          <p className="mb-2 font-display text-3xl text-white/30">
            No media found
          </p>
          <p className="font-light text-white/40">Try again in a moment.</p>
        </motion.div>
      )}

      <MediaGrid
        items={items}
        openItem={setSelectedNasaId}
        preloadFromIndex={preloadFromIndex}
      />

      {loading && (
        <div className="relative z-10 flex justify-center py-24">
          <div className="mx-auto w-full max-w-7xl">
            <Masonry
              breakpointCols={MASONRY_BREAKPOINTS}
              className="-ml-6 flex w-auto"
              columnClassName="pl-6 bg-clip-padding space-y-6"
            >
              {SKELETON_KEYS.map((key, index) => (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={key}
                  className="overflow-hidden rounded-xl border border-white/5 bg-[#111] animate-pulse"
                  style={{ aspectRatio: skeletonAspectRatios[index] }}
                >
                  <div className="h-full w-full bg-white/5" />
                </motion.div>
              ))}
            </Masonry>
          </div>
        </div>
      )}

      <ItemModal
        isOpen={Boolean(selectedNasaId)}
        nasaId={selectedNasaId}
        items={items}
        onClose={() => setSelectedNasaId(null)}
      />
    </main>
  );
}
