import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      { source: '/screener', destination: '/portfolio/screener', permanent: true },
      { source: '/scenarios', destination: '/portfolio/scenarios', permanent: true },
      { source: '/backtest', destination: '/portfolio/backtest', permanent: true },
      { source: '/news', destination: '/portfolio/news', permanent: true },
      { source: '/risk-score', destination: '/portfolio/risk-score', permanent: true },
      { source: '/opportunities', destination: '/portfolio/opportunities', permanent: true },
      { source: '/explore', destination: '/portfolio/explore', permanent: true },
      { source: '/explore/:path*', destination: '/portfolio/explore/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
