import { useQuery } from "@tanstack/react-query";
import type { NasaSearchResult } from "@/utils/nasa";

export function useNasaRecent() {
  return useQuery({
    queryKey: ["nasa-recent"],
    queryFn: async () => {
      const res = await fetch("https://images-assets.nasa.gov/recent.json");
      if (!res.ok) {
        throw new Error("Failed to fetch recent NASA assets");
      }
      const data = (await res.json()) as NasaSearchResult;
      return data.collection.items || [];
    },
  });
}

export function useNasaPopular() {
  return useQuery({
    queryKey: ["nasa-popular"],
    queryFn: async () => {
      const res = await fetch("https://images-assets.nasa.gov/popular.json");
      if (!res.ok) {
        throw new Error("Failed to fetch popular NASA assets");
      }
      const data = (await res.json()) as NasaSearchResult;
      return data.collection.items || [];
    },
  });
}
