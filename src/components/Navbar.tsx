"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const { user, openAuthModal } = useAuth();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePortfolioClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("/portfolio");
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900/50" style={{top: '32px'}}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-xl font-black tracking-tighter text-white">Super Finance Hub</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/portfolio" 
              onClick={handlePortfolioClick}
              className="text-sm font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              My Portfolio
            </Link>

            {user && (
              <div className="flex items-center gap-4 border-l border-zinc-800 pl-6">
                <span className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                  <User className="w-3 h-3" />
                  {user.email || user.phone}
                </span>
                <button onClick={handleLogout} className="text-xs text-rose-400 hover:text-rose-300 uppercase tracking-widest font-mono transition-colors">
                  Log Out
                </button>
              </div>
            )}
          </div>

          <button 
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-zinc-900 border-b border-zinc-800 px-4 py-4 space-y-4">
          <Link 
            href="/portfolio" 
            onClick={handlePortfolioClick}
            className="block text-sm font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            My Portfolio
          </Link>

          {user && (
            <div className="pt-4 border-t border-zinc-800 flex flex-col gap-4">
              <span className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                <User className="w-4 h-4" />
                {user.email || user.phone}
              </span>
              <button onClick={handleLogout} className="text-left text-xs text-rose-400 hover:text-rose-300 uppercase tracking-widest font-mono transition-colors">
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
