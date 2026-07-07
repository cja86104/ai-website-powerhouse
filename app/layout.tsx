import type { Metadata } from "next";
import "./globals.css";

// Placeholder product metadata for W1 (Section 6 §3 PR-5). Final
// marketing copy + OG tags land in W11 per Section 8.
export const metadata: Metadata = {
  title: "AI Website Powerhouse",
  description:
    "Generate production-ready websites with the AI provider you choose — local Ollama or cloud models via OpenRouter, bring your own key.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
