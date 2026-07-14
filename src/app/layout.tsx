import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { CursorProvider } from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";

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
  description: "8500+ assets. 10 asset classes. Zero opinions. The unfiltered financial data terminal.",
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
      <body className="bg-black text-white">
        <SmoothScroll>
          <CursorProvider>
            <Navbar />
            {children}
          </CursorProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
