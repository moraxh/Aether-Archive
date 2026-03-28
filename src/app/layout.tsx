import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/common/Footer";
import NavBar from "@/components/common/NavBar";
import PageTransition from "@/components/common/PageTransition";
import { StarsBackground } from "@/components/common/StarsBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aether Archive",
  description:
    "NASA has one of the greatest image archives in human history and a search engine that doesn't do it justice. Aether Archive is the interface it deserves, built on NASA's public API, completely free, no affiliation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#050505] text-white selection:bg-white/20 relative">
        <StarsBackground className="fixed inset-0 z-0 pointer-events-none opacity-50" />
        <NavBar />
        <PageTransition>{children}</PageTransition>
        <Footer />
      </body>
    </html>
  );
}
