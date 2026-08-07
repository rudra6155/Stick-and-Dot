import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore | Super Finance Hub",
  description: "Explore different asset classes.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
