import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
    q?: string;
  }>;
};

type InventorySessionRow = {
  id: string;
  status: string | null;
  note: string | null;
  created_at: string;
  completed_at: string | null;
  warehouse_id: string | null;
  location_id: string | null;
};

type WarehouseRow = {
  id: string;
  name: string;
};

type LocationRow = {
  id: string;
  name: string;
  code: string;
};

type InventoryItemRow = {
  id: string;
  expected_qty: number | null;
  counted_qty: number | null;
  difference_qty: number | null;
  note: string | null;
  products:
    | {
        name: string;
        sku: string | null;
        barcode: string | null;
        unit: string | null;
      }
    | {
        name: string;
        sku: string | null;
        barcode: string | null;
        unit: string | null;
      }[]
    | null;
};

export default async function InventoryDetailPage({
  params,
  searchParams,
}: Props) {
  await requirePermission("inventory");

  const { id } = await params;
  const query = await searchParams;

  const errorMessage = query.error || "";
  const success = query.success === "1";
  const q = (query.q || "").trim().toLowerCase();

  const supabase = await createClient();

  const { data: sessionRaw, error: sessionError } = await supabase
    .from("inventory_sessions")
    .select("id, status, note, created_at, completed_at, warehouse_id, location_id")
    .eq("id", id)
    .maybeSingle();

  const session = sessionRaw as InventorySessionRow | null;

  if (sessionError || !session) {
    return (
      <div className="space-y-6 pb-24 md:pb-6">
        <PageHeader
          title="Inventúra"
          description="Inventúra nebola nájdená"
        />
        <SectionCard>
          <div className="text-sm text-red-600">
            {sessionError?.message || "Záznam inventúry neexistuje."}
          </div>
          <div className="mt-4">
            <Link
              href="/inventory"
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Späť na inventúry
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  let warehouseName = "-";
  let locationLabel = "Celý sklad";

  if (session.warehouse_id) {
    const { data: warehouseRaw } = await supabase
      .from("warehouses")
      .select("id, name")
      .eq("id", session.warehouse_id)
      .maybeSingle();

    const warehouse = warehouseRaw as WarehouseRow | null;
    warehouseName = warehouse?.name || "-";
  }

  if (session.location_id) {
    const { data: locationRaw } = await supabase
      .from("locations")
      .select("id, name, code")
      .eq("id", session.location_id)
      .maybeSingle();

    const location = locationRaw as LocationRow | null;
    locationLabel = location ? `${location.code} - ${location.name}` : "-";
  }

  const { data: itemsRaw, error } = await supabase
    .from("inventory_items")
    .select(`
      id,
      expected_qty,
      counted_qty,
      difference_qty,
      note,
      products (
        name,
        sku,
        barcode,
        unit
      )
    `)
    .eq("inventory_session_id", id)
    .order("created_at", { ascending: true });

  let items = (itemsRaw ?? []) as InventoryItemRow[];

  if (q) {
    items = items.filter((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      const name = product?.name?.toLowerCase() || "";
      const sku = product?.sku?.toLowerCase() || "";
      const barcode = product?.barcode?.toLowerCase() || "";
      return name.includes(q) || sku.includes(q) || barcode.includes(q);
    });
  }

  const isClosed = session.status === "closed" || session.status === "completed";

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title="Detail inventúry"
        description={`Sklad: ${warehouseName} | Lokácia: ${locationLabel}`}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <a
          href={`/inventory/${id}/print`}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
        >
          Tlač inventúrneho hárku
        </a>

        {!isClosed ? (
          <form action={`/inventory/${id}/complete`} method="post">
            <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800">
              Uzatvoriť inventúru
            </button>
          </form>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Zmena bola úspešne uložená.
        </div>
      ) : null}

      <SectionCard
        title="Hľadať položku"
        description="Zadaj názov, SKU alebo čiarový kód"
      >
        <form method="get" className="grid gap-4 md:grid-cols-3">
          <input
            name="q"
            defaultValue={query.q || ""}
            placeholder="Hľadaj alebo naskenuj kód"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none"
          />
          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white">
            Hľadať
          </button>
          <a
            href={`/inventory/${id}`}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-center"
          >
            Reset
          </a>
        </form>
      </SectionCard>

      <SectionCard
        title="Položky inventúry"
        description="Vyhľadávanie funguje aj pre čiarový kód"
      >
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Chyba pri načítaní položiek inventúry
          </div>
        ) : null}

        {!error && items.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Inventúra nemá žiadne položky alebo nič nevyhovuje filtru.
          </div>
        ) : null}

        {!error ? (
          <>
            <div className="space-y-4 md:hidden">
              {items.map((item) => {
                const product = Array.isArray(item.products)
                  ? item.products[0]
                  : item.products;

                const expected = Number(item.expected_qty ?? 0);
                const difference = Number(item.difference_qty ?? 0);
                const counted =
                  item.counted_qty === null || item.counted_qty === undefined
                    ? ""
                    : String(item.counted_qty);

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="text-lg font-bold text-gray-900">
                      {product?.sku
                        ? `${product.sku} - ${product.name}`
                        : product?.name || "-"}
                    </div>

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <div>Čiarový kód: {product?.barcode || "-"}</div>
                      <div>MJ: {product?.unit || "-"}</div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Systémový stav</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">
                          {expected.toFixed(2)}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">Rozdiel</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">
                          {difference.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {isClosed ? (
                      <div className="mt-4 rounded-2xl border border-gray-200 p-4">
                        <div className="text-sm text-gray-500">Spočítané</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">
                          {Number(item.counted_qty ?? 0).toFixed(2)}
                        </div>
                        <div className="mt-3 text-sm text-gray-500">Poznámka</div>
                        <div className="mt-1 text-sm text-gray-900">
                          {item.note || "-"}
                        </div>
                      </div>
                    ) : (
                      <form
                        action={`/inventory/${id}/update-item`}
                        method="post"
                        className="mt-4 space-y-3"
                      >
                        <input type="hidden" name="item_id" value={item.id} />
                        <input
                          name="counted_qty"
                          type="number"
                          step="0.01"
                          defaultValue={counted}
                          placeholder="Spočítané množstvo"
                          className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-lg outline-none transition focus:border-gray-400"
                        />

                        <input
                          name="note"
                          type="text"
                          defaultValue={item.note || ""}
                          placeholder="Poznámka"
                          className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
                        />

                        <button className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-lg font-semibold text-white shadow hover:bg-blue-500">
                          Uložiť položku
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
              <table className="min-w-[1150px] w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">SKU</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Čiarový kód</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">MJ</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Systémový stav</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Spočítané</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Rozdiel</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Poznámka</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const product = Array.isArray(item.products)
                      ? item.products[0]
                      : item.products;

                    return (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product?.sku || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product?.barcode || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {product?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {product?.unit || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {Number(item.expected_qty ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {Number(item.counted_qty ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {Number(item.difference_qty ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.note || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </SectionCard>

      <div>
        <Link
          href="/inventory"
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Späť na inventúry
        </Link>
      </div>
    </div>
  );
}