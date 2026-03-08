import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  await requirePermission("orders");

  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("customer_orders")
    .select(`
      id,
      order_number,
      customer_name,
      status,
      note,
      created_at,
      warehouses (
        name
      )
    `)
    .eq("id", id)
    .single();

  if (!order) {
    return new Response("Objednavka neexistuje", { status: 404 });
  }

  const { data: itemsRaw } = await supabase
    .from("customer_order_items")
    .select(`
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
    `)
    .eq("order_id", id)
    .order("created_at", { ascending: true });

  const warehouse = Array.isArray((order as any).warehouses)
    ? (order as any).warehouses[0]
    : (order as any).warehouses;

  const summary = [
    {
      Cislo_objednavky: (order as any).order_number,
      Zakaznik: (order as any).customer_name || "",
      Sklad: warehouse?.name || "",
      Stav: (order as any).status,
      Poznamka: (order as any).note || "",
      Vytvorene: (order as any).created_at,
    },
  ];

  const items = (itemsRaw ?? []).map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const location = Array.isArray(row.locations) ? row.locations[0] : row.locations;

    return {
      SKU: product?.sku || "",
      Produkt: product?.name || "",
      Lokacia: location ? `${location.code} - ${location.name}` : "",
      Mnozstvo: Number(row.quantity ?? 0),
      Vychystane: Number(row.picked_qty ?? 0),
      Stav: row.status || "",
    };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Objednavka");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(items), "Picker_list");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  const safeOrderNumber = `${(order as any).order_number || "picker"}`
    .replace(/[^\p{L}\p{N}\-_]+/gu, "_")
    .slice(0, 50);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="picker_${safeOrderNumber}.xlsx"`,
    },
  });
}