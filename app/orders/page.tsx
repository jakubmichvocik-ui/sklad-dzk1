import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import OrderCreateForm from "../../components/order-create-form";
import { requirePermission } from "@/lib/auth/require-permission";

type OrdersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
};

type Warehouse = {
  id: string;
  name: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  status: string;
  note: string | null;
  created_at: string;
  warehouses: { name: string } | { name: string }[] | null;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await requirePermission("orders");

  const params = await searchParams;
  const errorMessage = params.error || "";
  const success = params.success === "1";

  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: warehouses } = await supabase
    .from("warehouses")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: ordersRaw, error } = await supabase
    .from("customer_orders")
    .select(`
      id,
      order_number,
      customer_name,
      status,
      note,
      created_at,
      warehouses (
        name
      )
    `)
    .order("created_at", { ascending: false });

  const typedProducts = (products ?? []) as Product[];
  const typedWarehouses = (warehouses ?? []) as Warehouse[];
  const orders = (ordersRaw ?? []) as OrderRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Objednávky"
        description="Ručné zadanie objednávok z e-shopu"
      />

      <div className="flex justify-end">
        <a
          href="/orders/export"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500"
        >
          Export do Excelu
        </a>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Objednávku sa nepodarilo uložiť: {errorMessage}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Objednávka bola uložená.
        </div>
      ) : null}

      <SectionCard
        title="Nová objednávka"
        description="Objednávka s viacerými položkami"
      >
        <OrderCreateForm
          products={typedProducts}
          warehouses={typedWarehouses}
        />
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Číslo</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Zákazník</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Sklad</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Stav</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Dátum</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Picker</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-sm text-red-600">
                  Chyba pri načítaní objednávok
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((order) => {
                const warehouse = Array.isArray(order.warehouses)
                  ? order.warehouses[0]
                  : order.warehouses;

                return (
                  <tr key={order.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {order.order_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.customer_name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {warehouse?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.status}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString("sk-SK")}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/picker/${order.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
                      >
                        Otvoriť
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-sm text-gray-500">
                  Zatiaľ nemáš žiadne objednávky.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}