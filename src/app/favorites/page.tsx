"use client";

import { useQuery } from "@tanstack/react-query";
import { Filter, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ItemModal } from "@/components/common/ItemModal";
import { MediaGrid } from "@/components/common/MediaGrid";
import type { NasaSearchItem, NasaSearchResult } from "@/utils/nasa";

type FavoriteMedia = "image" | "video" | "audio";

type FavoriteItem = {
  nasa_id: string;
  title: string;
  media_type: FavoriteMedia;
  date_created?: string;
  saved_at?: string;
};

const FAVORITES_STORAGE_KEY = "aether-favorites-v1";

const MEDIA_FILTERS = ["all", "image", "video", "audio"] as const;
const MEDIA_FILTER_LABELS: Record<MediaFilter, string> = {
  all: "All",
  image: "Image",
  video: "Video",
  audio: "Audio",
};

type MediaFilter = (typeof MEDIA_FILTERS)[number];
type SortOption = "saved_desc" | "saved_asc" | "title_asc";

function writeFavorites(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
}

async function fetchFavoriteItemsByIds(
  ids: string[],
): Promise<NasaSearchItem[]> {
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      const res = await fetch(
        `https://images-api.nasa.gov/search?nasa_id=${encodeURIComponent(id)}`,
      );

      if (!res.ok) return null;

      const data = (await res.json()) as NasaSearchResult;
      return data.collection.items[0] ?? null;
    }),
  );

  return results.flatMap((entry) =>
    entry.status === "fulfilled" && entry.value ? [entry.value] : [],
  );
}

function readFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is FavoriteItem => {
        return (
          item &&
          typeof item.nasa_id === "string" &&
          typeof item.title === "string" &&
          (item.media_type === "image" ||
            item.media_type === "video" ||
            item.media_type === "audio")
        );
      })
      .map((item) => ({
        ...item,
        saved_at:
          typeof item.saved_at === "string"
            ? item.saved_at
            : (item.date_created ?? new Date(0).toISOString()),
      }));
  } catch {
    return [];
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("saved_desc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNasaId, setSelectedNasaId] = useState<string | null>(null);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  const removeFavorite = (nasaId: string) => {
    setFavorites((prev) => {
      const next = prev.filter((item) => item.nasa_id !== nasaId);
      writeFavorites(next);
      return next;
    });

    if (selectedNasaId === nasaId) {
      setSelectedNasaId(null);
    }

    toast.success("Removed from favorites");
  };

  const filteredFavorites = useMemo(() => {
    let result = favorites.filter((item) => {
      const mediaMatch =
        mediaFilter === "all" ? true : item.media_type === mediaFilter;

      return mediaMatch;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }

      const dateA = new Date(a.saved_at ?? 0).getTime();
      const dateB = new Date(b.saved_at ?? 0).getTime();

      return sortBy === "saved_desc" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [favorites, mediaFilter, sortBy]);

  const activeFiltersCount =
    (mediaFilter !== "all" ? 1 : 0) + (sortBy !== "saved_desc" ? 1 : 0);

  const filteredFavoriteIds = useMemo(
    () => filteredFavorites.map((item) => item.nasa_id),
    [filteredFavorites],
  );

  const {
    data: favoriteItems = [],
    isLoading: loadingItems,
    error: favoriteItemsError,
  } = useQuery({
    queryKey: ["favorite-items", filteredFavoriteIds],
    queryFn: () => fetchFavoriteItemsByIds(filteredFavoriteIds),
    enabled: filteredFavoriteIds.length > 0,
  });

  useEffect(() => {
    if (!favoriteItemsError) return;

    const message =
      favoriteItemsError instanceof Error
        ? favoriteItemsError.message
        : "Failed to load saved media";
    toast.error(message);
  }, [favoriteItemsError]);

  const clearFilters = () => {
    setMediaFilter("all");
    setSortBy("saved_desc");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6 py-12 md:py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="mb-12 max-w-3xl text-center"
      >
        <h1 className="mb-6 font-display text-5xl font-light tracking-tight md:text-7xl">
          Saved Favorites
        </h1>
        <p className="text-lg font-light leading-relaxed text-white/50 md:text-xl">
          Your personal collection of NASA discoveries.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="mb-12 flex w-full max-w-7xl flex-col items-center"
      >
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition-colors hover:border-white/30 hover:text-white"
          aria-expanded={showFilters}
          aria-controls="saved-filters"
        >
          <Filter size={16} />
          <span>
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </span>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              id="saved-filters"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mt-8 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
            >
              <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                    Media Type
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {MEDIA_FILTERS.map((media) => (
                      <button
                        key={media}
                        type="button"
                        onClick={() => setMediaFilter(media)}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${mediaFilter === media ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                      >
                        {MEDIA_FILTER_LABELS[media]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                    Sort By
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "saved_desc", label: "Latest saved" },
                      { id: "saved_asc", label: "Oldest saved" },
                      { id: "title_asc", label: "Title A-Z" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setSortBy(opt.id as SortOption)}
                        className={`rounded-full px-4 py-2 text-sm transition-all ${sortBy === opt.id ? "bg-white text-black" : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
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
        transition={{ delay: 1.2, duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
        className="w-full"
      >
        {favorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="mb-4 font-display text-3xl text-white/30">
              No saved items yet
            </p>
            <p className="font-light text-white/40">
              Explore the archive and save your favorite discoveries.
            </p>
          </motion.div>
        )}

        {favorites.length > 0 && filteredFavorites.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-24 text-center"
          >
            <p className="mb-4 font-display text-3xl text-white/30">
              No matches found
            </p>
            <p className="font-light text-white/40">
              Try adjusting your media type or sorting filters.
            </p>
          </motion.div>
        )}

        {filteredFavorites.length > 0 && (
          <p className="mb-6 text-center text-sm text-white/40 lg:text-left">
            {loadingItems
              ? "Loading saved media..."
              : `${favoriteItems.length.toLocaleString()} saved results`}
          </p>
        )}

        <MediaGrid
          items={favoriteItems}
          openItem={setSelectedNasaId}
          renderItemActions={(item) => (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeFavorite(item.nasa_id);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white/85 backdrop-blur-md transition-colors hover:border-white/50 hover:text-white"
              aria-label={`Remove ${item.title} from favorites`}
              title="Remove from favorites"
            >
              <Trash2 size={16} />
            </button>
          )}
        />
      </motion.div>

      <ItemModal
        isOpen={Boolean(selectedNasaId)}
        nasaId={selectedNasaId}
        items={favoriteItems}
        onClose={() => setSelectedNasaId(null)}
      />
    </motion.div>
  );
}
