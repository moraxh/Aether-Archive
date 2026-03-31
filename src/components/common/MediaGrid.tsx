import { motion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";
import Masonry from "react-masonry-css";
import type { NasaSearchItem } from "@/utils/nasa";

export const MASONRY_BREAKPOINTS = {
  default: 4,
  1279: 3,
  1023: 2,
  639: 1,
} as const;

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

export function getAspectRatio(
  links:
    | Array<{ href: string; rel?: string; width?: number; height?: number }>
    | undefined,
): string {
  const thumb = getThumbHref(links);
  const thumbLink = links?.find((l) => l.href === thumb);

  if (thumbLink?.width && thumbLink?.height) {
    return `${thumbLink.width} / ${thumbLink.height}`;
  }

  return "16 / 9";
}

interface MediaGridProps {
  items: NasaSearchItem[];
  openItem: (nasaId: string) => void;
  preloadFromIndex?: (index: number, sourceItems: NasaSearchItem[]) => void;
  renderItemActions?: (item: NasaSearchItem["data"][number]) => ReactNode;
}

export function MediaGrid({
  items,
  openItem,
  preloadFromIndex,
  renderItemActions,
}: MediaGridProps) {
  return (
    <Masonry
      breakpointCols={MASONRY_BREAKPOINTS}
      className="relative z-10 -ml-6 flex w-auto"
      columnClassName="pl-6 bg-clip-padding space-y-6"
    >
      {items.map((item, index) => {
        const itemData = item.data?.[0];
        if (!itemData?.nasa_id) return null;

        const thumb = getThumbHref(item.links);
        if (!thumb) return null;
        const isAboveFold = index < 12;
        const aspectRatio = getAspectRatio(item.links);

        const nasaId = itemData.nasa_id;
        const title = itemData.title || "NASA archive item";
        const mediaType = itemData.media_type;
        const itemYear = itemData.date_created
          ? new Date(itemData.date_created).getFullYear()
          : null;
        const hasValidYear = Number.isFinite(itemYear);

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "400px" }}
            transition={{ duration: 0.5, delay: (index % 10) * 0.05 }}
            key={nasaId}
            className="group relative w-full"
            style={{ aspectRatio }}
          >
            <motion.button
              type="button"
              onClick={() => openItem(nasaId)}
              onMouseEnter={() => preloadFromIndex?.(index, items)}
              onFocus={() => preloadFromIndex?.(index, items)}
              className="relative block h-full w-full cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[#111] text-left transition-all duration-500 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
              aria-label={`Open item ${title}`}
              aria-haspopup="dialog"
            >
              <motion.div className="relative h-full w-full">
                <Image
                  src={thumb}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  quality={60}
                  priority={isAboveFold}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 flex translate-y-4 flex-col p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="mb-2 w-max rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] tracking-wider text-white/90 uppercase backdrop-blur-md">
                    {mediaType}
                  </span>
                  <h3 className="line-clamp-2 text-sm font-medium text-white">
                    {title}
                  </h3>
                  {hasValidYear && (
                    <span className="mt-1 block text-xs text-white/60">
                      {itemYear}
                    </span>
                  )}
                </div>
              </motion.div>
            </motion.button>

            {renderItemActions && (
              <div className="absolute top-3 right-3 z-20">
                {renderItemActions(itemData)}
              </div>
            )}
          </motion.div>
        );
      })}
    </Masonry>
  );
}

export { getThumbHref };
