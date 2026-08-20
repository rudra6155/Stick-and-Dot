import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { CursorProvider } from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fin — Prediction Marketplace",
  description: "The unfiltered financial and sports prediction terminal. Every asset class. Zero opinions.",
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
            <AuthProvider>
              <Navbar />
              {children}
            </AuthProvider>
          </CursorProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
