import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import InventoryCreateForm from "../../components/inventory-create-form";
import { requirePermission } from "@/lib/auth/require-permission";

type InventorySession = {
  id: string;
  status: string;
  note: string | null;
  created_at: string;
  completed_at: string | null;
  warehouses: { name: string } | { name: string }[] | null;
  locations: { name: string; code: string } | { name: string; code: string }[] | null;
};

type InventoryPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type Warehouse = {
  id: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
  code: string;
  warehouse_id: string;
};

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  await requirePermission("inventory");

  const params = await searchParams;
  const errorMessage = params.error || "";
  const success = params.success === "1";

  const supabase = await createClient();

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, code, warehouse_id")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: sessionsRaw, error } = await supabase
    .from("inventory_sessions")
    .select(`
      id,
      status,
      note,
      created_at,
      completed_at,
      warehouses ( name ),
      locations ( name, code )
    `)
    .order("created_at", { ascending: false });

  const sessions = (sessionsRaw ?? []) as InventorySession[];
  const typedWarehouses = (warehouses ?? []) as Warehouse[];
  const typedLocations = (locations ?? []) as Location[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventúra"
        description="Zakladanie a správa inventúr skladu"
      />

      <div className="flex justify-end">
        <a
          href="/inventory/export"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
        >
          Export do Excelu
        </a>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Inventúru sa nepodarilo vytvoriť: {errorMessage}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Inventúra bola úspešne vytvorená.
        </div>
      ) : null}

      <SectionCard
        title="Nová inventúra"
        description="Vytvor inventúru pre celý sklad alebo konkrétnu lokáciu"
      >
        <InventoryCreateForm
          warehouses={typedWarehouses}
          locations={typedLocations}
        />
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Sklad</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Lokácia</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Stav</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Poznámka</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Vytvorené</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Detail</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Tlač</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-sm text-red-600">
                  Chyba pri načítaní inventúr
                </td>
              </tr>
            ) : sessions.length > 0 ? (
              sessions.map((session) => {
                const warehouse = Array.isArray(session.warehouses)
                  ? session.warehouses[0]
                  : session.warehouses;
                const location = Array.isArray(session.locations)
                  ? session.locations[0]
                  : session.locations;

                return (
                  <tr key={session.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {warehouse?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {location ? `${location.code} - ${location.name}` : "Celý sklad"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.status}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.note || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(session.created_at).toLocaleString("sk-SK")}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/inventory/${session.id}`}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                      >
                        Otvoriť
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`/inventory/${session.id}/print`}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500"
                      >
                        Tlač
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-sm text-gray-500">
                  Zatiaľ nemáš žiadne inventúry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}