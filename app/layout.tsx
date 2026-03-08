import "./globals.css";
import type { Metadata } from "next";
import Sidebar from "../components/sidebar";

export const metadata: Metadata = {
  title: "Sklad DZK",
  description: "Skladový systém DZK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sk">
      <body>
        <div className="min-h-screen bg-gray-100 md:flex">
          <Sidebar />

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
              <div className="flex items-center justify-between px-4 py-4 md:px-8">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Sklad DZK</h1>
                  <p className="text-sm text-gray-500">Profesionálny skladový systém</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
                  Admin
                </div>
              </div>
            </header>

            <main className="px-4 py-6 md:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}