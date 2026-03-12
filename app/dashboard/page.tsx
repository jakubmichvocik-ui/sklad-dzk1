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
        is_active: boolean | null;
      }
    | {
        name: string;
        sku: string | null;
        is_active: boolean | null;
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
    is_active: boolean | null;
  } | null;
};

type QuickAction = {
  href: string;
  title: string;
  description: string;
  icon: string;
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

    supabase.from("stock_balances").select(`
      id,
      quantity,
      products (
        name,
        sku,
        min_stock,
        purchase_price,
        sale_price,
        is_active
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
          sku,
          is_active
        )
      `)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stockRowsAll = (stockRowsRaw ?? []) as unknown as StockRow[];
  const stockRows = stockRowsAll.filter((row) => row.products?.is_active !== false);

  const recentMovementsAll = (recentMovementsRaw ?? []) as unknown as MovementRow[];
  const recentMovements = recentMovementsAll.filter((movement) => {
    const product = Array.isArray(movement.products)
      ? movement.products[0]
      : movement.products;

    return product?.is_active !== false;
  });

  const totalItems = stockRows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);

  const totalPurchaseValue = stockRows.reduce((sum, row) => {
    const qty = Number(row.quantity ?? 0);
    const price = Number(row.products?.purchase_price ?? 0);
    return sum + qty * price;
  }, 0);

  const lowStockCount = stockRows.filter((row) => {
    const qty = Number(row.quantity ?? 0);
    const min = Number(row.products?.min_stock ?? 0);
    return qty <= min;
  }).length;

  const quickActions: QuickAction[] = [
    { href: "/movements", title: "Príjem", description: "Naskladni tovar", icon: "⬇️" },
    { href: "/issues", title: "Výdaj", description: "Odpíš tovar", icon: "⬆️" },
    { href: "/transfers", title: "Presun", description: "Presuň zásoby", icon: "🔄" },
    { href: "/inventory", title: "Inventúra", description: "Spusti kontrolu", icon: "📋" },
    { href: "/orders", title: "Objednávky", description: "Picker a e-shop", icon: "🛒" },
    { href: "/stock", title: "Stav skladu", description: "Prehľad zásob", icon: "📦" },
  ];

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
    <div className="space-y-6 pb-24 md:pb-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-5 text-white shadow-lg md:p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Dashboard skladu
          </h1>
          <p className="mt-2 text-sm text-slate-200 md:text-base">
            Mobilný prehľad skladu, zásob a rýchlych akcií.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Aktívne produkty</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {productsCount ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Aktívne sklady</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {warehousesCount ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Aktívne lokácie</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {locationsCount ?? 0}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Pod minimom</div>
          <div className="mt-2 text-2xl font-bold text-red-600 md:text-3xl">
            {lowStockCount}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Spolu kusov</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {totalItems.toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Nákupná hodnota</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {totalPurchaseValue.toFixed(2)} €
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
          <div className="text-xs text-gray-500 md:text-sm">Nízky stav</div>
          <div className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
            {lowStockCount}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Rýchle akcie</h2>
          <p className="text-sm text-gray-500">Veľké tlačidlá pre mobil</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
            >
              <div className="text-2xl">{action.icon}</div>
              <div className="mt-3 text-base font-semibold text-gray-900">
                {action.title}
              </div>
              <div className="mt-1 text-xs text-gray-500 md:text-sm">
                {action.description}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 md:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Posledné pohyby</h2>
          <p className="text-sm text-gray-500">Najnovšie operácie v sklade</p>
        </div>

        <div className="space-y-3 md:hidden">
          {recentMovements.length > 0 ? (
            recentMovements.map((movement) => {
              const product = Array.isArray(movement.products)
                ? movement.products[0]
                : movement.products;

              return (
                <div
                  key={movement.id}
                  className="rounded-xl border border-gray-100 p-3"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {product?.sku ? `${product.sku} - ${product.name}` : product?.name || "-"}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {movementLabel(movement.movement_type)}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {Number(movement.quantity).toFixed(2)}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(movement.created_at).toLocaleString("sk-SK")}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">Zatiaľ nemáš žiadne pohyby.</div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-gray-100 md:block">
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
      </section>
    </div>
  );
}