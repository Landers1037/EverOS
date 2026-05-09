import type { Metadata } from "next";
import "./globals.css";
import { DesktopProviders } from "@/providers/DesktopProviders";

export const metadata: Metadata = {
  title: "EverOS",
  description: "A smart media management Web OS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="preload h-full antialiased" suppressHydrationWarning>
      <body className="h-full">{children}</body>
    </html>
  );
}
