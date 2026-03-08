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
      new URL("/movements?error=Neplatný produkt, sklad, lokácia alebo množstvo.", request.url)
    );
  }

  const supabase = await createClient();

  const { data: location, error: locationError } = await supabase
    .from("locations")
    .select("id, warehouse_id")
    .eq("id", location_id)
    .single();

  if (locationError || !location) {
    return NextResponse.redirect(
      new URL("/movements?error=Vybraná lokácia neexistuje.", request.url)
    );
  }

  if (location.warehouse_id !== warehouse_id) {
    return NextResponse.redirect(
      new URL("/movements?error=Vybraná lokácia nepatrí do zvoleného skladu.", request.url)
    );
  }

  const { error } = await supabase.rpc("receive_stock", {
    p_product_id: product_id,
    p_warehouse_id: warehouse_id,
    p_location_id: location_id,
    p_quantity: quantity,
    p_note: note || null,
  });

  if (error) {
    console.error("Receive stock error:", error.message);
    return NextResponse.redirect(
      new URL(`/movements?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/movements?success=1", request.url));
}