import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const full_name = String(formData.get("full_name") || "").trim();
  const role = String(formData.get("role") || "picker").trim();

  if (!email || !password) {
    return NextResponse.redirect(
      new URL(
        `/users?error=${encodeURIComponent("Chýba email alebo heslo.")}`,
        request.url
      )
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
    suppliers: formData.get("perm_suppliers") === "on",
    warehouses: formData.get("perm_warehouses") === "on",
    locations: formData.get("perm_locations") === "on",
    users: formData.get("perm_users") === "on",
  };

  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.redirect(new URL(`/login`, request.url));
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (currentProfile?.role !== "admin") {
    return NextResponse.redirect(
      new URL(
        `/users?error=${encodeURIComponent("Len admin môže vytvárať používateľov.")}`,
        request.url
      )
    );
  }

  const { data: createdUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name || null,
    },
  });

  if (authError || !createdUser.user) {
    return NextResponse.redirect(
      new URL(
        `/users?error=${encodeURIComponent(authError?.message || "Používateľa sa nepodarilo vytvoriť.")}`,
        request.url
      )
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: createdUser.user.id,
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

  return NextResponse.redirect(new URL(`/users?updated=1`, request.url));
}