import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type WarehousesPageProps = {
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

export default async function WarehousesPage({ searchParams }: WarehousesPageProps) {
  await requirePermission("warehouses");

  const params = await searchParams;
  const errorMessage = params.error || "";
  const updated = params.updated === "1";

  const supabase = await createClient();

  const { data: warehouses, error } = await supabase
    .from("warehouses")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Sklady" description="Správa skladov" />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Operáciu sa nepodarilo vykonať: {errorMessage}
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Sklad bol úspešne upravený.
        </div>
      ) : null}

      <SectionCard title="Pridať sklad">
        <form action="/warehouses/new" method="post" className="grid gap-4 md:grid-cols-3">
          <input
            name="name"
            placeholder="Názov skladu"
            className="rounded-xl border px-3 py-2.5"
            required
          />

          <input
            name="code"
            placeholder="Kód skladu"
            className="rounded-xl border px-3 py-2.5"
          />

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white">
            Uložiť sklad
          </button>
        </form>
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm">Názov</th>
              <th className="px-4 py-3 text-sm">Kód</th>
              <th className="px-4 py-3 text-sm">Aktívny</th>
              <th className="px-4 py-3 text-sm">Akcie</th>
            </tr>
          </thead>

          <tbody>
            {error ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-red-600">
                  Chyba pri načítaní skladov
                </td>
              </tr>
            ) : warehouses?.length ? (
              warehouses.map((warehouse) => (
                <tr key={warehouse.id} className="border-t">
                  <td className="px-4 py-3">{warehouse.name}</td>
                  <td className="px-4 py-3">{warehouse.code || "-"}</td>
                  <td className="px-4 py-3">{warehouse.is_active ? "Áno" : "Nie"}</td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/warehouses/${warehouse.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                      >
                        Upraviť
                      </a>

                      {warehouse.is_active ? (
                        <form action={`/warehouses/${warehouse.id}/deactivate`} method="post">
                          <button
                            type="submit"
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white"
                          >
                            Deaktivovať
                          </button>
                        </form>
                      ) : (
                        <form action={`/warehouses/${warehouse.id}/activate`} method="post">
                          <button
                            type="submit"
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white"
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
                <td colSpan={4} className="px-4 py-4">
                  Žiadne sklady
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}