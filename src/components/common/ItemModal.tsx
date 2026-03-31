"use client";

import {
  Calendar,
  Camera,
  ChevronDown,
  Download,
  Heart,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNasaItem, useNasaPhotoMetadata } from "@/hooks/useNasaItem";
import type { NasaSearchItem } from "@/utils/nasa";

interface ItemModalProps {
  isOpen: boolean;
  nasaId: string | null;
  items: NasaSearchItem[];
  onClose: () => void;
}

const backdropTransition = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.0, 1.0] as const,
};
const panelTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 30,
  mass: 0.9,
};
const DOWNLOAD_LOADING_MIN_MS = 700;

const FAVORITES_STORAGE_KEY = "aether-favorites-v1";

type FavoriteMedia = "image" | "video" | "audio";

type FavoriteItem = {
  nasa_id: string;
  title: string;
  media_type: FavoriteMedia;
  date_created?: string;
  saved_at?: string;
};

type DownloadOption = {
  url: string;
  quality: string;
  resolution: string;
};

type PhotoMetadataEntry = {
  label: string;
  value: string;
};

function dedupeDownloadOptions(options: DownloadOption[]) {
  const seen = new Set<string>();
  const unique: DownloadOption[] = [];

  for (const option of options) {
    const key = `${option.quality.toLowerCase()}::${option.resolution.toLowerCase()}`;
    if (seen.has(key)) continue;

    seen.add(key);
    unique.push(option);
  }

  return unique;
}

type ModalLink = {
  href: string;
  rel?: string;
  width?: number;
  height?: number;
};

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "tif",
  "tiff",
]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "m4v", "webm", "ogv"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "ogg", "flac", "aac"]);

function readFavorites(): FavoriteItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(items: FavoriteItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
}

function getFileExtension(url: string): string {
  const withoutQuery = url.split("?")[0] ?? "";
  const filename = withoutQuery.split("/").pop() ?? "";
  const parts = filename.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : "";
}

function extractResolution(url: string): string | null {
  const dimensions = url.match(/(\d{3,5})[xX](\d{3,5})/);
  if (dimensions?.[1] && dimensions?.[2]) {
    return `${dimensions[1]}x${dimensions[2]}`;
  }

  const quality = url.match(/(\d{3,4})p/i);
  if (quality?.[1]) {
    return `${quality[1]}p`;
  }

  return null;
}

function getQualityLabel(url: string, index: number): string {
  const lower = url.toLowerCase();

  if (lower.includes("~orig")) return "Original";
  if (lower.includes("~large")) return "Large";
  if (lower.includes("~medium")) return "Medium";
  if (lower.includes("~small")) return "Small";
  if (lower.includes("~thumb")) return "Thumbnail";

  const p = lower.match(/(\d{3,4})p/);
  if (p?.[1]) return `${p[1]}p`;

  return `Option ${index + 1}`;
}

async function probeImageResolution(url: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  return new Promise((resolve) => {
    const img = new window.Image();

    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(`${img.naturalWidth}x${img.naturalHeight}`);
      } else {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function isAssetDownloadable(url: string, mediaType?: string): boolean {
  const ext = getFileExtension(url);
  if (!ext) return false;

  if (mediaType === "image") return IMAGE_EXTENSIONS.has(ext);
  if (mediaType === "video") return VIDEO_EXTENSIONS.has(ext);
  if (mediaType === "audio") return AUDIO_EXTENSIONS.has(ext);

  return (
    IMAGE_EXTENSIONS.has(ext) ||
    VIDEO_EXTENSIONS.has(ext) ||
    AUDIO_EXTENSIONS.has(ext)
  );
}

function getFilename(url: string, fallback: string): string {
  const withoutQuery = url.split("?")[0] ?? "";
  const candidate = withoutQuery.split("/").pop();
  return candidate || fallback;
}

function getFilenameFromContentDisposition(
  value: string | null,
): string | null {
  if (!value) return null;

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const simpleMatch = value.match(/filename="?([^";]+)"?/i);
  return simpleMatch?.[1] ?? null;
}

const getSelectedItem = (items: NasaSearchItem[], nasaId: string | null) => {
  if (!nasaId) return null;
  return items.find((entry) => entry.data[0]?.nasa_id === nasaId) ?? null;
};

const getSelectedItemSignature = (
  items: NasaSearchItem[],
  nasaId: string | null,
) => {
  const selectedItem = getSelectedItem(items, nasaId);
  if (!selectedItem) return "";

  const data = selectedItem.data[0];
  const links = selectedItem.links?.map((link) => link.href).join("|") ?? "";
  const keywords = data.keywords?.join("|") ?? "";

  return [
    data.nasa_id,
    data.title,
    data.description,
    data.date_created,
    data.center,
    data.media_type,
    links,
    keywords,
  ].join("::");
};

function normalizeMetadataValue(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const lowered = trimmed.toLowerCase();
    if (lowered === "(none)" || lowered === "unknown" || lowered === "n/a") {
      return null;
    }

    return trimmed;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((entry) => normalizeMetadataValue(entry))
      .filter((entry): entry is string => Boolean(entry));

    if (parts.length === 0) return null;
    return parts.join(", ");
  }

  return null;
}

function pickMetadataValue(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
): string | null {
  if (!metadata) return null;

  for (const key of keys) {
    const value = normalizeMetadataValue(metadata[key]);
    if (value) return value;
  }

  return null;
}

function extractImageSize(
  metadata: Record<string, unknown> | null | undefined,
) {
  const composite = pickMetadataValue(metadata, ["Composite:ImageSize"]);
  if (composite) return composite;

  const width = pickMetadataValue(metadata, ["File:ImageWidth"]);
  const height = pickMetadataValue(metadata, ["File:ImageHeight"]);

  if (width && height) return `${width}x${height}`;
  return null;
}

function ItemModalComponent({
  isOpen,
  nasaId,
  items,
  onClose,
}: ItemModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPhotographyMetadata, setShowPhotographyMetadata] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState<DownloadOption[]>([]);

  const { data: itemDetails, isLoading: loadingAssets } = useNasaItem(
    isOpen ? nasaId : null,
  );
  const { data: photoMetadata, isLoading: loadingPhotoMetadata } =
    useNasaPhotoMetadata(isOpen ? nasaId : null);
  const item = useMemo(
    () => getSelectedItem(items, nasaId) ?? itemDetails?.item ?? null,
    [items, nasaId, itemDetails?.item],
  );
  const selectedData = item?.data?.[0];
  const selectedLinks = item?.links as ModalLink[] | undefined;
  const isItemLoading =
    isOpen && Boolean(nasaId) && !selectedData && loadingAssets;
  const photographyMetadata = useMemo<PhotoMetadataEntry[]>(() => {
    if (selectedData?.media_type !== "image" || !photoMetadata) return [];

    const entries: Array<PhotoMetadataEntry | null> = [
      {
        label: "Camera",
        value:
          pickMetadataValue(photoMetadata, ["EXIF:Model", "EXIF:Make"]) ?? "",
      },
      {
        label: "Lens",
        value:
          pickMetadataValue(photoMetadata, [
            "EXIF:LensModel",
            "Composite:LensID",
            "XMP:Lens",
          ]) ?? "",
      },
      {
        label: "Aperture",
        value:
          pickMetadataValue(photoMetadata, [
            "EXIF:FNumber",
            "Composite:Aperture",
          ]) ?? "",
      },
      {
        label: "Shutter speed",
        value:
          pickMetadataValue(photoMetadata, [
            "EXIF:ExposureTime",
            "Composite:ShutterSpeed",
          ]) ?? "",
      },
      {
        label: "ISO",
        value:
          pickMetadataValue(photoMetadata, [
            "EXIF:ISO",
            "EXIF:RecommendedExposureIndex",
          ]) ?? "",
      },
      {
        label: "Focal length",
        value:
          pickMetadataValue(photoMetadata, [
            "EXIF:FocalLength",
            "Composite:FocalLength35efl",
          ]) ?? "",
      },
      {
        label: "White balance",
        value: pickMetadataValue(photoMetadata, ["EXIF:WhiteBalance"]) ?? "",
      },
      {
        label: "Captured at",
        value:
          pickMetadataValue(photoMetadata, [
            "EXIF:DateTimeOriginal",
            "Composite:DateTimeCreated",
          ]) ?? "",
      },
      {
        label: "Image size",
        value: extractImageSize(photoMetadata) ?? "",
      },
      {
        label: "Credit",
        value:
          pickMetadataValue(photoMetadata, [
            "AVAIL:Photographer",
            "EXIF:Artist",
            "IPTC:By-line",
          ]) ?? "",
      },
    ];

    return entries
      .filter((entry): entry is PhotoMetadataEntry => Boolean(entry?.value))
      .slice(0, 10);
  }, [photoMetadata, selectedData?.media_type]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isOpen]);

  useEffect(() => {
    const media = selectedData;
    if (!media) {
      setIsFavorite(false);
      return;
    }

    const favorites = readFavorites();
    setIsFavorite(favorites.some((entry) => entry.nasa_id === media.nasa_id));
  }, [selectedData]);

  useEffect(() => {
    if (!isOpen || !nasaId) return;
    setDownloadOptions([]);
  }, [isOpen, nasaId]);

  useEffect(() => {
    if (!nasaId) {
      setShowPhotographyMetadata(false);
      return;
    }

    setShowPhotographyMetadata(false);
  }, [nasaId]);

  useEffect(() => {
    let active = true;

    const buildDownloadOptions = async () => {
      if (!isOpen || !selectedData) {
        if (active) {
          setDownloadOptions([]);
        }
        return;
      }

      const mediaType = selectedData.media_type;
      const assets = (itemDetails?.assets ?? []) as string[];
      const assetUrls = [...new Set(assets)].filter((url) =>
        isAssetDownloadable(url, mediaType),
      );
      const selectedLinkUrls = [
        ...new Set(selectedLinks?.map((l) => l.href) ?? []),
      ].filter((url) => isAssetDownloadable(url, mediaType));
      const downloadableUrls = [
        ...new Set([...assetUrls, ...selectedLinkUrls]),
      ];

      const options = await Promise.all(
        downloadableUrls.map(async (url, index) => {
          const extension = getFileExtension(url);
          const fromUrl = extractResolution(url);
          const fromProbe =
            !fromUrl && mediaType === "image"
              ? await probeImageResolution(url)
              : null;

          const resolution = fromUrl || fromProbe || "Unknown";
          const quality =
            extension === "tif" || extension === "tiff"
              ? "Original"
              : getQualityLabel(url, index);

          return {
            url,
            quality,
            resolution,
          };
        }),
      );
      const uniqueOptions = dedupeDownloadOptions(options);

      if (active) {
        setDownloadOptions(uniqueOptions);
      }
    };

    buildDownloadOptions();

    return () => {
      active = false;
    };
  }, [isOpen, selectedData, selectedLinks, itemDetails?.assets]);

  const toggleFavorite = () => {
    const media = selectedData;
    if (!media) return;

    const favorites = readFavorites();
    const exists = favorites.some((entry) => entry.nasa_id === media.nasa_id);

    const nextFavorites = exists
      ? favorites.filter((entry) => entry.nasa_id !== media.nasa_id)
      : [
          {
            nasa_id: media.nasa_id,
            title: media.title,
            media_type: media.media_type,
            date_created: media.date_created,
            saved_at: new Date().toISOString(),
          },
          ...favorites,
        ];

    writeFavorites(nextFavorites);
    setIsFavorite(!exists);
  };

  const handleDownload = async (option: DownloadOption) => {
    if (typeof window === "undefined") return;
    if (isDownloading) return;

    const startedAt = performance.now();
    const media = selectedData;
    const fallbackName = media ? `${media.nasa_id}.asset` : "nasa-asset";
    const filename = getFilename(option.url, fallbackName);
    setIsDownloading(true);
    toast.info("Downloading file...");

    try {
      const response = await fetch("/api/nasa-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: option.url,
          filename,
        }),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const contentDisposition = response.headers.get("content-disposition");
      const responseFilename =
        getFilenameFromContentDisposition(contentDisposition);
      const finalFilename = responseFilename || filename;
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = finalFilename;
      anchor.rel = "noopener noreferrer";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Could not download file. Try again.");
    } finally {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, DOWNLOAD_LOADING_MIN_MS - elapsed);
      window.setTimeout(() => setIsDownloading(false), remaining);
    }
  };

  if (!mounted) return null;

  const previewLink =
    selectedLinks?.find(
      (l) => l.href.includes("~medium") || l.href.includes("~large"),
    ) ||
    selectedLinks?.find((l) => l.href.includes("~small")) ||
    selectedLinks?.find(
      (l) => l.rel === "preview" || l.href.includes("~thumb"),
    ) ||
    selectedLinks?.[0];
  const previewSrc = previewLink?.href;
  const mediaAspectRatio =
    previewLink?.width && previewLink?.height
      ? `${previewLink.width} / ${previewLink.height}`
      : "16 / 9";
  const date = selectedData?.date_created
    ? new Date(selectedData.date_created).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-100 flex items-center justify-center p-0 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
        >
          <motion.button
            type="button"
            aria-label="Close modal backdrop"
            className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 26, scale: 0.98 }}
            transition={panelTransition}
            className="relative w-full h-full md:h-[90vh] max-w-7xl bg-[#0a0a0a] md:rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-3 rounded-full bg-black/55 hover:bg-white/12 text-white backdrop-blur-md transition-colors"
            >
              <X size={20} />
            </button>

            {/* Media Area */}
            <div className="w-full md:w-3/5 bg-black relative flex items-center justify-center p-4 md:p-8 min-h-[42vh]">
              {isItemLoading ? (
                <div
                  className="h-full w-full max-h-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
                  style={{ aspectRatio: mediaAspectRatio }}
                  aria-hidden="true"
                />
              ) : !selectedData ? (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-white/50 text-sm"
                >
                  Item no disponible en esta vista.
                </motion.p>
              ) : (
                <div className="w-full max-h-full flex items-center justify-center">
                  {previewSrc ? (
                    <div
                      className="relative w-full max-h-full"
                      style={{ aspectRatio: mediaAspectRatio }}
                    >
                      <Image
                        src={previewSrc}
                        alt={selectedData.title}
                        fill
                        priority
                        quality={75}
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <p className="text-white/50 text-sm">
                      Sin preview disponible.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="w-full md:w-2/5 flex flex-col h-full min-h-0 max-h-[60vh] md:max-h-full overflow-hidden bg-[#0a0a0a]">
              {isItemLoading ? (
                <>
                  <div className="p-8 md:p-12 grow animate-pulse">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="h-6 w-24 rounded-full bg-white/10" />
                      <div className="h-4 w-28 rounded bg-white/10" />
                    </div>

                    <div className="mb-6 h-9 w-11/12 rounded bg-white/10" />

                    <div className="mb-8 flex gap-4">
                      <div className="h-5 w-32 rounded bg-white/10" />
                      <div className="h-5 w-24 rounded bg-white/10" />
                    </div>

                    <div className="mb-3 h-4 w-full rounded bg-white/10" />
                    <div className="mb-3 h-4 w-[92%] rounded bg-white/10" />
                    <div className="mb-3 h-4 w-[84%] rounded bg-white/10" />
                    <div className="h-4 w-[72%] rounded bg-white/10" />
                  </div>

                  <div className="p-8 border-t border-white/5 bg-[#0a0a0a] flex flex-wrap gap-4 mt-auto animate-pulse">
                    <div className="h-14 flex-1 rounded-xl bg-white/10" />
                    <div className="h-14 w-14 rounded-full bg-white/10" />
                  </div>
                </>
              ) : (
                selectedData && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.12,
                        duration: 0.32,
                        ease: "easeOut",
                      }}
                      className="p-8 md:p-12 grow min-h-0 flex flex-col"
                    >
                      <div className="flex items-center space-x-3 mb-6">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs uppercase tracking-widest text-white/60 font-semibold">
                          {selectedData.media_type}
                        </span>
                        <span className="text-xs text-white/40 font-mono">
                          {selectedData.nasa_id}
                        </span>
                      </div>

                      <h2 className="font-display text-3xl md:text-4xl font-light leading-tight mb-6 wrap-anywhere">
                        {selectedData.title}
                      </h2>

                      <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-8">
                        <span className="flex items-center space-x-2">
                          <Calendar size={14} />
                          <span>{date}</span>
                        </span>
                        {selectedData.center && (
                          <span className="flex items-center space-x-2">
                            <Info size={14} />
                            <span>{selectedData.center}</span>
                          </span>
                        )}
                      </div>

                      <div className="min-h-0 flex-1 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.28)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb:hover]:bg-white/40">
                        <div className="max-w-none text-white/70 font-light leading-relaxed whitespace-pre-line wrap-anywhere">
                          {selectedData.description ? (
                            <p>{selectedData.description}</p>
                          ) : (
                            <p className="italic text-white/30">
                              No description available.
                            </p>
                          )}
                        </div>

                        {selectedData.media_type === "image" &&
                          (loadingPhotoMetadata ||
                            photographyMetadata.length > 0) && (
                            <div className="mt-8 rounded-xl border border-white/10 bg-white/3">
                              <button
                                type="button"
                                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5"
                                onClick={() =>
                                  setShowPhotographyMetadata((prev) => !prev)
                                }
                                aria-expanded={showPhotographyMetadata}
                              >
                                <div className="min-w-0">
                                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/55">
                                    <Camera size={13} />
                                    Photography metadata
                                  </p>
                                  <p className="mt-1 text-xs text-white/35">
                                    Camera and EXIF details
                                  </p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-white/40 transition data-[open=true]:text-white/65">
                                  {loadingPhotoMetadata
                                    ? "Loading..."
                                    : showPhotographyMetadata
                                      ? "Collapse"
                                      : "Expand"}
                                  <ChevronDown
                                    size={13}
                                    className={`transition-transform duration-300 ease-out ${showPhotographyMetadata ? "rotate-180" : "rotate-0"}`}
                                  />
                                </span>
                              </button>

                              <AnimatePresence initial={false}>
                                {showPhotographyMetadata && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{
                                      duration: 0.26,
                                      ease: "easeOut",
                                    }}
                                    className="overflow-hidden"
                                  >
                                    <div className="border-t border-white/10 px-4 pb-4 pt-3">
                                      {loadingPhotoMetadata ? (
                                        <div className="space-y-2 animate-pulse">
                                          <div className="h-4 w-full rounded bg-white/10" />
                                          <div className="h-4 w-11/12 rounded bg-white/10" />
                                          <div className="h-4 w-9/12 rounded bg-white/10" />
                                        </div>
                                      ) : (
                                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                                          {photographyMetadata.map((entry) => (
                                            <div key={entry.label}>
                                              <dt className="text-[11px] font-medium uppercase tracking-wider text-white/40">
                                                {entry.label}
                                              </dt>
                                              <dd className="mt-1 text-white/72 wrap-anywhere">
                                                {entry.value}
                                              </dd>
                                            </div>
                                          ))}
                                        </dl>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                        {selectedData.keywords &&
                          selectedData.keywords.length > 0 && (
                            <div className="mt-8">
                              <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4 font-semibold">
                                Keywords
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedData.keywords.map((kw) => (
                                  <span
                                    key={kw}
                                    className="max-w-full px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/60 break-all"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </motion.div>

                    {/* Actions */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.12,
                        duration: 0.32,
                        ease: "easeOut",
                      }}
                      className="p-8 border-t border-white/5 bg-[#0a0a0a] flex flex-wrap gap-4 mt-auto"
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className="flex-1 inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white bg-white px-5 text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isDownloading}
                            />
                          }
                          aria-label="Download media"
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Download size={18} />
                          )}
                          <span>
                            {isDownloading ? "Downloading..." : "Download"}
                          </span>
                          <ChevronDown size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="center"
                          className="w-(--anchor-width) rounded-xl border border-white/10 bg-[#111] p-1 text-white"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="px-3 py-2 text-xs tracking-widest text-white/50 uppercase">
                              Available qualities
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator className="bg-white/10" />
                          {loadingAssets && (
                            <DropdownMenuItem
                              disabled
                              className="px-3 py-2 text-white/50"
                            >
                              Loading options...
                            </DropdownMenuItem>
                          )}
                          {!loadingAssets && downloadOptions.length === 0 && (
                            <DropdownMenuItem
                              disabled
                              className="px-3 py-2 text-white/50"
                            >
                              No downloadable files
                            </DropdownMenuItem>
                          )}
                          {!loadingAssets &&
                            downloadOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.url}
                                className="px-3 py-2"
                                onClick={() => handleDownload(option)}
                              >
                                <span className="font-medium">
                                  {option.quality}
                                </span>
                                <span className="ml-auto text-xs text-white/50">
                                  {option.resolution}
                                </span>
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <motion.button
                        type="button"
                        className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${isFavorite ? "border-white bg-white text-black" : "border-white/20 bg-transparent text-white hover:border-white/50 hover:bg-white/5"}`}
                        onClick={toggleFavorite}
                        aria-pressed={isFavorite}
                        aria-label={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        title={
                          isFavorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                        animate={
                          isFavorite ? { scale: [1, 1.12, 1] } : { scale: 1 }
                        }
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        whileTap={{ scale: 0.92 }}
                      >
                        <Heart
                          size={20}
                          fill={isFavorite ? "currentColor" : "none"}
                          className={isFavorite ? "animate-pulse" : ""}
                        />
                      </motion.button>
                    </motion.div>
                  </>
                )
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export const ItemModal = memo(ItemModalComponent, (prev, next) => {
  return (
    prev.isOpen === next.isOpen &&
    prev.nasaId === next.nasaId &&
    getSelectedItemSignature(prev.items, prev.nasaId) ===
      getSelectedItemSignature(next.items, next.nasaId) &&
    prev.onClose === next.onClose
  );
});
