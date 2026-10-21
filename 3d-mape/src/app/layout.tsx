import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Crna Gora 3D Map",
  description:
    "Photorealistic 3D map of Montenegro with kindergartens, playgrounds, children's workshops, birthday venues, and Podgorica landmarks.",
  openGraph: {
    title: "Crna Gora 3D Map",
    description:
      "Photorealistic 3D map of Montenegro with kindergartens, playgrounds, children's workshops, birthday venues, and Podgorica landmarks.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crna Gora 3D Map",
    description:
      "Photorealistic 3D map of Montenegro with kindergartens, playgrounds, children's workshops, birthday venues, and Podgorica landmarks.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-[#121612] font-sans text-[#1c1917]">
        {children}
      </body>
    </html>
  );
}
