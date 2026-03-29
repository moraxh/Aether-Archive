import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    qualities: [50, 75, 90, 100],
    remotePatterns: [
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
