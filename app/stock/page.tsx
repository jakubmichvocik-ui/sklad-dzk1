import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type StockPageProps = {
  searchParams: Promise<{
    q?: string;
    warehouse?: string;
    low?: string;
  }>;
};

type StockRow = {
  id: string;
  quantity: number;
  updated_at: string;
  products: {
    name: string;
    sku: string | null;
    unit: string;
    min_stock: number | null;
    purchase_price: number | null;
    sale_price: number | null;
  } | null;
  warehouses: {
    id?: string;
    name: string;
  } | null;
  locations: {
    name: string;
    code: string;
  } | null;
};

export default async function StockPage({ searchParams }: StockPageProps) {
  await requirePermission("stock");

  const supabase = await createClient();
  const params = await searchParams;

  const q = (params.q || "").trim();
  const warehouse = (params.warehouse || "").trim();
  const low = params.low === "1";

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  let query = supabase
    .from("stock_balances")
    .select(`
      id,
      quantity,
      updated_at,
      products (
        name,
        sku,
        unit,
        min_stock,
        purchase_price,
        sale_price
      ),
      warehouses (
        id,
        name
      ),
      locations (
        name,
        code
      )
    `)
    .order("updated_at", { ascending: false });

  if (warehouse) {
    query = query.eq("warehouse_id", warehouse);
  }

  const { data, error } = await query;
  let rows = (data ?? []) as unknown as StockRow[];

  if (q) {
    const qLower = q.toLowerCase();
    rows = rows.filter((row) => {
      const name = row.products?.name?.toLowerCase() || "";
      const sku = row.products?.sku?.toLowerCase() || "";
      return name.includes(qLower) || sku.includes(qLower);
    });
  }

  if (low) {
    rows = rows.filter(
      (row) => Number(row.quantity) <= Number(row.products?.min_stock ?? 0)
    );
  }

  const totalPurchaseValue = rows.reduce((sum, row) => {
    const price = Number(row.products?.purchase_price ?? 0);
    return sum + Number(row.quantity) * price;
  }, 0);

  const totalSaleValue = rows.reduce((sum, row) => {
    const price = Number(row.products?.sale_price ?? 0);
    return sum + Number(row.quantity) * price;
  }, 0);

  const totalItems = rows.reduce((sum, row) => sum + Number(row.quantity), 0);

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title="Stav skladu"
        description="Aktuálny prehľad zásob podľa skladov a lokácií"
      />

      <div className="flex justify-end">
        <a
          href="/stock/export"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
        >
          Export do Excelu
        </a>
      </div>

      <SectionCard
        title="Filtre"
        description="Vyhľadávanie podľa produktu a filtrovanie podľa skladu"
      >
        <form method="get" className="grid gap-4 md:grid-cols-4">
          <input
            name="q"
            defaultValue={q}
            placeholder="Hľadaj názov alebo SKU"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
          />

          <select
            name="warehouse"
            defaultValue={warehouse}
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
          >
            <option value="">Všetky aktívne sklady</option>
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700">
            <input type="checkbox" name="low" value="1" defaultChecked={low} />
            Len pod minimom
          </label>

          <div className="flex gap-2">
            <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800">
              Filtrovať
            </button>

            <a
              href="/stock"
              className="rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Reset
            </a>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard>
          <div className="text-sm text-gray-500">Spolu kusov</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalItems.toFixed(2)}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="text-sm text-gray-500">Nákupná hodnota zásob</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalPurchaseValue.toFixed(2)} €
          </div>
        </SectionCard>

        <SectionCard>
          <div className="text-sm text-gray-500">Predajná hodnota zásob</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalSaleValue.toFixed(2)} €
          </div>
        </SectionCard>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Sklad</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Lokácia</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Množstvo</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Min. zásoba</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Jednotka</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Nákupná hodnota</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Predajná hodnota</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Aktualizované</th>
              </tr>
            </thead>

            <tbody>
              {error ? (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-sm text-red-600">
                    Chyba pri načítaní stavu skladu
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                rows.map((row) => {
                  const purchasePrice = Number(row.products?.purchase_price ?? 0);
                  const salePrice = Number(row.products?.sale_price ?? 0);
                  const purchaseValue = Number(row.quantity) * purchasePrice;
                  const saleValue = Number(row.quantity) * salePrice;
                  const isLow =
                    Number(row.quantity) <= Number(row.products?.min_stock ?? 0);

                  return (
                    <tr
                      key={row.id}
                      className={`border-t border-gray-100 ${isLow ? "bg-red-50" : ""}`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.products?.sku || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.products?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.warehouses?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.locations
                          ? `${row.locations.code} - ${row.locations.name}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(row.quantity).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(row.products?.min_stock ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.products?.unit || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {purchaseValue.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {saleValue.toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(row.updated_at).toLocaleString("sk-SK")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-4 text-sm text-gray-500">
                    Nenašli sa žiadne zásoby.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}