"use client";

import { ExternalLink } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const easeOut = [0.16, 1, 0.3, 1] as const;

const footerVariants = {
  initial: { y: 8, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
  },
};

const footerItemVariants = {
  initial: { y: 6, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: easeOut },
  },
};

export default function Footer() {
  const shouldReduceMotion = useReducedMotion();

  const footerTransition = shouldReduceMotion
    ? { duration: 0 }
    : {
        duration: 0.8,
        ease: easeOut,
        staggerChildren: 0.2,
        delayChildren: 0.3,
      };

  const revealTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delay: 0.22, duration: 0.95, ease: easeOut };

  const lineTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delay: 1.35, duration: 1.05, ease: easeOut };

  return (
    <motion.footer
      variants={footerVariants}
      initial="initial"
      animate="animate"
      transition={footerTransition}
      className="py-8 mt-auto relative z-10 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 -z-10 border-t border-white/5 bg-[#050505]/80 backdrop-blur-md"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={{ clipPath: "inset(0% 0 0 0)" }}
        transition={revealTransition}
      />
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 h-px w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)] opacity-70"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.7 }}
        transition={lineTransition}
        style={{ originX: 0.5 }}
      />
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <motion.div
          variants={footerItemVariants}
          className="max-w-2xl text-center md:text-left space-y-2"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Why this site?
          </p>
          <p className="text-sm leading-relaxed text-white/75">
            NASA has one of the greatest image archives in human history and a
            search engine that doesn&apos;t do it justice. Aether Archive is the
            interface it deserves, built on NASA&apos;s public API, completely
            free, no affiliation.
          </p>
          <p className="text-white/30 text-xs font-light">
            All content belongs to NASA and its respective creators.
          </p>
        </motion.div>
        <motion.a
          variants={footerItemVariants}
          href="https://api.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex min-h-11 items-center space-x-2 rounded-xl px-2 text-sm text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        >
          <span>Powered by NASA APIs</span>
          <ExternalLink size={14} />
        </motion.a>
      </div>
    </motion.footer>
  );
}
