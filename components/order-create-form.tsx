"use client";

import { useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string | null;
};

type Warehouse = {
  id: string;
  name: string;
};

type OrderItem = {
  product_id: string;
  quantity: string;
};

type OrderCreateFormProps = {
  products: Product[];
  warehouses: Warehouse[];
};

export default function OrderCreateForm({
  products,
  warehouses,
}: OrderCreateFormProps) {
  const [items, setItems] = useState<OrderItem[]>([
    { product_id: "", quantity: "" },
  ]);

  const canSubmit = useMemo(() => {
    return items.some(
      (item) =>
        item.product_id.trim() !== "" &&
        item.quantity.trim() !== "" &&
        Number(item.quantity) > 0
    );
  }, [items]);

  function updateItem(index: number, key: keyof OrderItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { product_id: "", quantity: "" }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action="/orders/new" method="post" className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="order_number"
          placeholder="Číslo objednávky"
          className="rounded-xl border border-gray-200 px-3 py-2.5"
          required
        />

        <input
          name="customer_name"
          placeholder="Meno zákazníka"
          className="rounded-xl border border-gray-200 px-3 py-2.5"
        />

        <select
          name="warehouse_id"
          className="rounded-xl border border-gray-200 px-3 py-2.5"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Vyber sklad
          </option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>

        <textarea
          name="note"
          placeholder="Poznámka"
          className="rounded-xl border border-gray-200 px-3 py-2.5"
        />
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">Položky objednávky</div>

        {items.map((item, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-[1fr_180px_140px]">
            <select
              value={item.product_id}
              onChange={(e) => updateItem(index, "product_id", e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            >
              <option value="">Vyber produkt</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku ? `${product.sku} - ${product.name}` : product.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
              placeholder="Množstvo"
              className="rounded-xl border border-gray-200 px-3 py-2.5"
            />

            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded-xl border border-red-200 px-3 py-2.5 text-red-600"
              disabled={items.length === 1}
            >
              Odstrániť
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addItem}
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700"
        >
          Pridať položku
        </button>
      </div>

      <input
        type="hidden"
        name="items_json"
        value={JSON.stringify(
          items.filter(
            (item) =>
              item.product_id.trim() !== "" &&
              item.quantity.trim() !== "" &&
              Number(item.quantity) > 0
          )
        )}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-xl bg-slate-900 px-4 py-2.5 text-white disabled:opacity-50"
      >
        Uložiť objednávku
      </button>
    </form>
  );
}