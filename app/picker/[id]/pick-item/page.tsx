import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Props = {
  params: Promise<{ id: string }>;
};

type OrderItemStatusRow = {
  status: string;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const formData = await request.formData();

  const item_id = String(formData.get("item_id") || "").trim();
  const quantity = Number(formData.get("quantity") || 0);

  if (!item_id || Number.isNaN(quantity) || quantity < 0) {
    return NextResponse.redirect(
      new URL(`/picker/${id}`, request.url)
    );
  }

  const supabase = await createClient();

  const { error: updateItemError } = await supabase
    .from("customer_order_items")
    .update({
      picked_qty: quantity,
      status: "picked",
    })
    .eq("id", item_id);

  if (updateItemError) {
    return NextResponse.redirect(
      new URL(`/picker/${id}`, request.url)
    );
  }

  const { data: itemsRaw, error: itemsError } = await supabase
    .from("customer_order_items")
    .select("status")
    .eq("order_id", id);

  if (itemsError) {
    return NextResponse.redirect(
      new URL(`/picker/${id}`, request.url)
    );
  }

  const items = (itemsRaw ?? []) as OrderItemStatusRow[];
  const allPicked = items.length > 0 && items.every((item) => item.status === "picked");

  if (allPicked) {
    await supabase
      .from("customer_orders")
      .update({
        status: "picked",
        picked_at: new Date().toISOString(),
      })
      .eq("id", id);
  } else {
    await supabase
      .from("customer_orders")
      .update({
        status: "picking",
      })
      .eq("id", id);
  }

  return NextResponse.redirect(new URL(`/picker/${id}`, request.url));
}