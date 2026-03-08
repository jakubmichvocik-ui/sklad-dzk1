import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const productId = String(searchParams.get("product_id") || "").trim();
  const warehouseId = String(searchParams.get("warehouse_id") || "").trim();
  const locationId = String(searchParams.get("location_id") || "").trim();

  if (!productId || !warehouseId || !locationId) {
    return NextResponse.json({ quantity: 0 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("stock_balances")
    .select("quantity")
    .eq("product_id", productId)
    .eq("warehouse_id", warehouseId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ quantity: 0 });
  }

  return NextResponse.json({
    quantity: Number(data?.quantity ?? 0),
  });
}