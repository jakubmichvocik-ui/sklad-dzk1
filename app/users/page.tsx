import PageHeader from "../../components/page-header";
import SectionCard from "../../components/section-card";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

type UsersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    updated?: string;
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  await requirePermission("users");

  const params = await searchParams;
  const errorMessage = params.error || "";
  const success = params.success === "1";
  const updated = params.updated === "1";

  const supabase = await createClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader title="Používatelia" description="Správa používateľov a rolí" />

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Používateľ bol vytvorený.
        </div>
      ) : null}

      {updated ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Používateľ bol upravený.
        </div>
      ) : null}

      <SectionCard title="Nový používateľ">
        <form action="/users/new" method="post" className="grid gap-4 md:grid-cols-2">
          <input
            name="full_name"
            placeholder="Meno"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

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
            <div className="mb-3 text-sm font-medium text-gray-700">Prístup k sekciám</div>

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

          <button className="rounded-xl bg-slate-900 px-4 py-2.5 text-white md:col-span-2">
            Vytvoriť používateľa
          </button>
        </form>
      </SectionCard>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 text-sm">Meno</th>
              <th className="px-4 py-3 text-sm">Rola</th>
              <th className="px-4 py-3 text-sm">Aktívny</th>
              <th className="px-4 py-3 text-sm">Vytvorené</th>
              <th className="px-4 py-3 text-sm">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-red-600">
                  Chyba pri načítaní používateľov
                </td>
              </tr>
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-3">{user.full_name || "-"}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.is_active ? "Áno" : "Nie"}</td>
                  <td className="px-4 py-3">
                    {new Date(user.created_at).toLocaleString("sk-SK")}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/users/${user.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                    >
                      Upraviť
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-gray-500">
                  Zatiaľ nemáš žiadnych používateľov.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}