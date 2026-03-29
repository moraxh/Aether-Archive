"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { z } from "zod";
import {
  applyClientFilters,
  buildUrl,
  type NasaSearchResult,
} from "@/utils/nasa";

function lockDocumentScroll() {
  if (typeof window === "undefined") return;

  const html = document.documentElement;
  const body = document.body;

  if (body.dataset.modalScrollLocked === "1") return;

  body.dataset.modalPrevOverflow = body.style.overflow || "";
  html.dataset.modalPrevOverflow = html.style.overflow || "";
  body.dataset.modalPrevPaddingRight = body.style.paddingRight || "";

  const scrollbarWidth = window.innerWidth - html.clientWidth;

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }

  body.dataset.modalScrollLocked = "1";
}

function unlockDocumentScroll() {
  if (typeof window === "undefined") return;

  const html = document.documentElement;
  const body = document.body;

  if (body.dataset.modalScrollLocked !== "1") return;

  body.style.overflow = body.dataset.modalPrevOverflow || "";
  html.style.overflow = html.dataset.modalPrevOverflow || "";
  body.style.paddingRight = body.dataset.modalPrevPaddingRight || "";

  delete body.dataset.modalScrollLocked;
  delete body.dataset.modalPrevOverflow;
  delete html.dataset.modalPrevOverflow;
  delete body.dataset.modalPrevPaddingRight;
}

export const NasaSearchFiltersSchema = z.object({
  q: z.string().optional(),
  media: z.enum(["image", "video", "audio", "all"]).default("all"),
  y1: z.coerce.number().default(1900),
  y2: z.coerce.number().default(new Date().getFullYear()),
  centers: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((center) => center.trim().toUpperCase())
            .filter(Boolean)
        : [],
    ),
  sort: z.enum(["relevance", "date_desc", "date_asc"]).default("relevance"),
  size: z.enum(["small", "medium", "large", "all"]).default("all"),
  aspect_resolution: z
    .enum(["portrait", "landscape", "square", "9:16", "16:9", "all"])
    .default("all"),
  item: z.string().nullable().optional().default(null),
});

const defaultFilters: z.infer<typeof NasaSearchFiltersSchema> = {
  q: "",
  media: "all",
  y1: 1900,
  y2: new Date().getFullYear(),
  centers: [],
  sort: "relevance",
  aspect_resolution: "all",
  size: "all",
  item: null,
};

export default function useNasaSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchString = searchParams.toString();

  const updateSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchString);
      updater(params);
      const nextSearchString = params.toString();

      if (nextSearchString === searchString) return;

      const nextHref = nextSearchString ? `?${nextSearchString}` : "?";
      router.replace(nextHref, { scroll: false });
    },
    [router, searchString],
  );

  const filters = useMemo(() => {
    const parsed = NasaSearchFiltersSchema.safeParse(
      Object.fromEntries(new URLSearchParams(searchString).entries()),
    );

    if (!parsed.success) {
      console.warn(
        "Invalid search parameters, using default filters",
        parsed.error,
      );
      return defaultFilters;
    }
    return parsed.data;
  }, [searchString]);

  const urlFilters = useMemo(() => {
    const rest = {
      q: filters.q,
      media: filters.media,
      y1: filters.y1,
      y2: filters.y2,
      centers: filters.centers,
      sort: filters.sort,
      size: filters.size,
      aspect_resolution: filters.aspect_resolution,
      item: null,
    };
    return rest;
  }, [
    filters.q,
    filters.media,
    filters.y1,
    filters.y2,
    filters.centers,
    filters.sort,
    filters.size,
    filters.aspect_resolution,
  ]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["nasa-search", urlFilters],
    queryFn: async ({ pageParam = 1, signal }) => {
      if (!urlFilters.q) {
        return { items: [], total: 0, hasMore: false };
      }
      const url = buildUrl(urlFilters, pageParam);
      const res = await fetch(url, { signal });

      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }

      const data: NasaSearchResult = await res.json();
      let newItems = data.collection.items;
      newItems = applyClientFilters(newItems, urlFilters);

      const hasMore = (data.collection.links || []).some(
        (l) => l.rel === "next",
      );

      return {
        items: newItems,
        total: data.collection.metadata.total_hits,
        hasMore,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!filters.q,
  });

  const setFilter = useCallback(
    (key: keyof z.infer<typeof NasaSearchFiltersSchema>, value: unknown) => {
      updateSearchParams((params) => {
        const isEmpty =
          !value ||
          value === "all" ||
          (Array.isArray(value) && value.length === 0);

        if (isEmpty) {
          params.delete(key);
        } else {
          const nextValue = Array.isArray(value)
            ? value
                .map((v) => String(v).trim().toUpperCase())
                .filter(Boolean)
                .join(",")
            : String(value);
          params.set(key, nextValue);
        }
      });
    },
    [updateSearchParams],
  );

  const openItem = useCallback(
    (nasa_id: string) => {
      lockDocumentScroll();
      updateSearchParams((params) => {
        params.set("item", nasa_id);
      });
    },
    [updateSearchParams],
  );

  const closeItem = useCallback(() => {
    unlockDocumentScroll();
    updateSearchParams((params) => {
      params.delete("item");
    });
  }, [updateSearchParams]);

  const items = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) || [];
  }, [data]);

  const total = useMemo(() => {
    return data?.pages[0]?.total || 0;
  }, [data]);

  return {
    items,
    total,
    loading: isLoading,
    hasMore: hasNextPage,
    isFetchingNextPage,
    error: isError ? (error as Error).message : null,
    filters,
    setFilter,
    openItem,
    closeItem,
    fetchNextPage,
  };
}
