import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteProps) {
  const { id } = await params;
  const formData = await request.formData();

  const item_id = String(formData.get("item_id") || "").trim();
  const counted_qty_raw = String(formData.get("counted_qty") || "0").trim();
  const counted_qty = Number(counted_qty_raw);

  if (!item_id || Number.isNaN(counted_qty)) {
    return NextResponse.redirect(new URL(`/inventory/${id}`, request.url));
  }

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("inventory_items")
    .select("system_qty")
    .eq("id", item_id)
    .single();

  const systemQty = Number(item?.system_qty ?? 0);
  const differenceQty = counted_qty - systemQty;

  await supabase
    .from("inventory_items")
    .update({
      counted_qty,
      difference_qty: differenceQty,
    })
    .eq("id", item_id);

  return NextResponse.redirect(new URL(`/inventory/${id}`, request.url));
}