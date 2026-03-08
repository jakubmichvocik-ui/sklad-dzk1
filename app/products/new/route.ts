import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const sku = String(formData.get("sku") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "ks").trim();
  const description = String(formData.get("description") || "").trim();
  const min_stock_raw = String(formData.get("min_stock") || "0").trim();
  const purchase_price_raw = String(formData.get("purchase_price") || "0").trim();
  const sale_price_raw = String(formData.get("sale_price") || "0").trim();

  if (!name) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  const min_stock = Number(min_stock_raw || "0");
  const purchase_price = Number(purchase_price_raw || "0");
  const sale_price = Number(sale_price_raw || "0");

  const supabase = await createClient();

  await supabase.from("products").insert({
    sku: sku || null,
    name,
    unit: unit || "ks",
    description: description || null,
    min_stock: Number.isNaN(min_stock) ? 0 : min_stock,
    purchase_price: Number.isNaN(purchase_price) ? 0 : purchase_price,
    sale_price: Number.isNaN(sale_price) ? 0 : sale_price,
  });

  return NextResponse.redirect(new URL("/products", request.url));
}