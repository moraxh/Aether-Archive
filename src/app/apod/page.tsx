"use client";

import {
  Calendar,
  Download,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Share2,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const APOD_API_BASE = "https://api.nasa.gov/planetary/apod";
const APOD_API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY ?? "DEMO_KEY";
const APOD_CACHE_KEY = "aether-apod-cache-v1";
const APOD_CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours
const NASA_TIMEZONE = "America/New_York";
const DOWNLOAD_LOADING_MIN_MS = 700;
const easeOut = [0.16, 1, 0.3, 1] as const;

type ApodData = {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: "image" | "video" | string;
  title: string;
  url: string;
};

type CachedApodPayload = {
  timestamp: number;
  data: ApodData;
};

function readApodCache(): CachedApodPayload | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(APOD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedApodPayload;
    if (!parsed?.data?.url || !parsed?.timestamp) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeApodCache(data: ApodData) {
  if (typeof window === "undefined") return;

  const payload: CachedApodPayload = {
    timestamp: Date.now(),
    data,
  };
  window.localStorage.setItem(APOD_CACHE_KEY, JSON.stringify(payload));
}

function getNasaDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NASA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default function ApodPage() {
  const shouldReduceMotion = useReducedMotion();
  const [apod, setApod] = useState<ApodData | null>(null);
  const [loadingApod, setLoadingApod] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchApod = useCallback(
    async (signal?: AbortSignal, options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const nasaToday = getNasaDateString();

      if (!force) {
        const cached = readApodCache();
        const isSameNasaDay = cached?.data?.date === nasaToday;
        if (
          cached &&
          isSameNasaDay &&
          Date.now() - cached.timestamp < APOD_CACHE_TTL
        ) {
          setApod(cached.data);
          setLoadingApod(false);
          setError(null);
          return;
        }
      }

      setLoadingApod(true);
      setError(null);

      try {
        const response = await fetch(
          `${APOD_API_BASE}?api_key=${APOD_API_KEY}`,
          {
            signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load NASA APOD.");
        }

        const data = (await response.json()) as ApodData;
        if (!data?.url) {
          throw new Error("APOD payload is incomplete.");
        }

        setApod(data);
        writeApodCache(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const cached = readApodCache();
          if (cached) {
            setApod(cached.data);
            setError(null);
            toast.warning("NASA API limit reached. Showing cached APOD.");
          } else {
            const message =
              "Could not load Picture of the Day. Please try again.";
            setError(message);
            toast.error(message);
          }
        }
      } finally {
        setLoadingApod(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchApod(controller.signal);
    return () => controller.abort();
  }, [fetchApod]);

  const formattedDate = useMemo(() => {
    if (!apod?.date) return "";
    return new Date(apod.date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [apod?.date]);

  const handleShare = useCallback(async () => {
    if (!apod) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: apod.title,
          text: `NASA APOD: ${apod.title}`,
          url: apod.url,
        });
        return;
      }

      await navigator.clipboard.writeText(apod.url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not share this APOD");
    }
  }, [apod]);

  const handleDownload = useCallback(async () => {
    if (!apod || apod.media_type !== "image" || isDownloading) return;

    const imageUrl = apod.hdurl || apod.url;
    const downloadUrl = `/api/apod-download?url=${encodeURIComponent(imageUrl)}&date=${encodeURIComponent(apod.date)}`;

    const startedAt = performance.now();
    setIsDownloading(true);
    try {
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = "";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      toast.success("Download started");
    } catch {
      toast.error("Could not download this image automatically.");
    } finally {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(0, DOWNLOAD_LOADING_MIN_MS - elapsed);
      window.setTimeout(() => setIsDownloading(false), remaining);
    }
  }, [apod, isDownloading]);

  const isVideo = apod?.media_type === "video";

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: easeOut }}
      className="w-full max-w-6xl mx-auto px-6 py-12 md:py-20"
    >
      <AnimatePresence mode="wait" initial={false}>
        {loadingApod ? (
          <motion.div
            key="apod-loading"
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 10,
              scale: 0.985,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scale: 1.01 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.35,
              ease: easeOut,
            }}
            className="flex flex-col items-center justify-center gap-5 py-24 text-center"
          >
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">
              Loading APOD
            </p>
          </motion.div>
        ) : !apod ? (
          <motion.div
            key="apod-error"
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 10,
              scale: 0.985,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, scale: 1.01 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.35,
              ease: easeOut,
            }}
            className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center"
          >
            <p className="mb-6 text-white/65">
              {error ?? "Failed to load APOD."}
            </p>
            <button
              type="button"
              onClick={() => void fetchApod(undefined, { force: true })}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              <RefreshCcw size={14} />
              Try again
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={`apod-content-${apod.date}`}
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : 16,
              scale: shouldReduceMotion ? 1 : 0.975,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : -12,
              scale: shouldReduceMotion ? 1 : 1.01,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.72,
              ease: easeOut,
            }}
            className="flex flex-col gap-8"
          >
            <div className="text-center mb-2 md:mb-4">
              <h1 className="animate-float font-display text-5xl md:text-7xl leading-[0.95] tracking-tight text-white">
                Picture of the Day
              </h1>
              <p className="mt-3 text-xs md:text-sm uppercase tracking-[0.24em] text-white/45">
                NASA Astronomy Selection
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1.2fr] lg:items-start">
              <motion.div
                initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.7,
                  ease: easeOut,
                }}
                className={`group overflow-hidden rounded-2xl border shadow-2xl ${
                  isVideo
                    ? "border-white/10 bg-[#111]"
                    : "w-fit max-w-full border-white/20 bg-transparent shadow-[0_30px_90px_-45px_rgba(0,0,0,0.95)]"
                }`}
              >
                {isVideo ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={apod.url}
                      title={apod.title}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  // biome-ignore lint/performance/noImgElement: APOD image URLs are fully dynamic and may not match Next image allowlist.
                  <img
                    src={apod.hdurl || apod.url}
                    alt={apod.title}
                    className="block h-auto max-h-[72vh] w-auto max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-[1.01]"
                  />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.65,
                  ease: easeOut,
                }}
                className="rounded-2xl border border-white/10 bg-white/3 p-6 md:p-8 lg:sticky lg:top-28 lg:max-h-[750px] lg:overflow-y-auto"
              >
                <h1 className="mb-4 font-display text-3xl leading-tight font-medium tracking-tight md:text-4xl">
                  {apod.title}
                </h1>

                <p className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-white/50">
                  <Calendar size={13} />
                  {formattedDate || apod.date}
                </p>

                <p className="text-[1.03rem] leading-relaxed font-normal text-white/85">
                  {apod.explanation}
                </p>

                {apod.copyright && (
                  <p className="mt-7 text-sm italic text-white/45">
                    Image Credit & Copyright: {apod.copyright}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition-colors hover:border-white/45 hover:text-white"
                  >
                    <Share2 size={15} />
                    Share
                  </button>

                  {apod.media_type === "image" && (
                    <button
                      type="button"
                      onClick={() => void handleDownload()}
                      disabled={isDownloading}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition-colors hover:border-white/45 hover:text-white disabled:pointer-events-none disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Preparing...
                        </>
                      ) : (
                        <>
                          <Download size={15} />
                          Download original
                        </>
                      )}
                    </button>
                  )}

                  {apod.media_type === "video" && (
                    <a
                      href={apod.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition-colors hover:border-white/45 hover:text-white"
                    >
                      <ExternalLink size={15} />
                      Open source
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
