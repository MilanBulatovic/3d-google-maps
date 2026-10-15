import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components stay off. Partial prefetching cannot be enabled without them.
  partialPrefetching: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
    ],
  },
};

export default nextConfig;
