"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.4, ease: easeOut },
  },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
