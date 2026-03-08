import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();

  if (!name) {
    return NextResponse.redirect(new URL("/warehouses", request.url));
  }

  const supabase = await createClient();

  await supabase.from("warehouses").insert({
    name,
    code: code || null,
  });

  return NextResponse.redirect(new URL("/warehouses", request.url));
}