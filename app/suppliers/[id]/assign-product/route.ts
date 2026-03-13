import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const { id } = await params;
  const formData = await request.formData();

  const product_id = String(formData.get("product_id") || "").trim();
  const supplier_sku = String(formData.get("supplier_sku") || "").trim();
  const purchase_price = Number(formData.get("purchase_price") || 0);
  const min_order_qty = Number(formData.get("min_order_qty") || 0);
  const note = String(formData.get("note") || "").trim();

  if (!product_id) {
    return NextResponse.redirect(
      new URL(
        `/suppliers/${id}?error=${encodeURIComponent("Chýba produkt.")}`,
        request.url
      )
    );
  }

  if (Number.isNaN(purchase_price) || Number.isNaN(min_order_qty)) {
    return NextResponse.redirect(
      new URL(
        `/suppliers/${id}?error=${encodeURIComponent("Neplatná číselná hodnota.")}`,
        request.url
      )
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.redirect(
      new URL(
        `/suppliers/${id}?error=${encodeURIComponent("Len admin môže priraďovať produkty.")}`,
        request.url
      )
    );
  }

  const { error } = await supabase.from("supplier_products").insert({
    supplier_id: id,
    product_id,
    supplier_sku: supplier_sku || null,
    purchase_price,
    min_order_qty,
    note: note || null,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/suppliers/${id}?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(`/suppliers/${id}?updated=1`, request.url));
}
