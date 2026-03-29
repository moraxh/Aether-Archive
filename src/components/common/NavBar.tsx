"use client";

import { Image as ImageIcon, Menu, Search, Star, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logo from "@/assets/logo.png";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navItems = [
  { id: "search", label: "Explore", icon: Search, href: "/" },
  { id: "favorites", label: "Saved", icon: Star, href: "/favorites" },
  { id: "apod", label: "APOD", icon: ImageIcon, href: "/apod" },
] as const;

const MotionLink = motion.create(Link);

const ease = [0.25, 0.1, 0.0, 1.0] as const;
const linear = [0, 0, 1, 1] as const;

const D = {
  bar: 0,
  logo: 0.42,
  tabsBg: 0.58,
  item: (i: number) => 0.92 + i * 0.14,
  right: 1.08,
  glow: 0.18,
  line: 1.72,
};

export default function NavBar() {
  const shouldReduceMotion = useReducedMotion();
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      setIsMobileMenuOpen(false);
      setPendingHref(null);
      previousPathnameRef.current = pathname;
    }
  }, [pathname]);

  const handleNavigate = (href?: string) => {
    setIsMobileMenuOpen(false);
    if (href && href !== pathname) {
      setPendingHref(href);
    }
  };

  const isItemActive = useCallback(
    (href: string) =>
      href === "/"
        ? pathname === "/"
        : pathname === href || pathname?.startsWith(`${href}/`),
    [pathname],
  );

  const activeLabel = useMemo(() => {
    const activeItem = navItems.find((item) => isItemActive(item.href));
    return activeItem?.label ?? "";
  }, [isItemActive]);

  const navTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delay: D.bar, duration: 1.05, ease };

  const glowTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delay: D.glow, duration: 1.25, ease };

  const lineTransition = shouldReduceMotion
    ? { duration: 0 }
    : { delay: D.line, duration: 1.05, ease };

  return (
    <motion.nav
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={navTransition}
      aria-busy={pendingHref ? "true" : "false"}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-[#050505]/85 backdrop-blur-xl shadow-[0_20px_60px_-35px_rgba(0,0,0,0.85)]"
          : "bg-transparent"
      }`}
    >
      <div className="pointer-events-none absolute top-0 left-0 z-20 h-px w-full overflow-hidden">
        <motion.div
          className="h-full w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]"
          animate={
            pendingHref && !shouldReduceMotion
              ? { x: ["-45%", "240%"], opacity: [0, 1, 1, 0] }
              : { x: "-45%", opacity: 0 }
          }
          transition={
            pendingHref && !shouldReduceMotion
              ? { duration: 1.15, ease: linear, repeat: Infinity }
              : { duration: 0.2, ease }
          }
        />
      </div>
      <motion.div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)]"
        initial={{ opacity: 0, filter: "blur(16px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={glowTransition}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/2 h-px w-[72%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.65),transparent)]"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={lineTransition}
        style={{ originX: 0.5 }}
      />

      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <MotionLink
            href="/"
            onClick={() => handleNavigate("/")}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { delay: D.logo, duration: 0.85, ease }
            }
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 rounded-2xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
          >
            <div className="relative">
              <div className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,transparent_70%)] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
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
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { delay: D.tabsBg, duration: 0.8, ease }
            }
          >
            {navItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              const isPrimary = item.id === "search";
              return (
                <MotionLink
                  key={item.id}
                  href={item.href}
                  onClick={() => handleNavigate(item.href)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { delay: D.item(i), duration: 0.82, ease }
                  }
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative rounded-full px-4 py-2 text-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${
                    isActive
                      ? "text-white"
                      : isPrimary
                        ? "text-white/90 hover:text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
                        : "text-white/75 hover:text-white"
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
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0.5 left-4 right-4 h-px bg-white/90"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.45,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon
                      size={14}
                      className={isActive ? "text-white" : "text-white/70"}
                    />
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
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { delay: D.right, duration: 0.85, ease }
          }
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
            className="md:hidden rounded-xl p-2 text-white/75 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            whileTap={{ scale: 0.95 }}
            aria-haspopup="dialog"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-sheet"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </motion.div>
      </div>

      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          id="mobile-nav-sheet"
          side="top"
          className="md:hidden top-20 h-auto border-b border-white/10 bg-[#050505]/95 p-0 text-white backdrop-blur-xl [&>button]:right-4 [&>button]:top-4"
        >
          <div className="px-6 py-5">
            <div className="mb-4 text-xs uppercase tracking-[0.3em] text-white/45">
              {activeLabel || "Navigation"}
            </div>
            <div className="flex flex-col gap-3">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isItemActive(item.href);
                const isPrimary = item.id === "search";
                return (
                  <MotionLink
                    key={item.id}
                    href={item.href}
                    onClick={() => handleNavigate(item.href)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { delay: 0.06 * index, duration: 0.4, ease }
                    }
                    whileTap={{ scale: 0.98 }}
                    className={`flex min-h-11 items-center justify-between rounded-2xl border px-4 py-3 text-left font-display text-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${
                      isActive
                        ? "border-white/20 bg-white/10 text-white"
                        : isPrimary
                          ? "border-white/20 bg-white/5 text-white/90 hover:text-white"
                          : "border-white/10 text-white/80 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span>{item.label}</span>
                    <Icon
                      size={18}
                      className={isActive ? "text-white" : "text-white/70"}
                    />
                  </MotionLink>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.nav>
  );
}
