import type { NextConfig } from "next";

// Desktop installers served from /public. Force a clean download (attachment)
// even when the URL is opened directly, not just via the <a download> button.
const DOWNLOADS = [
  "/Interview Assistant_0.1.0_x64-setup.exe",
  "/IntrviwAssistant.exe",
];

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return DOWNLOADS.map((path) => ({
      source: path,
      headers: [
        { key: "Content-Type", value: "application/octet-stream" },
        {
          key: "Content-Disposition",
          value: `attachment; filename="${path.slice(1)}"`,
        },
        { key: "Cache-Control", value: "public, max-age=3600" },
      ],
    }));
  },
};

export default nextConfig;
