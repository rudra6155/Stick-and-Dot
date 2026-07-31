"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, LineChart, BarChart3, TestTube, Newspaper, ShieldAlert, Target } from "lucide-react";

const sidebarLinks = [
  { href: "/portfolio", label: "My Picks", icon: LayoutDashboard },
  { href: "/portfolio/explore", label: "Explore Markets", icon: Compass },
  { href: "/portfolio/screener", label: "Screener", icon: BarChart3 },
  { href: "/portfolio/scenarios", label: "Scenarios", icon: LineChart },
  { href: "/portfolio/backtest", label: "Backtest", icon: TestTube },
  { href: "/portfolio/opportunities", label: "Opportunities", icon: Target },
  { href: "/portfolio/risk-score", label: "Risk Score", icon: ShieldAlert },
  { href: "/portfolio/news", label: "Market News", icon: Newspaper },
];

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto gap-8">
      <aside className="w-full md:w-64 shrink-0">
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 sticky top-24 hide-scrollbar">
          {sidebarLinks.map((link) => {
            // Precise active state matching for dashboard sub-routes
            const isActive = link.href === "/portfolio" 
              ? pathname === "/portfolio" 
              : pathname.startsWith(link.href);

            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className="flex-1 w-full min-w-0 pb-20">
        {children}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
