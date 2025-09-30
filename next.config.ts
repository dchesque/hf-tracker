import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Necessário para Docker build com standalone
  output: 'standalone',
};

export default nextConfig;