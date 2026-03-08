import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

type MovementRow = {
  id: string;
  movement_type: string;
  quantity: number;
  created_at: string;
  products:
    | {
        name: string;
        sku: string | null;
      }
    | {
        name: string;
        sku: string | null;
      }[]
    | null;
};

type StockRow = {
  id: string;
  quantity: number;
  products: {
    name: string;
    sku: string | null;
    min_stock: number | null;
    purchase_price: number | null;
    sale_price: number | null;
  } | null;
};

export default async function DashboardPage() {
  await requirePermission("dashboard");

  const supabase = await createClient();

  const [
    { count: productsCount },
    { count: warehousesCount },
    { count: locationsCount },
    { data: stockRowsRaw },
    { data: recentMovementsRaw },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("warehouses")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("locations")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("stock_balances")
      .select(`
        id,
        quantity,
        products (
          name,
          sku,
          min_stock,
          purchase_price,
          sale_price
        )
      `),

    supabase
      .from("stock_movements")
      .select(`
        id,
        movement_type,
        quantity,
        created_at,
        products (
          name,
          sku
        )
      `)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stockRows = (stockRowsRaw ?? []) as unknown as StockRow[];
  const recentMovements = (recentMovementsRaw ?? []) as unknown as MovementRow[];

  const totalItems = stockRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);

  const totalPurchaseValue = stockRows.reduce((sum, row) => {
    const qty = Number(row.quantity ?? 0);
    const price = Number(row.products?.purchase_price ?? 0);
    return sum + qty * price;
  }, 0);

  const totalSaleValue = stockRows.reduce((sum, row) => {
    const qty = Number(row.quantity ?? 0);
    const price = Number(row.products?.sale_price ?? 0);
    return sum + qty * price;
  }, 0);

  const lowStockCount = stockRows.filter((row) => {
    const qty = Number(row.quantity ?? 0);
    const min = Number(row.products?.min_stock ?? 0);
    return qty <= min;
  }).length;

  function movementLabel(type: string) {
    switch (type) {
      case "receipt":
        return "Príjem";
      case "issue":
        return "Výdaj";
      case "transfer":
        return "Presun";
      case "inventory_adjustment":
        return "Inventúra";
      default:
        return type;
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg md:p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard skladu</h1>
          <p className="mt-2 text-slate-200">
            Prehľad aktívnych údajov, zásob a posledných pohybov v systéme.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Aktívne produkty</div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{productsCount ?? 0}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Aktívne sklady</div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{warehousesCount ?? 0}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Aktívne lokácie</div>
          <div className="mt-3 text-3xl font-bold text-gray-900">{locationsCount ?? 0}</div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Pod minimom</div>
          <div className="mt-3 text-3xl font-bold text-red-600">{lowStockCount}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Spolu kusov</div>
          <div className="mt-3 text-3xl font-bold text-gray-900">
            {totalItems.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Nákupná hodnota zásob</div>
          <div className="mt-3 text-3xl font-bold text-gray-900">
            {totalPurchaseValue.toFixed(2)} €
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
          <div className="text-sm text-gray-500">Predajná hodnota zásob</div>
          <div className="mt-3 text-3xl font-bold text-gray-900">
            {totalSaleValue.toFixed(2)} €
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 xl:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Posledné pohyby</h2>
            <p className="text-sm text-gray-500">Najnovšie operácie v sklade</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Typ</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Množstvo</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Dátum</th>
                </tr>
              </thead>
              <tbody>
                {recentMovements.length > 0 ? (
                  recentMovements.map((movement) => {
                    const product = Array.isArray(movement.products)
                      ? movement.products[0]
                      : movement.products;

                    return (
                      <tr key={movement.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {movementLabel(movement.movement_type)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {product?.sku ? `${product.sku} - ${product.name}` : product?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {Number(movement.quantity).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(movement.created_at).toLocaleString("sk-SK")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-sm text-gray-500">
                      Zatiaľ nemáš žiadne pohyby.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/movements"
            className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <div className="text-sm text-gray-500">Rýchla akcia</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">Príjem tovaru</div>
            <p className="mt-1 text-sm text-gray-500">Naskladni nové množstvo na lokáciu.</p>
          </Link>

          <Link
            href="/issues"
            className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <div className="text-sm text-gray-500">Rýchla akcia</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">Výdaj tovaru</div>
            <p className="mt-1 text-sm text-gray-500">Odpíš tovar zo skladu.</p>
          </Link>

          <Link
            href="/stock"
            className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <div className="text-sm text-gray-500">Rýchla akcia</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">Stav skladu</div>
            <p className="mt-1 text-sm text-gray-500">Pozri aktuálne zásoby a hodnotu skladu.</p>
          </Link>

          <Link
            href="/inventory"
            className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
          >
            <div className="text-sm text-gray-500">Rýchla akcia</div>
            <div className="mt-2 text-lg font-semibold text-gray-900">Inventúra</div>
            <p className="mt-1 text-sm text-gray-500">Spusti kontrolu skladu alebo lokácie.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}