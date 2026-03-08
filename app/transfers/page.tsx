import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import TransferForm from "../../components/transfer-form";
import { requirePermission } from "@/lib/auth/require-permission";

type TransfersPageProps = {
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

type Location = {
  id: string;
  name: string;
  code: string;
  warehouse_id: string;
};

type TransferMovement = {
  id: string;
  movement_type: string;
  quantity: number;
  note: string | null;
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

export default async function TransfersPage({ searchParams }: TransfersPageProps) {
  await requirePermission("transfers");

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

  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, code, warehouse_id")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: transfersRaw, error } = await supabase
    .from("stock_movements")
    .select(`
      id,
      movement_type,
      quantity,
      note,
      created_at,
      products (
        name,
        sku
      )
    `)
    .eq("movement_type", "transfer")
    .order("created_at", { ascending: false })
    .limit(20);

  const typedProducts = (products ?? []) as Product[];
  const typedWarehouses = (warehouses ?? []) as Warehouse[];
  const typedLocations = (locations ?? []) as Location[];
  const transfers = (transfersRaw ?? []) as TransferMovement[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presun"
        description="Presun tovaru medzi lokáciami a skladmi"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Presun sa nepodarilo uložiť: {errorMessage}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Presun bol úspešne uložený.
        </div>
      ) : null}

      <SectionCard
        title="Nový presun"
        description="Premiestni zásoby zo zdroja na cieľ"
      >
        <TransferForm
          products={typedProducts}
          warehouses={typedWarehouses}
          locations={typedLocations}
        />
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Typ</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Množstvo</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Poznámka</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Dátum</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-sm text-red-600">
                  Chyba pri načítaní presunov
                </td>
              </tr>
            ) : transfers.length > 0 ? (
              transfers.map((transfer) => {
                const product = Array.isArray(transfer.products)
                  ? transfer.products[0]
                  : transfer.products;

                return (
                  <tr key={transfer.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.movement_type}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {product?.sku ? `${product.sku} - ${product.name}` : product?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {Number(transfer.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transfer.note || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(transfer.created_at).toLocaleString("sk-SK")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-sm text-gray-500">
                  Zatiaľ nemáš žiadne presuny.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}