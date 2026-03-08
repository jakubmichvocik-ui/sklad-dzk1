import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const product_id = String(formData.get("product_id") || "").trim();
  const from_warehouse_id = String(formData.get("from_warehouse_id") || "").trim();
  const from_location_id = String(formData.get("from_location_id") || "").trim();
  const to_warehouse_id = String(formData.get("to_warehouse_id") || "").trim();
  const to_location_id = String(formData.get("to_location_id") || "").trim();
  const quantity_raw = String(formData.get("quantity") || "0").trim();
  const note = String(formData.get("note") || "").trim();

  const quantity = Number(quantity_raw);

  if (
    !product_id ||
    !from_warehouse_id ||
    !from_location_id ||
    !to_warehouse_id ||
    !to_location_id ||
    Number.isNaN(quantity) ||
    quantity <= 0
  ) {
    return NextResponse.redirect(
      new URL("/transfers?error=Neplatný produkt, sklad, lokácia alebo množstvo.", request.url)
    );
  }

  const supabase = await createClient();

  const { data: fromLocation, error: fromLocationError } = await supabase
    .from("locations")
    .select("id, warehouse_id")
    .eq("id", from_location_id)
    .single();

  if (fromLocationError || !fromLocation) {
    return NextResponse.redirect(
      new URL("/transfers?error=Zdrojová lokácia neexistuje.", request.url)
    );
  }

  if (fromLocation.warehouse_id !== from_warehouse_id) {
    return NextResponse.redirect(
      new URL("/transfers?error=Zdrojová lokácia nepatrí do zdrojového skladu.", request.url)
    );
  }

  const { data: toLocation, error: toLocationError } = await supabase
    .from("locations")
    .select("id, warehouse_id")
    .eq("id", to_location_id)
    .single();

  if (toLocationError || !toLocation) {
    return NextResponse.redirect(
      new URL("/transfers?error=Cieľová lokácia neexistuje.", request.url)
    );
  }

  if (toLocation.warehouse_id !== to_warehouse_id) {
    return NextResponse.redirect(
      new URL("/transfers?error=Cieľová lokácia nepatrí do cieľového skladu.", request.url)
    );
  }

  const { error } = await supabase.rpc("transfer_stock", {
    p_product_id: product_id,
    p_from_warehouse_id: from_warehouse_id,
    p_from_location_id: from_location_id,
    p_to_warehouse_id: to_warehouse_id,
    p_to_location_id: to_location_id,
    p_quantity: quantity,
    p_note: note || null,
  });

  if (error) {
    console.error("Transfer stock error:", error.message);
    return NextResponse.redirect(
      new URL(`/transfers?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/transfers?success=1", request.url));
}