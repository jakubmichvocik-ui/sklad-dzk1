import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  await requirePermission("products");

  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("id, name, sku, unit, min_stock, purchase_price, sale_price")
    .eq("id", id)
    .single();

  if (!product) {
    return new Response("Produkt neexistuje", { status: 404 });
  }

  const { data: balancesRaw } = await supabase
    .from("stock_balances")
    .select(`
      quantity,
      updated_at,
      warehouses ( name ),
      locations ( name, code )
    `)
    .eq("product_id", id)
    .order("updated_at", { ascending: false });

  const { data: movementsRaw } = await supabase
    .from("stock_movements")
    .select(`
      movement_type,
      quantity,
      note,
      created_at
    `)
    .eq("product_id", id)
    .order("created_at", { ascending: false });

  const balances = (balancesRaw ?? []).map((row: any) => {
    const warehouse = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;

    return {
      Produkt: product.name,
      SKU: product.sku || "",
      Sklad: warehouse?.name || "",
      Lokacia: location ? `${location.code} - ${location.name}` : "",
      Mnozstvo: Number(row.quantity ?? 0),
      Aktualizovane: row.updated_at,
    };
  });

  const movements = (movementsRaw ?? []).map((row: any) => ({
    Produkt: product.name,
    SKU: product.sku || "",
    Typ: row.movement_type,
    Mnozstvo: Number(row.quantity ?? 0),
    Poznamka: row.note || "",
    Datum: row.created_at,
  }));

  const summary = [
    {
      Produkt: product.name,
      SKU: product.sku || "",
      Jednotka: product.unit || "",
      Minimalna_zasoba: Number(product.min_stock ?? 0),
      Nakupna_cena: Number(product.purchase_price ?? 0),
      Predajna_cena: Number(product.sale_price ?? 0),
    },
  ];

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Produkt");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(balances), "Zasoby");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(movements), "Historia");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const safeName = `${product.sku || product.name || "produkt"}`
    .replace(/[^\p{L}\p{N}\-_]+/gu, "_")
    .slice(0, 50);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="historia_${safeName}.xlsx"`,
    },
  });
}