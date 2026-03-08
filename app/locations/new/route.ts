import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const warehouse_id = String(formData.get("warehouse_id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();

  if (!warehouse_id || !name || !code) {
    return NextResponse.redirect(new URL("/locations", request.url));
  }

  const supabase = await createClient();

  await supabase.from("locations").insert({
    warehouse_id,
    name,
    code,
  });

  return NextResponse.redirect(new URL("/locations", request.url));
}