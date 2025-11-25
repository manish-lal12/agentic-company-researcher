import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scout - Agentic Company Researcher",
  description:
    "An agentic company researcher that helps you gather insights and generate detailed account plans about companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-hidden`}
      >
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-full">
            <Header />
            <div className="overflow-y-auto h-full">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
