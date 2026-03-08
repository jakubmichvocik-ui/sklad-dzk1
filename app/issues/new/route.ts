import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const product_id = String(formData.get("product_id") || "").trim();
  const warehouse_id = String(formData.get("warehouse_id") || "").trim();
  const location_id = String(formData.get("location_id") || "").trim();
  const quantity_raw = String(formData.get("quantity") || "0").trim();
  const note = String(formData.get("note") || "").trim();

  const quantity = Number(quantity_raw);

  if (!product_id || !warehouse_id || !location_id || Number.isNaN(quantity) || quantity <= 0) {
    return NextResponse.redirect(
      new URL("/issues?error=Neplatný produkt, sklad, lokácia alebo množstvo.", request.url)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("issue_stock", {
    p_product_id: product_id,
    p_warehouse_id: warehouse_id,
    p_location_id: location_id,
    p_quantity: quantity,
    p_note: note || null,
  });

  if (error) {
    console.error("Issue stock error:", error.message);
    return NextResponse.redirect(
      new URL(`/issues?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/issues?success=1", request.url));
}