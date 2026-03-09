import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import IssueForm from "@/components/issue-form";
import TableScroll from "@/components/table-scroll";
import { requirePermission } from "@/lib/auth/require-permission";

type IssuesPageProps = {
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

type IssueMovement = {
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

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  await requirePermission("issues");

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

  const { data: issuesRaw, error } = await supabase
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
    .eq("movement_type", "issue")
    .order("created_at", { ascending: false })
    .limit(20);

  const typedProducts = (products ?? []) as Product[];
  const typedWarehouses = (warehouses ?? []) as Warehouse[];
  const typedLocations = (locations ?? []) as Location[];
  const issues = (issuesRaw ?? []) as IssueMovement[];

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader title="Výdaj" description="Odpísanie tovaru zo skladu" />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Výdaj sa nepodarilo uložiť: {errorMessage}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Výdaj bol úspešne uložený.
        </div>
      ) : null}

      <SectionCard
        title="Nový výdaj"
        description="Vydaj tovar z vybraného skladu a lokácie"
      >
        <IssueForm
          products={typedProducts}
          warehouses={typedWarehouses}
          locations={typedLocations}
        />
      </SectionCard>

      <TableScroll>
        <table className="min-w-[900px] w-full border-collapse">
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
                  Chyba pri načítaní výdajov
                </td>
              </tr>
            ) : issues.length > 0 ? (
              issues.map((issue) => {
                const product = Array.isArray(issue.products)
                  ? issue.products[0]
                  : issue.products;

                return (
                  <tr key={issue.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {issue.movement_type}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {product?.sku ? `${product.sku} - ${product.name}` : product?.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {Number(issue.quantity).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {issue.note || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(issue.created_at).toLocaleString("sk-SK")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-sm text-gray-500">
                  Zatiaľ nemáš žiadne výdaje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}