import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const formData = await request.formData();
  const supabase = await createClient();

  await supabase
    .from("warehouses")
    .update({
      name: String(formData.get("name") || "").trim(),
      code: String(formData.get("code") || "").trim() || null,
      is_active: String(formData.get("is_active")) === "true",
    })
    .eq("id", id);

  return NextResponse.redirect(new URL("/warehouses", request.url));
}