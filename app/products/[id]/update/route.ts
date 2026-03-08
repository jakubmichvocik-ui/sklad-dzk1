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
    .from("products")
    .update({
      sku: String(formData.get("sku") || "").trim() || null,
      name: String(formData.get("name") || "").trim(),
      unit: String(formData.get("unit") || "ks").trim(),
      min_stock: Number(formData.get("min_stock") || 0),
      purchase_price: Number(formData.get("purchase_price") || 0),
      sale_price: Number(formData.get("sale_price") || 0),
      description: String(formData.get("description") || "").trim() || null,
    })
    .eq("id", id);

  return NextResponse.redirect(new URL("/products", request.url));
}