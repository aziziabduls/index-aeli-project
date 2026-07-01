import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "*",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "*",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "api-gateway",
        port: "*",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ['192.168.10.8'],
};

export default nextConfig;

