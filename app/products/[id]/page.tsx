import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
  }>;
};

type MovementRow = {
  id: string;
  movement_type: string;
  quantity: number;
  note: string | null;
  created_at: string;
};

type StockBalanceRow = {
  id: string;
  quantity: number;
  updated_at: string;
  warehouses: { name: string } | { name: string }[] | null;
  locations: { name: string; code: string } | { name: string; code: string }[] | null;
};

export default async function ProductEditPage({ params, searchParams }: Props) {
  await requirePermission("products");

  const { id } = await params;
  const query = await searchParams;
  const errorMessage = query.error || "";

  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  const { data: stockBalancesRaw } = await supabase
    .from("stock_balances")
    .select(`
      id,
      quantity,
      updated_at,
      warehouses ( name ),
      locations ( name, code )
    `)
    .eq("product_id", id)
    .order("updated_at", { ascending: false });

  const { data: movementsRaw } = await supabase
    .from("stock_movements")
    .select(`
      id,
      movement_type,
      quantity,
      note,
      created_at
    `)
    .eq("product_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!product) {
    return (
      <div className="space-y-6">
        <PageHeader title="Produkt" description="Produkt nebol nájdený" />
      </div>
    );
  }

  const stockBalances = (stockBalancesRaw ?? []) as StockBalanceRow[];
  const movements = (movementsRaw ?? []) as MovementRow[];

  function movementLabel(type: string) {
    switch (type) {
      case "receipt":
        return "Príjem";
      case "issue":
        return "Výdaj";
      case "transfer":
        return "Presun";
      case "inventory_adjustment":
        return "Inventúrny rozdiel";
      default:
        return type;
    }
  }

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title="Upraviť produkt"
        description="Úprava údajov produktu a história pohybov"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <SectionCard>
        <form action={`/products/${id}/update`} method="post" className="grid gap-4 md:grid-cols-2">
          <input
            name="sku"
            defaultValue={product.sku || ""}
            placeholder="SKU"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <input
            name="barcode"
            defaultValue={product.barcode || ""}
            placeholder="Čiarový kód"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <input
            name="name"
            defaultValue={product.name}
            placeholder="Názov produktu"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <input
            name="unit"
            defaultValue={product.unit}
            placeholder="Jednotka"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <input
            name="min_stock"
            type="number"
            step="0.01"
            defaultValue={product.min_stock ?? 0}
            placeholder="Minimálna zásoba"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <input
            name="purchase_price"
            type="number"
            step="0.01"
            defaultValue={product.purchase_price ?? 0}
            placeholder="Nákupná cena"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <input
            name="sale_price"
            type="number"
            step="0.01"
            defaultValue={product.sale_price ?? 0}
            placeholder="Predajná cena"
            className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
          />

          <textarea
            name="description"
            defaultValue={product.description || ""}
            placeholder="Popis produktu"
            className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
          />

          <div className="flex gap-2 md:col-span-2">
            <button className="rounded-xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-500">
              Uložiť zmeny
            </button>

            <a
              href={`/products/${id}/export`}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
            >
              Export histórie do Excelu
            </a>
          </div>
        </form>
      </SectionCard>

      <SectionCard
        title="Aktuálny stav produktu"
        description="Zásoby produktu podľa skladov a lokácií"
      >
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Sklad</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Lokácia</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Množstvo</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Aktualizované</th>
                </tr>
              </thead>
              <tbody>
                {stockBalances.length > 0 ? (
                  stockBalances.map((row) => {
                    const warehouse = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;
                    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;

                    return (
                      <tr key={row.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-700">{warehouse?.name || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {location ? `${location.code} - ${location.name}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{Number(row.quantity).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(row.updated_at).toLocaleString("sk-SK")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-gray-500">
                      Produkt zatiaľ nemá žiadne zásoby.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="História pohybov"
        description="Príjmy, výdaje, presuny a inventúrne rozdiely"
      >
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Typ</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Množstvo</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Poznámka</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Dátum</th>
                </tr>
              </thead>
              <tbody>
                {movements.length > 0 ? (
                  movements.map((movement) => (
                    <tr key={movement.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {movementLabel(movement.movement_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {Number(movement.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {movement.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleString("sk-SK")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-gray-500">
                      Produkt zatiaľ nemá žiadnu históriu pohybov.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}