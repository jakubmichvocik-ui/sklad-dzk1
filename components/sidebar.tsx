"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/stock", label: "Stav skladu", icon: "📦" },
  { href: "/movements", label: "Príjem", icon: "⬇️" },
  { href: "/issues", label: "Výdaj", icon: "⬆️" },
  { href: "/transfers", label: "Presun", icon: "🔄" },
  { href: "/inventory", label: "Inventúra", icon: "📋" },
  { href: "/orders", label: "Objednávky", icon: "🛒" },
  { href: "/products", label: "Produkty", icon: "🧾" },
  { href: "/suppliers", label: "Dodávatelia", icon: "🚚" },
  { href: "/warehouses", label: "Sklady", icon: "🏬" },
  { href: "/locations", label: "Lokácie", icon: "📍" },
  { href: "/users", label: "Používatelia", icon: "👤" },
  { href: "/reports/sales", label: "Predaje", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-gray-800 bg-slate-900 text-white md:flex md:flex-col">
      <div className="border-b border-gray-800 px-6 py-6">
        <div className="text-2xl font-bold tracking-tight">Sklad DZK</div>
        <div className="mt-1 text-sm text-slate-400">Warehouse management</div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-900 shadow"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4 text-xs text-slate-400">
        Skladový systém DZK
      </div>
    </aside>
  );
}