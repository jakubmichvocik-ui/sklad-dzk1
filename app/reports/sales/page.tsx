import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type SalesPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

type MovementRow = {
  id: string;
  quantity: number;
  created_at: string;
  products:
    | {
        name: string;
        sku: string | null;
        sale_price: number | null;
      }
    | {
        name: string;
        sku: string | null;
        sale_price: number | null;
      }[]
    | null;
};

export default async function SalesReportPage({ searchParams }: SalesPageProps) {
  await requirePermission("orders");

  const params = await searchParams;
  const period = params.period || "month";

  const supabase = await createClient();

  const now = new Date();
  const fromDate = new Date(now);

  if (period === "week") {
    fromDate.setDate(now.getDate() - 7);
  } else if (period === "year") {
    fromDate.setFullYear(now.getFullYear() - 1);
  } else {
    fromDate.setMonth(now.getMonth() - 1);
  }

  const { data: rowsRaw, error } = await supabase
    .from("stock_movements")
    .select(`
      id,
      quantity,
      created_at,
      products (
        name,
        sku,
        sale_price
      )
    `)
    .eq("movement_type", "issue")
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false });

  const rows = (rowsRaw ?? []) as MovementRow[];

  const grouped = new Map<
    string,
    {
      sku: string;
      name: string;
      qty: number;
      value: number;
    }
  >();

  for (const row of rows) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!product) continue;

    const key = `${product.sku || ""}|${product.name}`;
    const prev = grouped.get(key);

    const qty = Number(row.quantity ?? 0);
    const value = qty * Number(product.sale_price ?? 0);

    if (prev) {
      prev.qty += qty;
      prev.value += value;
    } else {
      grouped.set(key, {
        sku: product.sku || "-",
        name: product.name,
        qty,
        value,
      });
    }
  }

  const items = Array.from(grouped.values()).sort((a, b) => b.qty - a.qty);

  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const totalValue = items.reduce((sum, item) => sum + item.value, 0);

  const periodLabel =
    period === "week"
      ? "Posledných 7 dní"
      : period === "year"
      ? "Posledných 12 mesiacov"
      : "Posledných 30 dní";

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title="Prehľad predaných produktov"
        description={`Obdobie: ${periodLabel}`}
      />

      <div className="flex justify-end">
        <a
          href={`/reports/sales/export?period=${period}`}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
        >
          Export do Excelu
        </a>
      </div>

      <SectionCard title="Filter obdobia">
        <form method="get" className="flex flex-wrap gap-2">
          <button
            name="period"
            value="week"
            className={`rounded-xl px-4 py-2.5 ${
              period === "week"
                ? "bg-slate-900 text-white"
                : "border border-gray-200 bg-white text-gray-700"
            }`}
          >
            Týždeň
          </button>

          <button
            name="period"
            value="month"
            className={`rounded-xl px-4 py-2.5 ${
              period === "month"
                ? "bg-slate-900 text-white"
                : "border border-gray-200 bg-white text-gray-700"
            }`}
          >
            Mesiac
          </button>

          <button
            name="period"
            value="year"
            className={`rounded-xl px-4 py-2.5 ${
              period === "year"
                ? "bg-slate-900 text-white"
                : "border border-gray-200 bg-white text-gray-700"
            }`}
          >
            Rok
          </button>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <div className="text-sm text-gray-500">Predané množstvo</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalQty.toFixed(2)}
          </div>
        </SectionCard>

        <SectionCard>
          <div className="text-sm text-gray-500">Predajná hodnota</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {totalValue.toFixed(2)} €
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Predané produkty"
        description="Zoradené podľa predaného množstva"
      >
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">SKU</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Predané množstvo</th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Predajná hodnota</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-red-600">
                      Chyba pri načítaní reportu
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  items.map((item) => (
                    <tr key={`${item.sku}-${item.name}`} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.qty.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.value.toFixed(2)} €
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-sm text-gray-500">
                      V zvolenom období nie sú žiadne predaje.
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