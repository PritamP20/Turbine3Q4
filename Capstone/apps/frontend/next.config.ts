import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ['@coral-xyz/anchor', '@solana/web3.js'],
};

export default nextConfig;
