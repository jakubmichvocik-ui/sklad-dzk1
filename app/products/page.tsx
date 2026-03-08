import { createClient } from "@/lib/supabase/server";
import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import { requirePermission } from "@/lib/auth/require-permission";

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    updated?: string;
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await requirePermission("products");

  const supabase = await createClient();
  const params = await searchParams;

  const q = (params.q || "").trim();
  const errorMessage = params.error || "";
  const updated = params.updated === "1";

  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data: products, error } = await query;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produkty"
        description="Katalóg produktov, cien a minimálnych zásob"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Operáciu sa nepodarilo vykonať: {errorMessage}
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Produkt bol úspešne upravený.
        </div>
      ) : null}

      <SectionCard
        title="Filtrovanie"
        description="Vyhľadávanie podľa názvu produktu alebo SKU"
      >
        <form method="get" className="grid gap-4 md:grid-cols-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Hľadaj názov alebo SKU"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none"
          />

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white">
            Filtrovať
          </button>

          <a
            href="/products"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-center"
          >
            Reset
          </a>
        </form>
      </SectionCard>

      <SectionCard title="Pridať produkt">
        <form action="/products/new" method="post" className="grid gap-4 md:grid-cols-2">
          <input name="sku" placeholder="SKU" className="rounded-xl border px-3 py-2.5" />

          <input
            name="name"
            placeholder="Názov produktu"
            className="rounded-xl border px-3 py-2.5"
            required
          />

          <input
            name="unit"
            defaultValue="ks"
            placeholder="Jednotka"
            className="rounded-xl border px-3 py-2.5"
            required
          />

          <input
            name="min_stock"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            className="rounded-xl border px-3 py-2.5"
          />

          <input
            name="purchase_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="rounded-xl border px-3 py-2.5"
          />

          <input
            name="sale_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            className="rounded-xl border px-3 py-2.5"
          />

          <textarea
            name="description"
            placeholder="Popis"
            className="rounded-xl border px-3 py-2.5 md:col-span-2"
          />

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white md:col-span-2">
            Uložiť produkt
          </button>
        </form>
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm">SKU</th>
              <th className="px-4 py-3 text-sm">Názov</th>
              <th className="px-4 py-3 text-sm">Jednotka</th>
              <th className="px-4 py-3 text-sm">Min. zásoba</th>
              <th className="px-4 py-3 text-sm">Nákupná cena</th>
              <th className="px-4 py-3 text-sm">Predajná cena</th>
              <th className="px-4 py-3 text-sm">Aktívny</th>
              <th className="px-4 py-3 text-sm">Akcie</th>
            </tr>
          </thead>

          <tbody>
            {error ? (
              <tr>
                <td colSpan={8} className="px-4 py-4 text-red-600">
                  Chyba pri načítaní produktov
                </td>
              </tr>
            ) : products?.length ? (
              products.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="px-4 py-3">{product.sku || "-"}</td>
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">{product.unit}</td>
                  <td className="px-4 py-3">{product.min_stock}</td>
                  <td className="px-4 py-3">
                    {Number(product.purchase_price ?? 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">
                    {Number(product.sale_price ?? 0).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3">{product.is_active ? "Áno" : "Nie"}</td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/products/${product.id}`}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                      >
                        Upraviť
                      </a>

                      {product.is_active ? (
                        <form action={`/products/${product.id}/deactivate`} method="post">
                          <button
                            type="submit"
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm text-white"
                          >
                            Deaktivovať
                          </button>
                        </form>
                      ) : (
                        <form action={`/products/${product.id}/activate`} method="post">
                          <button
                            type="submit"
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white"
                          >
                            Aktivovať
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-4">
                  Žiadne produkty
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}