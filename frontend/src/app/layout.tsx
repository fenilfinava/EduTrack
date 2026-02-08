import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google"; // Changed fonts
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Project Tracking",
  description: "Track projects, milestones, and tasks integrated with GitHub",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.variable,
          oswald.variable,
          "antialiased min-h-screen bg-background font-sans"
        )}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
