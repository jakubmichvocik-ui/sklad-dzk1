import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const formData = await request.formData();

  const sku = String(formData.get("sku") || "").trim();
  const barcode = String(formData.get("barcode") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const min_stock = Number(formData.get("min_stock") || 0);
  const purchase_price = Number(formData.get("purchase_price") || 0);
  const sale_price = Number(formData.get("sale_price") || 0);
  const description = String(formData.get("description") || "").trim();

  if (!name || !unit) {
    return NextResponse.redirect(
      new URL(
        `/products/${id}?error=${encodeURIComponent("Chýba názov produktu alebo jednotka.")}`,
        request.url
      )
    );
  }

  if (
    Number.isNaN(min_stock) ||
    Number.isNaN(purchase_price) ||
    Number.isNaN(sale_price)
  ) {
    return NextResponse.redirect(
      new URL(
        `/products/${id}?error=${encodeURIComponent("Číselné polia majú neplatnú hodnotu.")}`,
        request.url
      )
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      sku: sku || null,
      barcode: barcode || null,
      name,
      unit,
      min_stock,
      purchase_price,
      sale_price,
      description: description || null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(`/products/${id}?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/products?updated=1", request.url));
}