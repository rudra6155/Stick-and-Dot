import { Metadata } from "next";
import ClientLayout from "./ClientLayout";

export const metadata: Metadata = {
  title: "My Portfolio | Super Finance Hub",
  description: "Track and analyze your curated asset portfolio in real-time.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
