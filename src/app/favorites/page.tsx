"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

type MediaFilter = (typeof MEDIA_FILTERS)[number];
type SortOption = "saved_desc" | "saved_asc" | "title_asc";

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
  const [query, setQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("saved_desc");

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  const filteredFavorites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let result = favorites.filter((item) => {
      const mediaMatch =
        mediaFilter === "all" ? true : item.media_type === mediaFilter;
      const queryMatch = normalizedQuery
        ? item.title.toLowerCase().includes(normalizedQuery) ||
          item.nasa_id.toLowerCase().includes(normalizedQuery)
        : true;

      return mediaMatch && queryMatch;
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
  }, [favorites, mediaFilter, query, sortBy]);

  const hasActiveFilters = query.trim().length > 0 || mediaFilter !== "all";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-12 md:py-20">
      <header className="mb-8">
        <h1 className="font-display text-4xl tracking-tight md:text-5xl">
          Saved
        </h1>
        <p className="mt-3 max-w-2xl text-white/60">
          Filter your saved NASA media by title, ID, media type, and order.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border border-white/10 bg-[#111]/70 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2 text-xs tracking-widest text-white/45 uppercase">
          <SlidersHorizontal size={14} />
          Filters
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.3fr_auto_auto] md:items-center">
          <label className="relative block">
            <span className="sr-only">Search saved items</span>
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/45"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title or NASA ID"
              className="h-10 w-full rounded-xl border border-white/10 bg-black/30 pr-3 pl-9 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
            />
          </label>

          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Media filter</legend>
            {MEDIA_FILTERS.map((media) => {
              const active = mediaFilter === media;
              return (
                <button
                  key={media}
                  type="button"
                  onClick={() => setMediaFilter(media)}
                  className={`rounded-full px-3 py-2 text-xs uppercase tracking-wide transition-colors ${active ? "bg-white text-black" : "border border-white/15 text-white/70 hover:text-white"}`}
                >
                  {media}
                </button>
              );
            })}
          </fieldset>

          <label className="flex items-center gap-2 text-sm text-white/70">
            <span className="sr-only">Sort saved items</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white focus:border-white/30 focus:outline-none"
              aria-label="Sort saved items"
            >
              <option value="saved_desc">Latest saved</option>
              <option value="saved_asc">Oldest saved</option>
              <option value="title_asc">Title A-Z</option>
            </select>
          </label>
        </div>
      </section>

      <section
        aria-live="polite"
        className="rounded-2xl border border-white/10 bg-[#111]/70 p-8 text-white/70"
      >
        {filteredFavorites.length === 0 ? (
          <>
            <p className="text-base">
              {hasActiveFilters
                ? "No saved items match your filters."
                : "No saved items yet."}
            </p>
            <p className="mt-2 text-sm text-white/50">
              {hasActiveFilters
                ? "Try a different query or reset media filter."
                : "Explore the archive and save your favorite discoveries."}
            </p>
          </>
        ) : (
          <ul
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Saved items"
          >
            {filteredFavorites.map((item) => (
              <li
                key={item.nasa_id}
                className="rounded-xl border border-white/10 bg-black/25 p-4"
              >
                <p className="line-clamp-2 text-sm font-medium text-white">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-white/55 uppercase tracking-wide">
                  {item.media_type} · {item.nasa_id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
