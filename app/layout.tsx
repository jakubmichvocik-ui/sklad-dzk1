import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "../components/sidebar";
import MobileBottomNav from "../components/mobile-bottom-nav";

export const metadata: Metadata = {
  title: "Sklad DZK",
  description: "Warehouse management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sk">
      <body className="bg-gray-50 text-gray-900">
        <div className="min-h-screen md:flex">
          <Sidebar />

          <main className="flex-1 px-4 py-4 md:px-8 md:py-8">
            {children}
          </main>
        </div>

        <MobileBottomNav />
      </body>
    </html>
  );
}