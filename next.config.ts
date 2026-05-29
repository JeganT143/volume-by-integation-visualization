import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Transpile Three.js related packages for compatibility
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],

  // Empty turbopack config to silence the warning (using Turbopack by default in Next.js 16)
  turbopack: {},
};

export default nextConfig;
