// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/**", // allow all images inside /public
      },
    ],
  },
};

export default nextConfig;
