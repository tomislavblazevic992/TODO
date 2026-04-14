import type { Metadata, Viewport } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Team task management with drag & drop",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TaskFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#F59E0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr" className={`${syne.variable} ${dmMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-bg text-white font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#17171A",
              color: "#fff",
              border: "1px solid #2A2A30",
              fontFamily: "var(--font-syne)",
            },
            success: {
              iconTheme: { primary: "#F59E0B", secondary: "#17171A" },
            },
            error: {
              iconTheme: { primary: "#EF4444", secondary: "#17171A" },
            },
          }}
        />
      </body>
    </html>
  );
}
