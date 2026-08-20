"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const { user, loading, openAuthModal } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  // Basic focus trap: move focus into the mobile menu when it opens, keep Tab
  // cycling inside it, and return focus to the toggle button on Escape.
  useEffect(() => {
    if (!mobileMenuOpen) return;

    firstMobileLinkRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        mobileToggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !mobileMenuRef.current) return;
      const focusable = mobileMenuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handlePortfolioClick = (e: React.MouseEvent) => {
    if (loading) {
      e.preventDefault();
      return;
    }
    if (!user) {
      e.preventDefault();
      openAuthModal("/portfolio");
      setMobileMenuOpen(false);
    } else {
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    // AuthContext listens for onAuthStateChange and Supabase clears its own
    // session cookies on signOut(), so a client-side navigation is enough here —
    // no full reload is needed to refresh auth state.
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900/50"
      style={{ top: 'var(--banner-height, 0px)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-xl font-black tracking-tighter text-white">Fin</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/portfolio/predictions" 
              onClick={handlePortfolioClick}
              className="text-sm font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Predictions
            </Link>
            <Link 
              href="/portfolio" 
              onClick={handlePortfolioClick}
              className="text-sm font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              My Portfolio
            </Link>

            {!loading && user && (
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
            ref={mobileToggleRef}
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-menu" ref={mobileMenuRef} className="md:hidden bg-zinc-900 border-b border-zinc-800 px-4 py-4 space-y-4">
          <Link
            ref={firstMobileLinkRef}
            href="/portfolio/predictions"
            onClick={handlePortfolioClick}
            className="block text-sm font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Predictions
          </Link>
          <Link 
            href="/portfolio" 
            onClick={handlePortfolioClick}
            className="block text-sm font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            My Portfolio
          </Link>

          {!loading && user && (
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
