"use client";

import {
  ArrowRight,
  Filter,
  Image as ImageIcon,
  Mic,
  Search,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ItemModal } from "@/components/common/ItemModal";
import useNasaSearch from "@/hooks/useNasaSearch";

const MEDIA_TYPES = [
  { id: "all", label: "All Media", icon: null },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Video },
  { id: "audio", label: "Audio", icon: Mic },
] as const;

function getThumbHref(
  links: Array<{ href: string; rel?: string }> | undefined,
): string | undefined {
  return (
    links?.find((l) => l.rel === "preview" || l.href.includes("~thumb"))
      ?.href ||
    links?.find((l) => l.href.includes("~small"))?.href ||
    links?.[0]?.href
  );
}

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "date_desc", label: "Newest First" },
  { id: "date_asc", label: "Oldest First" },
] as const;

const ASPECT_OPTIONS = [
  { id: "all", label: "All Aspects" },
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
  { id: "square", label: "Square" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
] as const;

const SIZE_OPTIONS = [
  { id: "all", label: "All Sizes" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
] as const;

const CENTERS = [
  "JPL",
  "GSFC",
  "JSC",
  "KSC",
  "ARC",
  "MSFC",
  "SSC",
  "AFRC",
  "LARC",
  "GRC",
  "HQ",
  "WSTF",
] as const;

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

export default function HomeContent() {
  const {
    items,
    total,
    loading,
    hasMore,
    error,
    filters,
    setFilter,
    openItem,
    closeItem,
    fetchNextPage,
  } = useNasaSearch();
  const [localQuery, setLocalQuery] = useState(filters.q || "");
  const [showFilters, setShowFilters] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const preloadedImagesRef = useRef(new Set<string>());

  const preloadImage = useCallback((src?: string) => {
    if (!src || typeof window === "undefined") return;
    if (preloadedImagesRef.current.has(src)) return;

    preloadedImagesRef.current.add(src);
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
  }, []);

  const preloadFromIndex = useCallback(
    (index: number) => {
      const current = items[index];
      if (!current) return;

      const currentThumb = getThumbHref(current.links);
      preloadImage(currentThumb);

      const nextOne = items[index + 1];
      const nextTwo = items[index + 2];

      preloadImage(nextOne ? getThumbHref(nextOne.links) : undefined);
      preloadImage(nextTwo ? getThumbHref(nextTwo.links) : undefined);
    },
    [items, preloadImage],
  );

  useEffect(() => {
    setLocalQuery(filters.q || "");
  }, [filters.q]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (!observerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loading) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: "1000px" },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, fetchNextPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() !== filters.q) {
      setFilter("q", localQuery.trim());
    }
  };

  const clearFilters = () => {
    setFilter("media", "all");
    setFilter("sort", "relevance");
    setFilter("centers", []);
    setFilter("size", "all");
    setFilter("aspect_resolution", "all");
  };

  const activeFiltersCount =
    (filters.media !== "all" ? 1 : 0) +
    (filters.sort !== "relevance" ? 1 : 0) +
    (filters.size !== "all" ? 1 : 0) +
    (filters.aspect_resolution !== "all" ? 1 : 0) +
    filters.centers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-6 py-12 md:py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="mb-12 max-w-3xl text-center"
      >
        <h1 className="mb-6 font-display text-5xl font-light tracking-tight md:text-7xl">
          Explore the Cosmos
        </h1>
        <p className="text-lg font-light leading-relaxed text-white/50 md:text-xl">
          Search through NASA&apos;s vast collection of images, audio, and
          video. A curated experience for the curious mind.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        onSubmit={handleSearchSubmit}
        className="group relative mb-8 w-full max-w-2xl"
      >
        <div className="absolute inset-0 rounded-full bg-white/5 blur-xl transition-colors duration-500 group-hover:bg-white/10" />
        <div className="relative flex items-center overflow-hidden rounded-full border border-white/10 bg-[#111] transition-colors focus-within:border-white/30">
          <div className="pl-6 pr-4 text-white/40">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search for galaxies, missions, astronauts..."
            className="w-full bg-transparent py-5 text-lg font-light text-white placeholder-white/30 focus:outline-none"
            aria-label="Search NASA archive"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery("");
                setFilter("q", "");
              }}
              className="p-4 text-white/40 transition-colors hover:text-white"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="mr-2 flex items-center justify-center rounded-full bg-white p-3 text-black transition-colors hover:bg-white/90"
            aria-label="Run search"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="mb-12 flex w-full max-w-7xl flex-col items-center"
      >
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
          aria-expanded={showFilters}
          aria-controls="home-filters"
        >
          <Filter size={16} />
          <span>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </span>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              id="home-filters"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mt-8 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
            >
              <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                    Media Type
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {MEDIA_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setFilter("media", type.id)}
                        className={`flex items-center space-x-2 rounded-full px-4 py-2 text-sm transition-all ${filters.media === type.id ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                      >
                        {type.icon && <type.icon size={14} />}
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                    Sort By
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setFilter("sort", opt.id)}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${filters.sort === opt.id ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                      Aspect Ratio
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFilter("aspect_resolution", opt.id)}
                          className={`rounded-full px-3 py-1.5 text-xs transition-all ${filters.aspect_resolution === opt.id ? "border border-white/30 bg-white/20 text-white" : "border border-white/10 bg-transparent text-white/50 hover:text-white/80"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                      Size
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFilter("size", opt.id)}
                          className={`rounded-full px-3 py-1.5 text-xs transition-all ${filters.size === opt.id ? "border border-white/30 bg-white/20 text-white" : "border border-white/10 bg-transparent text-white/50 hover:text-white/80"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                    NASA Center
                  </h3>
                  <div className="custom-scrollbar flex max-h-48 flex-wrap gap-2 overflow-y-auto pr-2">
                    {CENTERS.map((center) => {
                      const isSelected = filters.centers.includes(center);
                      return (
                        <button
                          type="button"
                          key={center}
                          onClick={() => {
                            const newCenters = isSelected
                              ? filters.centers.filter((c) => c !== center)
                              : [...filters.centers, center];
                            setFilter("centers", newCenters);
                          }}
                          className={`rounded-full px-3 py-1.5 text-xs transition-all ${isSelected ? "border border-white/30 bg-white/20 text-white" : "border border-white/10 bg-transparent text-white/50 hover:text-white/80"}`}
                        >
                          {center}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mx-8 mb-8 flex justify-end border-t border-white/10 pt-6">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-white/50 transition-colors hover:text-white"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="w-full"
      >
        {!loading && items.length === 0 && filters.q && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="mb-4 font-display text-3xl text-white/30">
              No discoveries found
            </p>
            <p className="font-light text-white/40">
              Try adjusting your search terms or filters.
            </p>
          </motion.div>
        )}

        {total > 0 && (
          <p className="mb-6 text-center text-sm text-white/40 lg:text-left">
            {total.toLocaleString()} results found
          </p>
        )}

        <div className="relative z-10 columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">
          {items.map((item, index) => {
            const thumb = getThumbHref(item.links);
            const thumbLink = item.links?.find((l) => l.href === thumb);
            if (!thumb) return null;

            const aspectRatio =
              thumbLink?.width && thumbLink?.height
                ? `${thumbLink.width} / ${thumbLink.height}`
                : "16 / 9";

            const nasaId = item.data[0].nasa_id;

            return (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "400px" }}
                transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
                key={nasaId}
                onClick={() => openItem(nasaId)}
                onMouseEnter={() => preloadFromIndex(index)}
                onFocus={() => preloadFromIndex(index)}
                className="group relative block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-[#111] text-left transition-all duration-500 hover:border-white/20"
                style={{ aspectRatio }}
                aria-label={`Open item ${item.data[0].title}`}
                aria-haspopup="dialog"
              >
                <motion.div
                  layoutId={`gallery-image-${nasaId}`}
                  className="relative h-full w-full"
                >
                  <Image
                    src={thumb}
                    alt={item.data[0].title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
                  />
                </motion.div>

                <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/90 via-black/20 to-transparent p-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-2 block text-xs font-semibold tracking-widest text-white/60 uppercase">
                        {item.data[0].media_type}
                      </span>
                      <h3 className="line-clamp-2 font-display text-lg leading-snug text-white">
                        {item.data[0].title}
                      </h3>
                    </div>
                  </div>
                </div>

                {item.data[0].media_type !== "image" && (
                  <div className="absolute top-4 left-4 rounded-full bg-black/50 p-2 text-white/80 backdrop-blur-md">
                    {item.data[0].media_type === "video" ? (
                      <Video size={16} />
                    ) : (
                      <Mic size={16} />
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {(loading || hasMore) && filters.q && (
          <div
            ref={observerRef}
            className="relative z-10 flex justify-center py-24"
          >
            {loading ? (
              <div className="mx-auto w-full max-w-7xl">
                <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4">
                  {SKELETON_KEYS.map((key) => (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={key}
                      className="break-inside-avoid overflow-hidden rounded-xl border border-white/5 bg-[#111] animate-pulse"
                      style={{ height: "250px" }}
                    >
                      <div className="h-full w-full bg-white/5" />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs tracking-widest text-white/20 uppercase animate-pulse">
                Scroll for more
              </span>
            )}
          </div>
        )}
      </motion.div>

      <ItemModal
        isOpen={Boolean(filters.item)}
        nasaId={filters.item}
        items={items}
        onClose={closeItem}
      />
    </motion.div>
  );
}
