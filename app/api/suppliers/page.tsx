import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import TableScroll from "@/components/table-scroll";
import { requirePermission } from "@/lib/auth/require-permission";

type SuppliersPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    updated?: string;
  }>;
};

type SupplierRow = {
  id: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  contact_person: string | null;
  is_active: boolean;
  created_at: string;
};

type ProfileRow = {
  role: string | null;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  await requirePermission("suppliers");

  const supabase = await createClient();
  const params = await searchParams;

  const q = (params.q || "").trim();
  const errorMessage = params.error || "";
  const updated = params.updated === "1";

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

  let query = supabase
    .from("suppliers")
    .select("id, name, code, email, phone, contact_person, is_active, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,code.ilike.%${q}%,email.ilike.%${q}%,contact_person.ilike.%${q}%`
    );
  }

  const { data: suppliersRaw, error } = await query;
  const suppliers = (suppliersRaw ?? []) as SupplierRow[];

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title="Dodávatelia"
        description="Prehľad dodávateľov a ich priradených položiek"
      />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Operáciu sa nepodarilo vykonať: {errorMessage}
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Zmena bola úspešne uložená.
        </div>
      ) : null}

      <SectionCard
        title="Filtrovanie"
        description="Vyhľadávanie podľa názvu, kódu, emailu alebo kontaktnej osoby"
      >
        <form method="get" className="grid gap-4 md:grid-cols-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Hľadaj dodávateľa"
            className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none"
          />

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white">
            Filtrovať
          </button>

          <a
            href="/suppliers"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-center"
          >
            Reset
          </a>
        </form>
      </SectionCard>

      {isAdmin ? (
        <SectionCard
          title="Pridať dodávateľa"
          description="Túto sekciu vidí iba admin"
        >
          <form action="/suppliers/new" method="post" className="grid gap-4 md:grid-cols-2">
            <input
              name="name"
              placeholder="Názov dodávateľa"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
              required
            />

            <input
              name="code"
              placeholder="Kód dodávateľa"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="email"
              placeholder="Email"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="phone"
              placeholder="Telefón"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <input
              name="contact_person"
              placeholder="Kontaktná osoba"
              className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <input
              name="address"
              placeholder="Adresa"
              className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <textarea
              name="note"
              placeholder="Poznámka"
              className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
            />

            <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white md:col-span-2">
              Uložiť dodávateľa
            </button>
          </form>
        </SectionCard>
      ) : null}

      <TableScroll>
        <table className="min-w-[1100px] w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Názov</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Kód</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Kontakt</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Telefón</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Aktívny</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Detail</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-sm text-red-600">
                  Chyba pri načítaní dodávateľov
                </td>
              </tr>
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {supplier.code || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {supplier.contact_person || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {supplier.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {supplier.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {supplier.is_active ? "Áno" : "Nie"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <a
                      href={`/suppliers/${supplier.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500"
                    >
                      Otvoriť
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-sm text-gray-500">
                  Žiadni dodávatelia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}