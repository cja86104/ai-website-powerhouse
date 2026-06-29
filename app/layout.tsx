import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Website Powerhouse",
  description: "Local AI-powered website generator",
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
