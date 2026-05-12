import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    // Allow base64 data URLs for avatars stored in DB
    dangerouslyAllowSVG: false,
    remotePatterns: [],
    unoptimized: true,
  },
};

export default nextConfig;
