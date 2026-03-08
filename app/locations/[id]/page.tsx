import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../../components/page-header";
import SectionCard from "../../../components/section-card";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LocationEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("id", id)
    .single();

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (!location) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lokácia" description="Lokácia nebola nájdená" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upraviť lokáciu"
        description="Úprava údajov lokácie"
      />

      <SectionCard>
        <form action={`/locations/${id}/update`} method="post" className="grid gap-4 md:grid-cols-2">
          <select
            name="warehouse_id"
            defaultValue={location.warehouse_id}
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          >
            {warehouses?.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>

          <input
            name="name"
            defaultValue={location.name}
            placeholder="Názov lokácie"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <input
            name="code"
            defaultValue={location.code}
            placeholder="Kód lokácie"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <select
            name="is_active"
            defaultValue={location.is_active ? "true" : "false"}
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          >
            <option value="true">Aktívna</option>
            <option value="false">Neaktívna</option>
          </select>

          <button className="rounded-xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-500 md:col-span-2">
            Uložiť zmeny
          </button>
        </form>
      </SectionCard>
    </div>
  );
}