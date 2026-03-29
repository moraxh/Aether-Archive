"use client";

import { Calendar, Heart, Info, Share2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

function ItemModalComponent({
  isOpen,
  nasaId,
  items,
  onClose,
}: ItemModalProps) {
  const [mounted, setMounted] = useState(false);

  const item = useMemo(() => getSelectedItem(items, nasaId), [items, nasaId]);

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

  if (!mounted) return null;

  const previewLink =
    item?.links?.find(
      (l) => l.rel === "preview" || l.href.includes("~thumb"),
    ) ||
    item?.links?.find((l) => l.href.includes("~small")) ||
    item?.links?.[0];
  const previewSrc = previewLink?.href;
  const mediaAspectRatio =
    previewLink?.width && previewLink?.height
      ? `${previewLink.width} / ${previewLink.height}`
      : "16 / 9";
  const date = item?.data?.[0]?.date_created
    ? new Date(item.data[0].date_created).toLocaleDateString(undefined, {
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
              {!item ? (
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
                        alt={item.data[0].title}
                        fill
                        priority
                        quality={75}
                        sizes="(max-width: 768px) 100vw, 60vw"
                        className="object-contain"
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
            <div className="w-full md:w-2/5 flex flex-col h-full max-h-[60vh] md:max-h-full overflow-y-hidden bg-[#0a0a0a] custom-scrollbar">
              {item && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.12,
                      duration: 0.32,
                      ease: "easeOut",
                    }}
                    className="p-8 md:p-12 grow"
                  >
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs uppercase tracking-widest text-white/60 font-semibold">
                        {item.data[0].media_type}
                      </span>
                      <span className="text-xs text-white/40 font-mono">
                        {item.data[0].nasa_id}
                      </span>
                    </div>

                    <h2 className="font-display text-3xl md:text-4xl font-light leading-tight mb-6 wrap-anywhere">
                      {item.data[0].title}
                    </h2>

                    <div className="flex flex-wrap gap-4 text-sm text-white/50 mb-8">
                      <span className="flex items-center space-x-2">
                        <Calendar size={14} />
                        <span>{date}</span>
                      </span>
                      {item.data[0].center && (
                        <span className="flex items-center space-x-2">
                          <Info size={14} />
                          <span>{item.data[0].center}</span>
                        </span>
                      )}
                    </div>

                    <div className="max-w-none text-white/70 font-light leading-relaxed mb-10 whitespace-pre-line wrap-anywhere max-h-52 md:max-h-72 overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.28)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb:hover]:bg-white/40">
                      {item.data[0].description ? (
                        <p>{item.data[0].description}</p>
                      ) : (
                        <p className="italic text-white/30">
                          No description available.
                        </p>
                      )}
                    </div>

                    {item.data[0].keywords &&
                      item.data[0].keywords.length > 0 && (
                        <div>
                          <h4 className="text-xs uppercase tracking-widest text-white/40 mb-4 font-semibold">
                            Keywords
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {item.data[0].keywords.map((kw) => (
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
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.18,
                      duration: 0.28,
                      ease: "easeOut",
                    }}
                    className="p-8 border-t border-white/5 bg-[#0a0a0a] flex flex-wrap gap-4 mt-auto"
                  >
                    <button
                      type="button"
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-full transition-colors border bg-transparent text-white border-white/20 hover:border-white/50 hover:bg-white/5"
                    >
                      <Heart size={18} />
                      <span>Save to Collection</span>
                    </button>

                    <button
                      type="button"
                      className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-full border border-white/20 hover:border-white/50 text-white transition-colors"
                      title="Share"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                      }}
                    >
                      <Share2 size={18} />
                    </button>
                  </motion.div>
                </>
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
