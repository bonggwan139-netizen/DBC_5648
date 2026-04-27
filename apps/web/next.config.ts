import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return [
      {
        source: "/analysis/:path*",
        destination: "http://34.47.87.148:8000/analysis/:path*"
      }
    ];
  }
};

export default nextConfig;