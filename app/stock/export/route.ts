import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET() {
  await requirePermission("stock");

  const supabase = await createClient();

  const { data: rowsRaw } = await supabase
    .from("stock_balances")
    .select(`
      quantity,
      updated_at,
      products (
        name,
        sku,
        unit,
        min_stock,
        purchase_price,
        sale_price
      ),
      warehouses (
        name
      ),
      locations (
        name,
        code
      )
    `)
    .order("updated_at", { ascending: false });

  const rows = (rowsRaw ?? []).map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const warehouse = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;

    const qty = Number(row.quantity ?? 0);
    const purchasePrice = Number(product?.purchase_price ?? 0);
    const salePrice = Number(product?.sale_price ?? 0);

    return {
      SKU: product?.sku || "",
      Produkt: product?.name || "",
      Sklad: warehouse?.name || "",
      Lokácia: location ? `${location.code} - ${location.name}` : "",
      Množstvo: qty,
      Jednotka: product?.unit || "",
      Minimalna_zasoba: Number(product?.min_stock ?? 0),
      Nakupna_hodnota: qty * purchasePrice,
      Predajna_hodnota: qty * salePrice,
      Aktualizované: row.updated_at,
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Stav skladu");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="stav_skladu.xlsx"',
    },
  });
}