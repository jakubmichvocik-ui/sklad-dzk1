import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import SectionCard from "@/components/section-card";
import TableScroll from "@/components/table-scroll";
import { requirePermission } from "@/lib/auth/require-permission";

type UsersPageProps = {
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean;
  permissions: Record<string, boolean> | null;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requirePermission("users");

  const params = await searchParams;
  const errorMessage = params.error || "";
  const updated = params.updated === "1";

  const supabase = await createClient();

  const { data: usersRaw, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, permissions")
    .order("created_at", { ascending: false });

  const users = (usersRaw ?? []) as ProfileRow[];

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      <PageHeader
        title="Používatelia"
        description="Správa používateľov, rolí a práv"
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
        title="Vytvoriť používateľa"
        description="Nový používateľ a jeho prístupové práva"
      >
        <form action="/users/new" method="post" className="grid gap-4 md:grid-cols-2">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Heslo"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
            required
          />

          <input
            name="full_name"
            placeholder="Meno"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <select
            name="role"
            defaultValue="picker"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="picker">Picker</option>
          </select>

          <div className="rounded-2xl border border-gray-200 p-4 md:col-span-2">
            <div className="mb-3 text-sm font-medium text-gray-700">
              Prístup k sekciám
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_dashboard" defaultChecked />
                Dashboard
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_stock" defaultChecked />
                Stav skladu
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_movements" />
                Príjem
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_issues" />
                Výdaj
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_transfers" />
                Presun
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_inventory" />
                Inventúra
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_orders" />
                Objednávky
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_products" />
                Produkty
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_suppliers" />
                Dodávatelia
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_warehouses" />
                Sklady
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_locations" />
                Lokácie
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" name="perm_users" />
                Používatelia
              </label>
            </div>
          </div>

          <button className="rounded-xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-500 md:col-span-2">
            Vytvoriť používateľa
          </button>
        </form>
      </SectionCard>

      <TableScroll>
        <table className="min-w-[900px] w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Meno</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Rola</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Aktívny</th>
              <th className="px-4 py-3 text-sm font-medium text-gray-500">Akcia</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-sm text-red-600">
                  Chyba pri načítaní používateľov
                </td>
              </tr>
            ) : users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {user.full_name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.role || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.is_active ? "Áno" : "Nie"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <a
                      href={`/users/${user.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-500"
                    >
                      Upraviť
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-sm text-gray-500">
                  Žiadni používatelia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}