import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "harness-kit",
  description: "Author your project's .harness/ via an agent-driven DAG wizard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
