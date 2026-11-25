import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return [
      { source: '/screener', destination: '/portfolio/suggestions/screener', permanent: true },
      { source: '/portfolio/screener', destination: '/portfolio/suggestions/screener', permanent: true },
      { source: '/scenarios', destination: '/portfolio/scenarios', permanent: true },
      { source: '/backtest', destination: '/portfolio/suggestions/backtest', permanent: true },
      { source: '/portfolio/backtest', destination: '/portfolio/suggestions/backtest', permanent: true },
      { source: '/news', destination: '/portfolio/scenarios', permanent: true },
      { source: '/portfolio/news', destination: '/portfolio/scenarios', permanent: true },
      { source: '/risk-score', destination: '/portfolio/risk-score', permanent: true },
      { source: '/opportunities', destination: '/portfolio/suggestions/opportunities', permanent: true },
      { source: '/portfolio/opportunities', destination: '/portfolio/suggestions/opportunities', permanent: true },
      { source: '/explore', destination: '/portfolio/explore', permanent: true },
      { source: '/explore/:path*', destination: '/portfolio/explore/:path*', permanent: true },
    ];
  },
};

export default nextConfig;
