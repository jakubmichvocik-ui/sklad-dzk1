import PageHeader from "../../../components/page-header";
import SectionCard from "../../../components/section-card";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
};

type Permissions = {
  dashboard?: boolean;
  stock?: boolean;
  movements?: boolean;
  issues?: boolean;
  transfers?: boolean;
  inventory?: boolean;
  orders?: boolean;
  products?: boolean;
  warehouses?: boolean;
  locations?: boolean;
  users?: boolean;
};

export default async function UserEditPage({ params }: Props) {
  await requirePermission("users");

  const { id } = await params;
  const supabase = await createClient();

  const { data: user } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, permissions")
    .eq("id", id)
    .single();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Používateľ"
          description="Používateľ nebol nájdený"
        />
      </div>
    );
  }

  const permissions = (user.permissions ?? {}) as Permissions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upraviť používateľa"
        description="Zmena mena, role, stavu a práv"
      />

      <SectionCard>
        <form
          action={`/users/${id}/update`}
          method="post"
          className="grid gap-4 md:grid-cols-2"
        >
          <input
            name="full_name"
            defaultValue={user.full_name || ""}
            placeholder="Meno"
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          />

          <select
            name="role"
            defaultValue={user.role}
            className="rounded-xl border border-gray-200 px-3 py-2.5"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="picker">Picker</option>
          </select>

          <select
            name="is_active"
            defaultValue={user.is_active ? "true" : "false"}
            className="rounded-xl border border-gray-200 px-3 py-2.5 md:col-span-2"
          >
            <option value="true">Aktívny</option>
            <option value="false">Neaktívny</option>
          </select>

          <div className="rounded-2xl border border-gray-200 p-4 md:col-span-2">
            <div className="mb-3 text-sm font-medium text-gray-700">
              Prístup k sekciám
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_dashboard"
                  defaultChecked={!!permissions.dashboard}
                />
                Dashboard
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_stock"
                  defaultChecked={!!permissions.stock}
                />
                Stav skladu
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_movements"
                  defaultChecked={!!permissions.movements}
                />
                Príjem
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_issues"
                  defaultChecked={!!permissions.issues}
                />
                Výdaj
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_transfers"
                  defaultChecked={!!permissions.transfers}
                />
                Presun
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_inventory"
                  defaultChecked={!!permissions.inventory}
                />
                Inventúra
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_orders"
                  defaultChecked={!!permissions.orders}
                />
                Objednávky
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_products"
                  defaultChecked={!!permissions.products}
                />
                Produkty
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_warehouses"
                  defaultChecked={!!permissions.warehouses}
                />
                Sklady
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_locations"
                  defaultChecked={!!permissions.locations}
                />
                Lokácie
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="perm_users"
                  defaultChecked={!!permissions.users}
                />
                Používatelia
              </label>
            </div>
          </div>

          <button className="rounded-xl bg-green-600 px-4 py-2.5 text-white hover:bg-green-500 md:col-span-2">
            Uložiť zmeny
          </button>
        </form>
      </SectionCard>
    </div>
  );
}