import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  reactStrictMode: true,
};

export default nextConfig;
