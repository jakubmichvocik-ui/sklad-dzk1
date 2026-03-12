import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import TableScroll from "@/components/table-scroll";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

type ProfileRow = {
  role: string | null;
};

type SupplierRow = {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  address: string | null;
  note: string | null;
  is_active: boolean;
  created_at: string;
};

type SupplierProductRow = {
  id: string;
  supplier_sku: string | null;
  purchase_price: number | null;
  min_order_qty: number | null;
  note: string | null;
  products:
    | {
        id: string;
        name: string;
        sku: string | null;
        barcode: string | null;
        is_active: boolean | null;
      }
    | {
        id: string;
        name: string;
        sku: string | null;
        barcode: string | null;
        is_active: boolean | null;
      }[]
    | null;
};

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
};

export default async function SupplierDetailPage({ params, searchParams }: Props) {
  await requirePermission("suppliers");

  const { id } = await params;
  const query = await searchParams;

  const errorMessage = query.error || "";
  const updated = query.updated === "1";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const profile = profileRaw as ProfileRow | null;
    isAdmin = profile?.role === "admin";
  }

  const { data: supplierRaw } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const supplier = supplierRaw as SupplierRow | null;

  if (!supplier) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dodávateľ" description="Dodávateľ nebol nájdený" />
      </div>
    );
  }

  const { data: supplierProductsRaw, error } = await supabase
    .from("supplier_products")
    .select(`
      id,
      supplier_sku,
      purchase_price,
      min_order_qty,
      note,
      products (
        id,
        name,
        sku,
        barcode,
        is_active
      )
    `)
    .eq("supplier_id", id)
    .order("created_at", { ascending: false });

  const supplierProducts = (supplierProductsRaw ?? []) as SupplierProductRow[];

  const { data: productOptionsRaw } = await supabase
    .from("products")
    .select("id, name, sku, barcode")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const productOptions = (productOptionsRaw ?? []) as ProductOption[];

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title={supplier.name}
        description="Detail dodávateľa a priradených produktov"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Zmena bola úspešne uložená.
        </div>
      ) : null}

      <SectionCard
        title="Informácie o dodávateľovi"
        description={isAdmin ? "Admin môže dodávateľa upravovať" : "Len na čítanie"}
      >
        {isAdmin ? (
          <form action={`/suppliers/${id}/update`} method="post" className="grid gap-4 md:grid-cols-2">
            <input
              name="name"
              defaultValue={supplier.name}
              placeholder="Názov dodávateľa"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
              required
            />

            <input
              name="code"
              defaultValue={supplier.code || ""}
              placeholder="Kód dodávateľa"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="email"
              defaultValue={supplier.email || ""}
              placeholder="Email"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="phone"
              defaultValue={supplier.phone || ""}
              placeholder="Telefón"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="contact_person"
              defaultValue={supplier.contact_person || ""}
              placeholder="Kontaktná osoba"
              className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <input
              name="address"
              defaultValue={supplier.address || ""}
              placeholder="Adresa"
              className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <textarea
              name="note"
              defaultValue={supplier.note || ""}
              placeholder="Poznámka"
              className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <div className="flex gap-2 md:col-span-2">
              <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white">
                Uložiť zmeny
              </button>

              {supplier.is_active ? (
                <form action={`/suppliers/${supplier.id}/deactivate`} method="post">
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-600 px-4 py-2.5 text-white"
                  >
                    Deaktivovať
                  </button>
                </form>
              ) : (
                <form action={`/suppliers/${supplier.id}/activate`} method="post">
                  <button
                    type="submit"
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-white"
                  >
                    Aktivovať
                  </button>
                </form>
              )}
            </div>
          </form>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Názov</div>
              <div className="mt-1 font-medium text-gray-900">{supplier.name}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Kód</div>
              <div className="mt-1 font-medium text-gray-900">{supplier.code || "-"}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Email</div>
              <div className="mt-1 font-medium text-gray-900">{supplier.email || "-"}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Telefón</div>
              <div className="mt-1 font-medium text-gray-900">{supplier.phone || "-"}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Kontaktná osoba</div>
              <div className="mt-1 font-medium text-gray-900">
                {supplier.contact_person || "-"}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-sm text-gray-500">Aktívny</div>
              <div className="mt-1 font-medium text-gray-900">
                {supplier.is_active ? "Áno" : "Nie"}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
              <div className="text-sm text-gray-500">Adresa</div>
              <div className="mt-1 font-medium text-gray-900">{supplier.address || "-"}</div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
              <div className="text-sm text-gray-500">Poznámka</div>
              <div className="mt-1 font-medium text-gray-900">{supplier.note || "-"}</div>
            </div>
          </div>
        )}
      </SectionCard>

      {isAdmin ? (
        <SectionCard
          title="Priradiť produkt"
          description="Admin môže pridať produkt k dodávateľovi"
        >
          <form
            action={`/suppliers/${id}/assign-product`}
            method="post"
            className="grid gap-4 md:grid-cols-2"
          >
            <select
              name="product_id"
              defaultValue=""
              className="rounded-xl border border-gray-200 px-3 py-2.5"
              required
            >
              <option value="" disabled>
                Vyber produkt
              </option>
              {productOptions.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku ? `${product.sku} - ${product.name}` : product.name}
                </option>
              ))}
            </select>

            <input
              name="supplier_sku"
              placeholder="SKU u dodávateľa"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="purchase_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              placeholder="Nákupná cena"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="min_order_qty"
              type="number"
              step="0.01"
              min="0"
              defaultValue="0"
              placeholder="Minimálne odberové množstvo"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <textarea
              name="note"
              placeholder="Poznámka"
              className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white md:col-span-2">
              Priradiť produkt
            </button>
          </form>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Priradené produkty"
        description="Produkty, ktoré dodávateľ dodáva"
      >
        <TableScroll>
          <table className="min-w-[1300px] w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Produkt</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">SKU</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Čiarový kód</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">SKU dodávateľa</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Nákupná cena</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Min. odber</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Poznámka</th>
                {isAdmin ? (
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">Akcia</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className="px-4 py-4 text-sm text-red-600"
                  >
                    Chyba pri načítaní priradených produktov
                  </td>
                </tr>
              ) : supplierProducts.length > 0 ? (
                supplierProducts.map((row) => {
                  const product = Array.isArray(row.products) ? row.products[0] : row.products;

                  return (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {product?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product?.sku || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product?.barcode || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.supplier_sku || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(row.purchase_price ?? 0).toFixed(2)} €
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(row.min_order_qty ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.note || "-"}
                      </td>
                      {isAdmin ? (
                        <td className="px-4 py-3 text-sm">
                          <form action={`/suppliers/${id}/remove-product`} method="post">
                            <input type="hidden" name="supplier_product_id" value={row.id} />
                            <button className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-500">
                              Odobrať
                            </button>
                          </form>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={isAdmin ? 8 : 7}
                    className="px-4 py-4 text-sm text-gray-500"
                  >
                    Dodávateľ zatiaľ nemá priradené produkty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableScroll>
      </SectionCard>
    </div>
  );
}