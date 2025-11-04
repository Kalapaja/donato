import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/donato",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
