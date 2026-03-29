"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

type NasaItemDetails = {
  item: {
    data: Array<{
      title: string;
      description?: string;
      date_created: string;
      center?: string;
      media_type: "image" | "video" | "audio";
      nasa_id: string;
      keywords?: string[];
    }>;
    links?: Array<{ href: string }>;
  };
  assets: string[];
};

type NasaSearchByIdResponse = {
  collection: {
    items: NasaItemDetails["item"][];
  };
};

type NasaAssetResponse = {
  collection: {
    items: Array<{ href: string }>;
  };
};

export function useNasaItem(nasa_id: string | null) {
  return useQuery<NasaItemDetails | null>({
    queryKey: ["nasa-item", nasa_id],
    queryFn: async () => {
      if (!nasa_id) return null;

      // Fetch metadata
      const metaRes = await fetch(
        `https://images-api.nasa.gov/search?nasa_id=${nasa_id}`,
      );
      if (!metaRes.ok) throw new Error("Failed to fetch metadata");
      const metaData = (await metaRes.json()) as NasaSearchByIdResponse;
      const item = metaData.collection.items[0];

      if (!item) throw new Error("Item not found");

      // Fetch assets (images/video/audio URLs)
      const assetRes = await fetch(
        `https://images-api.nasa.gov/asset/${nasa_id}`,
      );
      if (!assetRes.ok) throw new Error("Failed to fetch assets");
      const assetData = (await assetRes.json()) as NasaAssetResponse;
      const assets = assetData.collection.items.map((asset) => asset.href);

      return {
        item,
        assets,
      };
    },
    enabled: !!nasa_id,
    placeholderData: keepPreviousData,
  });
}
