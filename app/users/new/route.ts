import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const full_name = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "picker").trim();

  if (!email || !password || !role) {
    return NextResponse.redirect(
      new URL("/users?error=Chýba email, heslo alebo rola.", request.url)
    );
  }

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

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(
        `/users?error=${encodeURIComponent(
          error?.message || "Nepodarilo sa vytvoriť používateľa."
        )}`,
        request.url
      )
    );
  }

  const supabase = await createClient();

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    full_name: full_name || null,
    role,
    is_active: true,
    permissions,
  });

  if (profileError) {
    return NextResponse.redirect(
      new URL(`/users?error=${encodeURIComponent(profileError.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/users?success=1", request.url));
}