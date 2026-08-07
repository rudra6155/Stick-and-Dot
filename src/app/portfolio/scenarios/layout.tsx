import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scenarios | Super Finance Hub",
  description: "Analyze various market scenarios.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
