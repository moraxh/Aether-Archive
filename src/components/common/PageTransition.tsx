"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 6, scale: 0.97, filter: "blur(10px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 1.01,
    filter: "blur(10px)",
    transition: { duration: 0.45, ease: easeOut },
  },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative flex-1">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 will-change-transform"
          style={{ transformOrigin: "50% 0%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
