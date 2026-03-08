import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../../components/page-header";
import SectionCard from "../../../components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  status: string;
  note: string | null;
  created_at: string;
};

type PickerItemRow = {
  id: string;
  quantity: number;
  picked_qty: number;
  status: string;
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
  locations:
    | {
        name: string;
        code: string;
      }
    | {
        name: string;
        code: string;
      }[]
    | null;
};

export default async function PickerPage({ params }: Props) {
  await requirePermission("orders");

  const { id } = await params;
  const supabase = await createClient();

  const { data: orderRaw } = await supabase
    .from("customer_orders")
    .select(`
      id,
      order_number,
      customer_name,
      status,
      note,
      created_at
    `)
    .eq("id", id)
    .single();

  const { data: itemsRaw } = await supabase
    .from("customer_order_items")
    .select(`
      id,
      quantity,
      picked_qty,
      status,
      products (
        name,
        sku
      ),
      locations (
        name,
        code
      )
    `)
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const order = orderRaw as OrderRow | null;
  const items = (itemsRaw ?? []) as PickerItemRow[];

  if (!order) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Picker app"
          description="Objednávka neexistuje"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Picker app - ${order.order_number}`}
        description={`Zákazník: ${order.customer_name || "-"}`}
      />

      <div className="flex justify-end">
        <a
          href={`/picker/${id}/export`}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
        >
          Export picker listu
        </a>
      </div>

      <SectionCard
        title="Položky na vychystanie"
        description="Picker postupne označuje položky ako vychystané"
      >
        <div className="space-y-4">
          {items.length > 0 ? (
            items.map((item) => {
              const product = Array.isArray(item.products)
                ? item.products[0]
                : item.products;

              const location = Array.isArray(item.locations)
                ? item.locations[0]
                : item.locations;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4"
                >
                  <div className="text-lg font-semibold text-gray-900">
                    {product?.sku ? `${product.sku} - ${product.name}` : product?.name || "-"}
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Lokácia: {location ? `${location.code} - ${location.name}` : "-"}
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Požadované množstvo: {Number(item.quantity).toFixed(2)}
                  </div>

                  <div className="mt-1 text-sm text-gray-600">
                    Vychystané: {Number(item.picked_qty).toFixed(2)}
                  </div>

                  <div className="mt-3">
                    {item.status !== "picked" ? (
                      <form action={`/picker/${id}/pick-item`} method="post">
                        <input type="hidden" name="item_id" value={item.id} />
                        <input type="hidden" name="quantity" value={item.quantity} />
                        <button className="rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-500">
                          Označiť ako vychystané
                        </button>
                      </form>
                    ) : (
                      <div className="rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">
                        Položka je vychystaná
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-gray-500">Objednávka nemá položky.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}