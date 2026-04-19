import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Growth Garden",
  description:
    "A calm garden dashboard for browsing plant stages and managing local plant image assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
