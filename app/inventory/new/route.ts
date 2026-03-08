import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();

  const warehouse_id = String(formData.get("warehouse_id") || "").trim();
  const location_id_raw = String(formData.get("location_id") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!warehouse_id) {
    return NextResponse.redirect(
      new URL("/inventory?error=Nie je vybraný sklad.", request.url)
    );
  }

  const supabase = await createClient();

  if (location_id_raw) {
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("id, warehouse_id")
      .eq("id", location_id_raw)
      .single();

    if (locationError || !location) {
      return NextResponse.redirect(
        new URL("/inventory?error=Vybraná lokácia neexistuje.", request.url)
      );
    }

    if (location.warehouse_id !== warehouse_id) {
      return NextResponse.redirect(
        new URL("/inventory?error=Vybraná lokácia nepatrí do zvoleného skladu.", request.url)
      );
    }
  }

  const { data, error } = await supabase.rpc("create_inventory_session_with_items", {
    p_warehouse_id: warehouse_id,
    p_location_id: location_id_raw || null,
    p_note: note || null,
  });

  if (error || !data) {
    console.error("Create inventory error:", error?.message);
    return NextResponse.redirect(
      new URL(`/inventory?error=${encodeURIComponent(error?.message || "Inventúru sa nepodarilo vytvoriť.")}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(`/inventory/${data}`, request.url));
}