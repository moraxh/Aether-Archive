"use client";

import { Image as ImageIcon, Menu, Search, Star, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import logo from "@/assets/logo.png";

const navItems = [
  { id: "search", label: "Search", icon: Search, href: "/" },
  { id: "favorites", label: "Collection", icon: Star, href: "/favorites" },
  { id: "apod", label: "Picture of the Day", icon: ImageIcon, href: "/apod" },
] as const;

const MotionLink = motion(Link);

const ease = [0.25, 0.1, 0.0, 1.0] as const;

const D = {
  bar: 0,
  logo: 0.42,
  tabsBg: 0.58,
  item: (i: number) => 1 + i * 0.14,
  right: 1.08,
  glow: 0.18,
  line: 1.72,
};

export default function NavBar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigate = () => setIsMobileMenuOpen(false);

  const isItemActive = useCallback(
    (href: string) =>
      href === "/" ? pathname === "/" : pathname?.startsWith(href),
    [pathname],
  );

  const activeLabel = useMemo(() => {
    const activeItem = navItems.find((item) => isItemActive(item.href));
    return activeItem?.label ?? "";
  }, [isItemActive]);

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: D.bar, duration: 1.05, ease }}
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#050505]/85 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)]"
          : "bg-transparent"
      }`}
    >
      <motion.div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)]"
        initial={{ opacity: 0, filter: "blur(16px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ delay: D.glow, duration: 1.25, ease }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: D.line, duration: 1.05, ease }}
        style={{ originX: 0.5 }}
      />

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MotionLink
            href="/"
            onClick={handleNavigate}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D.logo, duration: 0.85, ease }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src={logo}
                alt="Aether Archive"
                width={48}
                height={48}
                quality={100}
                className="w-12 h-12"
              />
            </div>
            <div>
              <span className="font-display text-xl tracking-wide">
                Aether Archive
              </span>
              <div className="text-[0.62rem] uppercase tracking-[0.3em] text-white/50">
                NASA Collection
              </div>
            </div>
          </MotionLink>

          <motion.div
            className="relative hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-1 py-1 overflow-hidden"
            initial={{ y: -60 }}
            animate={{ y: 0 }}
            transition={{ delay: D.tabsBg, duration: 0.8, ease }}
          >
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <MotionLink
                  key={item.id}
                  href={item.href}
                  onClick={handleNavigate}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: D.item(i), duration: 0.82, ease }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative px-4 py-2 text-sm tracking-wide transition-colors ${
                    isActive ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/10 border border-white/15 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                      transition={{
                        type: "spring",
                        bounce: 0.25,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={14} className="text-white/70" />
                    {item.label}
                  </span>
                </MotionLink>
              );
            })}
          </motion.div>
        </div>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: D.right, duration: 0.85, ease }}
        >
          <div className="hidden lg:flex items-center gap-2 text-xs text-white/50">
            <span className="h-px w-5 bg-white/20" />
            <span>
              Created by{" "}
              <a
                href="https://github.com/moraxh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white transition-colors"
              >
                moraxh
              </a>
            </span>
          </div>
          <motion.a
            href="https://github.com/moraxh"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2, rotate: 4 }}
            whileTap={{ scale: 0.95 }}
            className="text-white/60 hover:text-white transition-colors hidden sm:inline-flex"
            aria-label="GitHub"
          >
            <span className="sr-only">GitHub</span>
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </motion.a>
          <motion.button
            type="button"
            className="md:hidden p-2 text-white/70 hover:text-white"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            whileTap={{ scale: 0.95 }}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease }}
            className="md:hidden absolute top-20 left-0 w-full bg-[#050505]/95 backdrop-blur-xl border-b border-white/10 py-5 px-6 shadow-2xl"
          >
            <div className="flex flex-col gap-4">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">
                {activeLabel || "Navigation"}
              </div>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);
                return (
                  <MotionLink
                    key={item.id}
                    href={item.href}
                    onClick={handleNavigate}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * index, duration: 0.4, ease }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left font-display text-lg transition-colors ${
                      isActive
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 text-white/70 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    <Icon size={18} className="text-white/60" />
                  </MotionLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
