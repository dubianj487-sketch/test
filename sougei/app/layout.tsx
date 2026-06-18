import type { Metadata } from "next";
import "./globals.css";
import TabBar from "@/components/TabBar";

export const metadata: Metadata = {
  title: "送迎",
  description: "キャバクラ送迎管理アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full" style={{ background: "#f5f5f5", WebkitFontSmoothing: "antialiased" }}>
        <div className="mx-auto min-h-dvh" style={{ maxWidth: 390 }}>
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
