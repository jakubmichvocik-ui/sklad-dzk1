import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireRole(allowedRoles: string[]) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || !allowedRoles.includes(profile.role)) {
    redirect("/dashboard");
  }

  return { user, profile };
}