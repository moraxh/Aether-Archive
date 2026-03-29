"use client";

import {
  ArrowRight,
  Filter,
  ImageIcon,
  Mic,
  Search,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ItemModal } from "@/components/common/ItemModal";
import useNasaSearch from "@/hooks/useNasaSearch";

const MEDIA_TYPES = [
  { id: "all", label: "All Media", icon: null },
  { id: "image", label: "Images", icon: ImageIcon },
  { id: "video", label: "Videos", icon: Video },
  { id: "audio", label: "Audio", icon: Mic },
];

const SORT_OPTIONS = [
  { id: "relevance", label: "Relevance" },
  { id: "date_desc", label: "Newest First" },
  { id: "date_asc", label: "Oldest First" },
];

const ASPECT_OPTIONS = [
  { id: "all", label: "All Aspects" },
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
  { id: "square", label: "Square" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
];

const SIZE_OPTIONS = [
  { id: "all", label: "All Sizes" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];

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
];

export default function Home() {
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

  useEffect(() => {
    setLocalQuery(filters.q || "");
  }, [filters.q]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    // Solo creamos el evento una vez que tenemos el ref válido y si hay más elementos, evitar en cada re-render si no es necesario.
    if (!observerRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0, rootMargin: "1200px" },
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, fetchNextPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim() !== filters.q) {
      setFilter("q", localQuery);
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
      className="w-full max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col items-center min-h-screen relative z-10"
    >
      {/* Hero Typography */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.1, 0.0, 1.0] }}
        className="text-center mb-12 max-w-3xl"
      >
        <h1 className="font-display text-5xl md:text-7xl font-light tracking-tight mb-6">
          Explore the Cosmos
        </h1>
        <p className="text-white/50 text-lg md:text-xl font-light leading-relaxed">
          Search through NASA's vast collection of images, audio, and video. A
          curated experience for the curious mind.
        </p>
      </motion.div>

      {/* Search Input */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.8, ease: [0.25, 0.1, 0.0, 1.0] }}
        onSubmit={handleSearchSubmit}
        className="w-full max-w-2xl relative group mb-8"
      >
        <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors duration-500"></div>
        <div className="relative flex items-center bg-[#111] border border-white/10 rounded-full overflow-hidden focus-within:border-white/30 transition-colors">
          <div className="pl-6 pr-4 text-white/40">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search for galaxies, missions, astronauts..."
            className="w-full py-5 bg-transparent text-lg text-white placeholder-white/30 focus:outline-none font-light"
          />
          {localQuery && (
            <button
              type="button"
              onClick={() => {
                setLocalQuery("");
                setFilter("q", "");
              }}
              className="p-4 text-white/40 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="mr-2 p-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors flex items-center justify-center"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.form>

      {/* Filter Toggle & Active Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.8, ease: [0.25, 0.1, 0.0, 1.0] }}
        className="w-full max-w-7xl flex flex-col items-center mb-12"
      >
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-sm text-white/60 hover:text-white transition-colors py-2 px-4 rounded-full border border-white/10 hover:border-white/30 bg-white/5"
        >
          <Filter size={16} />
          <span>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </span>
        </button>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="w-full mt-8 overflow-hidden bg-[#111] border border-white/10 rounded-2xl"
            >
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                {/* Media Type */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                    Media Type
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {MEDIA_TYPES.map((type) => (
                      <button
                        type="button"
                        key={type.id}
                        onClick={() => setFilter("media", type.id)}
                        className={`px-4 py-2 rounded-full text-sm flex items-center space-x-2 transition-all ${filters.media === type.id ? "bg-white text-black" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"}`}
                      >
                        {type.icon && <type.icon size={14} />}
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                    Sort By
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setFilter("sort", opt.id)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${filters.sort === opt.id ? "bg-white text-black" : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio & Size */}
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                      Aspect Ratio
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFilter("aspect_resolution", opt.id)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${filters.aspect_resolution === opt.id ? "bg-white/20 text-white border border-white/30" : "bg-transparent text-white/50 hover:text-white/80 border border-white/10"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                      Size
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_OPTIONS.map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setFilter("size", opt.id)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${filters.size === opt.id ? "bg-white/20 text-white border border-white/30" : "bg-transparent text-white/50 hover:text-white/80 border border-white/10"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Centers */}
                <div className="space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold">
                    NASA Center
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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
                          className={`px-3 py-1.5 rounded-full text-xs transition-all ${isSelected ? "bg-white/20 text-white border border-white/30" : "bg-transparent text-white/50 hover:text-white/80 border border-white/10"}`}
                        >
                          {center}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mx-8 mb-8 pt-6 border-t border-white/10 flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-white/50 hover:text-white transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: [0.25, 0.1, 0.0, 1.0] }}
        className="w-full"
      >
        {!loading && items.length === 0 && filters.q && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <p className="font-display text-3xl text-white/30 mb-4">
              No discoveries found
            </p>
            <p className="text-white/40 font-light">
              Try adjusting your search terms or filters.
            </p>
          </motion.div>
        )}

        {total > 0 && (
          <p className="text-white/40 text-sm mb-6 text-center lg:text-left">
            {total.toLocaleString()} results found
          </p>
        )}

        {/* Masonry Grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 relative z-10">
          {items.map((item, index) => {
            const thumbLink =
              item.links?.find(
                (l) => l.rel === "preview" || l.href.includes("~thumb"),
              ) ||
              item.links?.find((l) => l.href.includes("~small")) ||
              item.links?.[0];
            const thumb = thumbLink?.href;
            if (!thumb) return null;

            const aspectRatio =
              thumbLink?.width && thumbLink?.height
                ? `${thumbLink.width} / ${thumbLink.height}`
                : "auto";

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "400px" }}
                transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
                key={`${item.data[0].nasa_id}-${index}`}
                onClick={() => openItem(item.data[0].nasa_id)}
                className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden bg-[#111] border border-white/5 hover:border-white/20 transition-all duration-500"
                style={{ aspectRatio }}
              >
                <div className="w-full h-full relative">
                  <img
                    src={thumb}
                    alt={item.data[0].title}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-all duration-700 ease-out opacity-0"
                    onLoad={(e) =>
                      e.currentTarget.classList.remove("opacity-0")
                    }
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-white/60 mb-2 block font-semibold">
                        {item.data[0].media_type}
                      </span>
                      <h3 className="text-white font-display text-lg leading-snug line-clamp-2">
                        {item.data[0].title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Persistent Media Icon for Video/Audio */}
                {item.data[0].media_type !== "image" && (
                  <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white/80">
                    {item.data[0].media_type === "video" ? (
                      <Video size={16} />
                    ) : (
                      <Mic size={16} />
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Loading State / Sentinel */}
        {(loading || hasMore) && filters.q && (
          <div
            ref={observerRef}
            className="py-24 flex justify-center relative z-10"
          >
            {loading ? (
              <div className="w-full max-w-7xl mx-auto">
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={`skeleton-${i}`}
                      className="break-inside-avoid rounded-xl overflow-hidden bg-[#111] border border-white/5 animate-pulse"
                      style={{ height: `250px` }}
                    >
                      <div className="w-full h-full bg-white/5"></div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-xs uppercase tracking-widest text-white/20 animate-pulse">
                Scroll for more
              </span>
            )}
          </div>
        )}
      </motion.div>

      {/* Item Modal */}
      <ItemModal
        isOpen={Boolean(filters.item)}
        nasaId={filters.item}
        items={items}
        onClose={closeItem}
      />
    </motion.div>
  );
}
