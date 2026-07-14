"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Terminal" },
    { href: "/screener", label: "Screener" },
    { href: "/scenarios", label: "Scenarios" },
    { href: "/backtest", label: "Backtest" },
    { href: "/news", label: "News" },
    { href: "/risk-score", label: "Risk Score" },
    { href: "/opportunities", label: "Opportunities" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900/50" style={{top: '32px'}}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:justify-start">
          <div className="flex items-center w-full justify-between sm:w-auto">
            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-zinc-400 hover:text-white transition-colors p-2 -ml-2"
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6 w-full">
            {links.map((link, i) => (
              <div key={link.href} className="flex items-center gap-6 shrink-0">
                <Link href={link.href} className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium uppercase tracking-wider">
                  {link.label}
                </Link>
                {i < links.length - 1 && <span className="text-zinc-800">|</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Mobile Nav */}
      {isOpen && (
        <div className="sm:hidden bg-black/95 backdrop-blur-xl border-b border-zinc-900/50">
          <div className="px-4 pt-2 pb-6 space-y-1 shadow-2xl h-[calc(100vh-80px)] overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-4 rounded-md text-base font-medium text-zinc-300 hover:text-emerald-400 hover:bg-zinc-900/50 uppercase tracking-wider border-b border-zinc-800/50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
