import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2_592_000,
    qualities: [100, 50, 60, 75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images-assets.nasa.gov",
      },
      {
        protocol: "https",
        hostname: "nasa.gov",
      },
      {
        protocol: "https",
        hostname: "*.nasa.gov",
      },
      {
        protocol: "https",
        hostname: "**.nasa.gov",
      },
    ],
  },
};

export default nextConfig;
