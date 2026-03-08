import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type LocationsPageProps = {
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  await requirePermission("locations");

  const params = await searchParams;
  const errorMessage = params.error || "";
  const updated = params.updated === "1";

  const supabase = await createClient();

  const { data: locations, error } = await supabase
    .from("locations")
    .select(`
      id,
      name,
      code,
      is_active,
      created_at,
      warehouse_id,
      warehouses (
        name
      )
    `)
    .order("created_at", { ascending: false });

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lokácie"
        description="Správa regálov, zón a lokácií v skladoch"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Operáciu sa nepodarilo vykonať: {errorMessage}
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Lokácia bola úspešne upravená.
        </div>
      ) : null}

      <SectionCard
        title="Pridať lokáciu"
        description="Priraď novú lokáciu ku konkrétnemu skladu"
      >
        <form action="/locations/new" method="post" className="grid gap-4 md:grid-cols-3">
          <select
            name="warehouse_id"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Vyber sklad
            </option>
            {warehouses?.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <input
            name="name"
            placeholder="Názov lokácie"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none"
            required
          />

          <input
            name="code"
            placeholder="Kód lokácie"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none"
            required
          />

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white md:col-span-3">
            Uložiť lokáciu
          </button>
        </form>
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Sklad</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Názov</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Kód</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Aktívna</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Vytvorené</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-sm text-red-600">
                  Chyba pri načítaní lokácií
                </td>
              </tr>
            ) : locations && locations.length > 0 ? (
              locations.map((location) => (
                <tr key={location.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {Array.isArray(location.warehouses)
                      ? location.warehouses[0]?.name ?? "-"
                      : (location.warehouses as { name?: string } | null)?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {location.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {location.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {location.is_active ? "Áno" : "Nie"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(location.created_at).toLocaleString("sk-SK")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/locations/${location.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                      >
                        Upraviť
                      </a>

                      {location.is_active ? (
                        <form action={`/locations/${location.id}/deactivate`} method="post">
                          <button
                            type="submit"
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white hover:bg-amber-500"
                          >
                            Deaktivovať
                          </button>
                        </form>
                      ) : (
                        <form action={`/locations/${location.id}/activate`} method="post">
                          <button
                            type="submit"
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-500"
                          >
                            Aktivovať
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-sm text-gray-500">
                  Zatiaľ nemáš žiadne lokácie.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}