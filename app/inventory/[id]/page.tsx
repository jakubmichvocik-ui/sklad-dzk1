import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

type InventoryItemRow = {
  id: string;
  system_qty: number;
  counted_qty: number;
  difference_qty: number;
  note: string | null;
  products:
    | {
        name: string;
        sku: string | null;
        unit: string;
      }
    | {
        name: string;
        sku: string | null;
        unit: string;
      }[]
    | null;
};

export default async function InventoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("inventory_sessions")
    .select(`
      id,
      status,
      note,
      created_at,
      completed_at,
      warehouses ( name ),
      locations ( name, code )
    `)
    .eq("id", id)
    .single();

  const { data: items, error } = await supabase
    .from("inventory_items")
    .select(`
      id,
      system_qty,
      counted_qty,
      difference_qty,
      note,
      products (
        name,
        sku,
        unit
      )
    `)
    .eq("session_id", id);

  const typedItems = (items ?? []) as InventoryItemRow[];

  const totalDifference = typedItems.reduce(
    (sum, item) => sum + Number(item.difference_qty ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mb-6 rounded-2xl bg-white p-5 shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Detail inventúry</h1>
            <p className="mt-2 text-gray-600">Stav: {session?.status || "-"}</p>
            <p className="text-gray-600">Poznámka: {session?.note || "-"}</p>
            <p className="text-gray-600">Rozdiel spolu: {totalDifference.toFixed(2)}</p>
            <p className="text-gray-600">
              Dokončené: {session?.completed_at ? new Date(session.completed_at).toLocaleString("sk-SK") : "-"}
            </p>
          </div>

          {session?.status !== "completed" ? (
            <form action={`/inventory/${id}/complete`} method="post">
              <button className="rounded-xl bg-green-700 px-4 py-2 text-white">
                Uzatvoriť inventúru
              </button>
            </form>
          ) : (
            <div className="rounded-xl bg-gray-200 px-4 py-2 text-gray-700">
              Inventúra uzatvorená
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3">Jednotka</th>
              <th className="px-4 py-3">Systém</th>
              <th className="px-4 py-3">Spočítané</th>
              <th className="px-4 py-3">Rozdiel</th>
              <th className="px-4 py-3">Upraviť</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-red-600">
                  Chyba pri načítaní položiek inventúry
                </td>
              </tr>
            ) : typedItems.length > 0 ? (
              typedItems.map((item) => {
                const product = Array.isArray(item.products)
                  ? item.products[0]
                  : item.products;

                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-3">{product?.sku || "-"}</td>
                    <td className="px-4 py-3">{product?.name || "-"}</td>
                    <td className="px-4 py-3">{product?.unit || "-"}</td>
                    <td className="px-4 py-3">{Number(item.system_qty).toFixed(2)}</td>
                    <td className="px-4 py-3">{Number(item.counted_qty).toFixed(2)}</td>
                    <td className="px-4 py-3">{Number(item.difference_qty).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {session?.status !== "completed" ? (
                        <form action={`/inventory/${id}/update-item`} method="post" className="flex gap-2">
                          <input type="hidden" name="item_id" value={item.id} />
                          <input
                            name="counted_qty"
                            type="number"
                            step="0.01"
                            defaultValue={Number(item.counted_qty)}
                            className="w-32 rounded-xl border px-3 py-2"
                            required
                          />
                          <button className="rounded-xl bg-black px-3 py-2 text-white">
                            Uložiť
                          </button>
                        </form>
                      ) : (
                        <span className="text-gray-500">Uzamknuté</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-gray-500">
                  Inventúra nemá žiadne položky.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}