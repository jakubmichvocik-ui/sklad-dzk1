import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
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
        unit: string | null;
      }
    | {
        name: string;
        sku: string | null;
        unit: string | null;
      }[]
    | null;
};

export default async function InventoryPrintPage({ params }: Props) {
  await requirePermission("inventory");

  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("inventory_sessions")
    .select(`
      id,
      status,
      note,
      created_at,
      warehouses ( name ),
      locations ( name, code )
    `)
    .eq("id", id)
    .single();

  const { data: itemsRaw } = await supabase
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
        unit
      )
    `)
    .eq("inventory_session_id", id)
    .order("created_at", { ascending: true });

  if (!session) {
    return <div className="p-6">Inventúra neexistuje.</div>;
  }

  const items = (itemsRaw ?? []) as InventoryItemRow[];
  const warehouse = Array.isArray(session.warehouses) ? session.warehouses[0] : session.warehouses;
  const location = Array.isArray(session.locations) ? session.locations[0] : session.locations;

  return (
    <main className="min-h-screen bg-white p-8 text-black print:p-4">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="no-print mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-slate-900 px-4 py-2 text-white"
        >
          Tlačiť
        </button>
        <a
          href={`/inventory/${id}`}
          className="rounded-xl border border-gray-300 px-4 py-2"
        >
          Späť
        </a>
      </div>

      <div className="mb-6 border-b border-black pb-4">
        <h1 className="text-2xl font-bold">Inventúrny hárok</h1>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <strong>Sklad:</strong> {warehouse?.name || "-"}
          </div>
          <div>
            <strong>Lokácia:</strong> {location ? `${location.code} - ${location.name}` : "Celý sklad"}
          </div>
          <div>
            <strong>Dátum vytvorenia:</strong> {new Date(session.created_at).toLocaleString("sk-SK")}
          </div>
          <div>
            <strong>Stav inventúry:</strong> {session.status}
          </div>
          <div className="col-span-2">
            <strong>Poznámka:</strong> {session.note || "-"}
          </div>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-black px-2 py-2 text-left">SKU</th>
            <th className="border border-black px-2 py-2 text-left">Produkt</th>
            <th className="border border-black px-2 py-2 text-left">MJ</th>
            <th className="border border-black px-2 py-2 text-right">Systémový stav</th>
            <th className="border border-black px-2 py-2 text-right">Skutočný stav</th>
            <th className="border border-black px-2 py-2 text-right">Rozdiel</th>
            <th className="border border-black px-2 py-2 text-left">Poznámka</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item) => {
              const product = Array.isArray(item.products) ? item.products[0] : item.products;

              return (
                <tr key={item.id}>
                  <td className="border border-black px-2 py-3">{product?.sku || ""}</td>
                  <td className="border border-black px-2 py-3">{product?.name || ""}</td>
                  <td className="border border-black px-2 py-3">{product?.unit || ""}</td>
                  <td className="border border-black px-2 py-3 text-right">
                    {Number(item.expected_qty ?? 0).toFixed(2)}
                  </td>
                  <td className="border border-black px-2 py-3 text-right">&nbsp;</td>
                  <td className="border border-black px-2 py-3 text-right">&nbsp;</td>
                  <td className="border border-black px-2 py-3">&nbsp;</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="border border-black px-2 py-4 text-center">
                Inventúra nemá položky.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-10 grid grid-cols-2 gap-10 text-sm">
        <div>
          <div className="mb-10 border-b border-black" />
          <div>Inventúru vykonal</div>
        </div>
        <div>
          <div className="mb-10 border-b border-black" />
          <div>Kontrola / podpis</div>
        </div>
      </div>
    </main>
  );
}