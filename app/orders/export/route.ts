import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET() {
  await requirePermission("orders");

  const supabase = await createClient();

  const { data: ordersRaw } = await supabase
    .from("customer_orders")
    .select(`
      id,
      order_number,
      customer_name,
      status,
      note,
      created_at,
      picked_at,
      completed_at,
      warehouses (
        name
      )
    `)
    .order("created_at", { ascending: false });

  const { data: itemsRaw } = await supabase
    .from("customer_order_items")
    .select(`
      order_id,
      quantity,
      picked_qty,
      status,
      products (
        name,
        sku
      ),
      locations (
        name,
        code
      )
    `);

  const orders = (ordersRaw ?? []).map((row: any) => {
    const warehouse = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses;

    return {
      ID: row.id,
      Cislo_objednavky: row.order_number,
      Zakaznik: row.customer_name || "",
      Sklad: warehouse?.name || "",
      Stav: row.status,
      Poznamka: row.note || "",
      Vytvorene: row.created_at,
      Vychystane: row.picked_at || "",
      Dokoncene: row.completed_at || "",
    };
  });

  const items = (itemsRaw ?? []).map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;

    return {
      Order_ID: row.order_id,
      SKU: product?.sku || "",
      Produkt: product?.name || "",
      Lokacia: location ? `${location.code} - ${location.name}` : "",
      Mnozstvo: Number(row.quantity ?? 0),
      Vychystane: Number(row.picked_qty ?? 0),
      Stav: row.status || "",
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(orders), "Objednavky");
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
      "Content-Disposition": 'attachment; filename="objednavky.xlsx"',
    },
  });
}