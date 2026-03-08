import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET() {
  await requirePermission("inventory");

  const supabase = await createClient();

  const { data: sessionsRaw } = await supabase
    .from("inventory_sessions")
    .select(`
      id,
      status,
      note,
      created_at,
      completed_at,
      warehouses (
        name
      ),
      locations (
        name,
        code
      )
    `)
    .order("created_at", { ascending: false });

  const { data: itemsRaw } = await supabase
    .from("inventory_items")
    .select(`
      inventory_session_id,
      expected_qty,
      counted_qty,
      difference_qty,
      note,
      products (
        name,
        sku
      )
    `);

  const sessions = (sessionsRaw ?? []).map((row: any) => {
    const warehouse = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;

    return {
      ID: row.id,
      Sklad: warehouse?.name || "",
      Lokacia: location ? `${location.code} - ${location.name}` : "Cely sklad",
      Stav: row.status,
      Poznamka: row.note || "",
      Vytvorene: row.created_at,
      Dokoncene: row.completed_at || "",
    };
  });

  const items = (itemsRaw ?? []).map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;

    return {
      Session_ID: row.inventory_session_id,
      SKU: product?.sku || "",
      Produkt: product?.name || "",
      Ocekavane: Number(row.expected_qty ?? 0),
      Scitane: Number(row.counted_qty ?? 0),
      Rozdiel: Number(row.difference_qty ?? 0),
      Poznamka: row.note || "",
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sessions), "Inventury");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items), "Polozky");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="inventury.xlsx"',
    },
  });
}