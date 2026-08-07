import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Backtest | Super Finance Hub",
  description: "Backtest your portfolio strategies.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
