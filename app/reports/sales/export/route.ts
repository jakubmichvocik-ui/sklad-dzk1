import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/require-permission";

export async function GET(request: Request) {
  await requirePermission("orders");

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month";

  const supabase = await createClient();

  const now = new Date();
  const fromDate = new Date(now);

  if (period === "week") {
    fromDate.setDate(now.getDate() - 7);
  } else if (period === "year") {
    fromDate.setFullYear(now.getFullYear() - 1);
  } else {
    fromDate.setMonth(now.getMonth() - 1);
  }

  const { data: rowsRaw } = await supabase
    .from("stock_movements")
    .select(`
      id,
      quantity,
      created_at,
      note,
      products (
        name,
        sku,
        sale_price
      )
    `)
    .eq("movement_type", "issue")
    .gte("created_at", fromDate.toISOString())
    .order("created_at", { ascending: false });

  type MovementRow = {
    id: string;
    quantity: number;
    created_at: string;
    note?: string | null;
    products:
      | {
          name: string;
          sku: string | null;
          sale_price: number | null;
        }
      | {
          name: string;
          sku: string | null;
          sale_price: number | null;
        }[]
      | null;
  };

  const rows = (rowsRaw ?? []) as MovementRow[];

  const grouped = new Map<
    string,
    {
      sku: string;
      name: string;
      qty: number;
      value: number;
    }
  >();

  for (const row of rows) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!product) continue;

    const key = `${product.sku || ""}|${product.name}`;
    const qty = Number(row.quantity ?? 0);
    const value = qty * Number(product.sale_price ?? 0);

    const prev = grouped.get(key);
    if (prev) {
      prev.qty += qty;
      prev.value += value;
    } else {
      grouped.set(key, {
        sku: product.sku || "-",
        name: product.name,
        qty,
        value,
      });
    }
  }

  const summaryRows = Array.from(grouped.values())
    .sort((a, b) => b.qty - a.qty)
    .map((item) => ({
      SKU: item.sku,
      Produkt: item.name,
      Predane_mnozstvo: Number(item.qty.toFixed(2)),
      Predajna_hodnota: Number(item.value.toFixed(2)),
    }));

  const detailRows = rows.map((row) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const qty = Number(row.quantity ?? 0);
    const salePrice = Number(product?.sale_price ?? 0);

    return {
      Datum: row.created_at,
      SKU: product?.sku || "",
      Produkt: product?.name || "",
      Mnozstvo: Number(qty.toFixed(2)),
      Jednotkova_predajna_cena: Number(salePrice.toFixed(2)),
      Predajna_hodnota: Number((qty * salePrice).toFixed(2)),
      Poznamka: row.note || "",
    };
  });

  const totalQty = summaryRows.reduce((sum, row) => sum + Number(row.Predane_mnozstvo), 0);
  const totalValue = summaryRows.reduce((sum, row) => sum + Number(row.Predajna_hodnota), 0);

  const periodLabel =
    period === "week"
      ? "Tyzden"
      : period === "year"
      ? "Rok"
      : "Mesiac";

  const infoRows = [
    {
      Obdobie: periodLabel,
      Od: fromDate.toISOString(),
      Do: now.toISOString(),
      Predane_spolu: Number(totalQty.toFixed(2)),
      Hodnota_spolu: Number(totalValue.toFixed(2)),
    },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(infoRows), "Prehlad");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), "Produkty");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(detailRows), "Detaily");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="predaje_${period}.xlsx"`,
    },
  });
}