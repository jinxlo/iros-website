import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "100.108.161.54",
    "192.168.0.106",
    "localhost",
    "127.0.0.1",
  ],
  async rewrites() {
    const privateApiBaseUrl = process.env.PRIVATE_API_BASE_URL?.replace(/\/$/, "");

    return privateApiBaseUrl
      ? [
          {
            source: "/api/:path*",
            destination: `${privateApiBaseUrl}/api/:path*`,
          },
        ]
      : [];
  },
};

export default nextConfig;
