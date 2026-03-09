"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";

type Permissions = Record<string, boolean>;

type ProfileData = {
  role: string;
  permissions: Permissions | null;
};

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", permission: "dashboard" },
  { href: "/stock", label: "Stav skladu", icon: "📦", permission: "stock" },
  { href: "/reports/sales", label: "Predaje", icon: "📊", permission: "orders" },
  { href: "/movements", label: "Príjem", icon: "⬇️", permission: "movements" },
  { href: "/issues", label: "Výdaj", icon: "⬆️", permission: "issues" },
  { href: "/transfers", label: "Presun", icon: "🔄", permission: "transfers" },
  { href: "/inventory", label: "Inventúra", icon: "📋", permission: "inventory" },
  { href: "/orders", label: "Objednávky", icon: "🛒", permission: "orders" },
  { href: "/products", label: "Produkty", icon: "🧾", permission: "products" },
  { href: "/warehouses", label: "Sklady", icon: "🏬", permission: "warehouses" },
  { href: "/locations", label: "Lokácie", icon: "📍", permission: "locations" },
  { href: "/users", label: "Používatelia", icon: "👤", permission: "users" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role, permissions")
        .eq("id", user.id)
        .single();

      setProfile((data as ProfileData | null) ?? null);
      setLoading(false);
    }

    loadProfile();
  }, []);

  const visibleLinks = useMemo(() => {
    if (!profile) return [];

    if (profile.role === "admin") {
      return links;
    }

    const permissions = profile.permissions ?? {};

    return links.filter((link) => permissions[link.permission]);
  }, [profile]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-gray-800 bg-slate-900 text-white md:flex md:flex-col">
      <div className="border-b border-gray-800 px-6 py-6">
        <div className="text-2xl font-bold tracking-tight">Sklad DZK</div>
        <div className="mt-1 text-sm text-slate-400">Warehouse management</div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {!loading &&
          visibleLinks.map((link) => {
            const active = pathname === link.href;

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

      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleLogout}
          className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Odhlásiť sa
        </button>
      </div>

      <div className="px-4 pb-4 text-xs text-slate-400">
        Skladový systém DZK
      </div>
    </aside>
  );
}