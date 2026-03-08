import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requirePermission(permission: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, permissions, role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    return { user, profile };
  }

  const permissions = (profile.permissions ?? {}) as Record<string, boolean>;

  if (!permissions[permission]) {
    redirect("/dashboard");
  }

  return { user, profile };
}