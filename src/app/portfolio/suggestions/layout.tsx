"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, TestTube, BarChart3, Lightbulb } from "lucide-react";

export default function SuggestionsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { href: "/portfolio/suggestions", label: "AI Suggestions", icon: Target, exact: true },
    { href: "/portfolio/suggestions/screener", label: "Market Screener", icon: TestTube, exact: false },
    { href: "/portfolio/suggestions/backtest", label: "Backtest Engine", icon: BarChart3, exact: false },
    { href: "/portfolio/suggestions/opportunities", label: "Opportunities", icon: Lightbulb, exact: false },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-5xl font-black tracking-tight text-white mb-6">Discovery Hub</h1>
        
        {/* Simplified Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar border-b border-zinc-800 pb-px">
          {tabs.map((tab) => {
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all rounded-t-xl whitespace-nowrap ${
                  isActive 
                    ? "bg-zinc-900 text-emerald-400 border-t border-x border-zinc-800 border-b-transparent translate-y-px" 
                    : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        {children}
      </div>
    </div>
  );
}
