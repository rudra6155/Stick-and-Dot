import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunities | Super Finance Hub",
  description: "Discover new investment opportunities.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
