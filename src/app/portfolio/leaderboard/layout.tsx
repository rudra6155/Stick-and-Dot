import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | Super Finance Hub",
  description: "View top performing portfolios.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
