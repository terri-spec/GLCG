import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Future Katie",
  description: "Try on a future before choosing one.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
