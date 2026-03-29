import type z from "zod";
import type { NasaSearchFiltersSchema } from "@/hooks/useNasaSearch";

interface NasaSearchLink {
  rel: "next" | "prev";
  prompt: "Next" | "Previous";
  href: string;
}

export type NasaSearchItem = {
  href: string;
  data: Array<{
    center: string;
    date_created: string;
    description: string;
    description_508: string;
    keywords: string[];
    media_type: "image" | "video" | "audio";
    nasa_id: string;
    photographer?: string;
    secondary_creator?: string;
    title: string;
    album?: string[];
  }>;
  links: Array<{
    href: string;
    rel: string;
    render: string;
    width: number;
    height: number;
    size: number;
  }>;
};

export interface NasaSearchResult {
  collection: {
    version: string;
    href: string;
    items: NasaSearchItem[];
    metadata: {
      total_hits: number;
    };
    links: NasaSearchLink[];
  };
}

export function buildUrl(
  filters: z.infer<typeof NasaSearchFiltersSchema>,
  page = 1,
) {
  const params = new URLSearchParams();
  const base = "https://images-api.nasa.gov/search";

  if (filters.q) params.set("q", filters.q);
  if (filters.y1) params.set("year_start", String(filters.y1));
  if (filters.y2) params.set("year_end", String(filters.y2));

  // Media type
  if (filters.media !== "all") {
    params.set("media_type", filters.media);
  }

  // The api only supports filtering by one center at a time, so we take the first
  // If there are multiple centers, we can implement client-side filtering later
  if (filters.centers.length === 1) {
    params.set("center", filters.centers[0]);
  }

  params.set("page", String(page));
  return `${base}?${params.toString()}`;
}

export function applyClientFilters(
  items: NasaSearchItem[],
  filters: z.infer<typeof NasaSearchFiltersSchema>,
) {
  let result = [...items];

  const getMaxImageArea = (item: NasaSearchItem) => {
    const imageAreas = item.links
      .filter(
        (link) =>
          link.render === "image" &&
          Number.isFinite(link.width) &&
          Number.isFinite(link.height) &&
          link.width > 0 &&
          link.height > 0,
      )
      .map((link) => link.width * link.height);

    if (imageAreas.length === 0) return null;

    return Math.max(...imageAreas);
  };

  if (filters.centers.length > 1) {
    const normalizedCenters = filters.centers.map((center) =>
      center.toUpperCase(),
    );
    result = result.filter((item) => {
      const center = item.data[0]?.center?.toUpperCase();
      return center ? normalizedCenters.includes(center) : false;
    });
  }

  if (filters.size !== "all") {
    const ranges = {
      small: { min: 0, max: 640 * 480 },
      medium: { min: 640 * 480, max: 1920 * 1080 },
      large: { min: 1920 * 1080, max: Infinity },
    };

    const { min, max } = ranges[filters.size];

    result = result.filter((item) => {
      const area = getMaxImageArea(item);
      if (!area) return false;

      return area >= min && area <= max;
    });
  }

  if (filters.aspect_resolution !== "all") {
    result = result.filter((item) => {
      const link = item.links.find((link) => link.render === "image");
      if (!link) return false;

      const aspectRatio = link.width / link.height;

      switch (filters.aspect_resolution) {
        case "portrait":
          return aspectRatio < 1;
        case "landscape":
          return aspectRatio > 1;
        case "square":
          return aspectRatio === 1;
        case "9:16":
          return Math.abs(aspectRatio - 9 / 16) < 0.01;
        case "16:9":
          return Math.abs(aspectRatio - 16 / 9) < 0.01;
        default:
          return true;
      }
    });
  }

  if (filters.sort !== "relevance") {
    result.sort((a, b) => {
      const dateA = new Date(a.data[0]?.date_created || 0);
      const dateB = new Date(b.data[0]?.date_created || 0);
      if (filters.sort === "date_desc") {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
  }

  return result;
}
