import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { CursorProvider } from "@/components/CustomCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Super Finance Hub — Aggregated Market Terminal",
  description: "1000+ assets. 10 asset classes. Zero opinions. The unfiltered financial data terminal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="cursor-none">
        <SmoothScroll>
          <CursorProvider>
            <nav className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900/50" style={{top: '32px'}}>
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6 h-16">
                  <Link href="/" className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium uppercase tracking-wider">Terminal</Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/screener" className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium uppercase tracking-wider">Screener</Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/scenarios" className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium uppercase tracking-wider">Scenarios</Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/backtest" className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium uppercase tracking-wider">Backtest</Link>
                  <span className="text-zinc-800">|</span>
                  <Link href="/news" className="text-zinc-400 hover:text-emerald-400 transition-colors text-sm font-medium uppercase tracking-wider">News</Link>
                </div>
              </div>
            </nav>
            {children}
          </CursorProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
