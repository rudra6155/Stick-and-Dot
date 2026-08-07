import { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | Super Finance Hub",
  description: "Get the latest financial news.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
