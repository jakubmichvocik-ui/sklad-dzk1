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

const mainLinks = [
  { href: "/dashboard", label: "Domov", icon: "🏠", permission: "dashboard" },
  { href: "/movements", label: "Príjem", icon: "⬇️", permission: "movements" },
  { href: "/issues", label: "Výdaj", icon: "⬆️", permission: "issues" },
  { href: "/orders", label: "Picker", icon: "📲", permission: "orders" },
];

const moreLinks = [
  { href: "/stock", label: "Stav skladu", icon: "📦", permission: "stock" },
  { href: "/transfers", label: "Presun", icon: "🔄", permission: "transfers" },
  { href: "/inventory", label: "Inventúra", icon: "📋", permission: "inventory" },
  { href: "/orders", label: "Objednávky", icon: "🛒", permission: "orders" },
  { href: "/products", label: "Produkty", icon: "🧾", permission: "products" },
  { href: "/suppliers", label: "Dodávatelia", icon: "🚚", permission: "suppliers" },
  { href: "/warehouses", label: "Sklady", icon: "🏬", permission: "warehouses" },
  { href: "/locations", label: "Lokácie", icon: "📍", permission: "locations" },
  { href: "/users", label: "Používatelia", icon: "👤", permission: "users" },
  { href: "/reports/sales", label: "Predaje", icon: "📊", permission: "orders" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [moreOpen, setMoreOpen] = useState(false);

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

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const allowedMainLinks = useMemo(() => {
    if (!profile) return [];

    if (profile.role === "admin") {
      return mainLinks;
    }

    const permissions = profile.permissions ?? {};
    return mainLinks.filter((link) => permissions[link.permission]);
  }, [profile]);

  const allowedMoreLinks = useMemo(() => {
    if (!profile) return [];

    if (profile.role === "admin") {
      return moreLinks;
    }

    const permissions = profile.permissions ?? {};
    return moreLinks.filter((link) => permissions[link.permission]);
  }, [profile]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMoreOpen(false);
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return null;
  }

  return (
    <>
      {moreOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      ) : null}

      <div
        className={`fixed inset-x-0 bottom-16 z-50 mx-3 rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition md:hidden ${
          moreOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="text-base font-semibold text-gray-900">Viac možností</div>
          <div className="text-sm text-gray-500">Ďalšie sekcie systému</div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4">
          {allowedMoreLinks.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-2xl border px-4 py-4 ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-gray-200 bg-white text-gray-800"
                }`}
              >
                <div className="text-2xl">{link.icon}</div>
                <div className="mt-2 text-sm font-semibold">{link.label}</div>
              </Link>
            );
          })}
        </div>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-500"
          >
            Odhlásiť sa
          </button>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <div className="grid grid-cols-5">
          {allowedMainLinks.map((link) => {
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

          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center gap-1 px-2 py-3 text-[11px] ${
              moreOpen ? "text-slate-900" : "text-gray-500"
            }`}
          >
            <span className="text-lg">☰</span>
            <span>Viac</span>
          </button>
        </div>
      </nav>
    </>
  );
}