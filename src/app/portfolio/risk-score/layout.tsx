import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Risk Score | Super Finance Hub",
  description: "Assess your portfolio risk score.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
