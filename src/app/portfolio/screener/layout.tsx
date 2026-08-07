import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Screener | Super Finance Hub",
  description: "Screen and filter the best assets.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
