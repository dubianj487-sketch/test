import type { Metadata } from "next";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "LUMINA 送迎",
  description: "キャバクラ送迎管理アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LUMINA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full" style={{ background: "#ffffff", WebkitFontSmoothing: "antialiased" }}>
        <div className="mx-auto min-h-dvh" style={{ maxWidth: 390 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
