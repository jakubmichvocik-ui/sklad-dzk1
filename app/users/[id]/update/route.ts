import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const formData = await request.formData();

  const full_name = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "picker").trim();
  const is_active = String(formData.get("is_active")) === "true";

  const permissions = {
    dashboard: formData.get("perm_dashboard") === "on",
    stock: formData.get("perm_stock") === "on",
    movements: formData.get("perm_movements") === "on",
    issues: formData.get("perm_issues") === "on",
    transfers: formData.get("perm_transfers") === "on",
    inventory: formData.get("perm_inventory") === "on",
    orders: formData.get("perm_orders") === "on",
    products: formData.get("perm_products") === "on",
    warehouses: formData.get("perm_warehouses") === "on",
    locations: formData.get("perm_locations") === "on",
    users: formData.get("perm_users") === "on",
  };

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: full_name || null,
      role,
      is_active,
      permissions,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/users?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/users?updated=1", request.url));
}