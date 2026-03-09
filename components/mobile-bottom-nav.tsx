"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Domov", icon: "🏠" },
  { href: "/movements", label: "Príjem", icon: "⬇️" },
  { href: "/issues", label: "Výdaj", icon: "⬆️" },
  { href: "/orders", label: "Picker", icon: "📲" },
  { href: "/stock", label: "Sklad", icon: "📦" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white md:hidden">
      <div className="grid grid-cols-5">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] ${
                active ? "text-slate-900" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}