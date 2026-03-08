import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type OrderItemInput = {
  product_id: string;
  quantity: string | number;
};

export async function POST(request: Request) {
  const formData = await request.formData();

  const order_number = String(formData.get("order_number") || "").trim();
  const customer_name = String(formData.get("customer_name") || "").trim();
  const warehouse_id = String(formData.get("warehouse_id") || "").trim();
  const note = String(formData.get("note") || "").trim();
  const items_json = String(formData.get("items_json") || "[]");

  let parsedItems: OrderItemInput[] = [];

  try {
    parsedItems = JSON.parse(items_json);
  } catch {
    return NextResponse.redirect(
      new URL("/orders?error=Neplatné položky objednávky.", request.url)
    );
  }

  const items = parsedItems
    .map((item) => ({
      product_id: String(item.product_id || "").trim(),
      quantity: Number(item.quantity || 0),
    }))
    .filter((item) => item.product_id && item.quantity > 0);

  if (!order_number || !warehouse_id || items.length === 0) {
    return NextResponse.redirect(
      new URL("/orders?error=Neplatné údaje objednávky.", request.url)
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("create_customer_order_multi_item", {
    p_order_number: order_number,
    p_customer_name: customer_name || null,
    p_warehouse_id: warehouse_id,
    p_items: items,
    p_note: note || null,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/orders?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/orders?success=1", request.url));
}