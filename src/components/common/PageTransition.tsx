"use client";

import { TransitionRouter } from "next-transition-router";
import type { ReactNode } from "react";
import { useRef } from "react";

const easeOut = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function PageTransition({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  return (
    <TransitionRouter
      auto
      leave={(next) => {
        const el = wrapperRef.current;
        if (!el) {
          next();
          return;
        }
        el.animate(
          [
            { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
            { opacity: 0, filter: "blur(12px)", transform: "translateY(-8px)" },
          ],
          { duration: 400, easing: easeOut, fill: "forwards" },
        ).finished.then(next);
      }}
      enter={(next) => {
        const el = wrapperRef.current;
        if (!el) {
          next();
          return;
        }
        el.animate(
          [
            { opacity: 0, filter: "blur(12px)", transform: "translateY(8px)" },
            { opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" },
          ],
          { duration: 550, easing: easeOut, fill: "forwards" },
        ).finished.then(next);
      }}
    >
      <div ref={wrapperRef} className="flex-1 will-change-transform">
        {children}
      </div>
    </TransitionRouter>
  );
}
