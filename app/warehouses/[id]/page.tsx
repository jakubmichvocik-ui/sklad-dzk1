import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../../components/page-header";
import SectionCard from "../../../components/section-card";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WarehouseEditPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: warehouse } = await supabase
    .from("warehouses")
    .select("*")
    .eq("id", id)
    .single();

  if (!warehouse) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sklad" description="Sklad nebol nájdený" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upraviť sklad"
        description="Úprava údajov skladu"
      />

      <SectionCard>
        <form action={`/warehouses/${id}/update`} method="post" className="grid gap-4 md:grid-cols-2">
          <input
            name="name"
            defaultValue={warehouse.name}
            placeholder="Názov skladu"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <input
            name="code"
            defaultValue={warehouse.code || ""}
            placeholder="Kód skladu"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <select
            name="is_active"
            defaultValue={warehouse.is_active ? "true" : "false"}
            className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
          >
            <option value="true">Aktívny</option>
            <option value="false">Neaktívny</option>
          </select>

          <button className="rounded-xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-500 md:col-span-2">
            Uložiť zmeny
          </button>
        </form>
      </SectionCard>
    </div>
  );
}