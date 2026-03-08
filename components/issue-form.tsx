"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string | null;
};

type Warehouse = {
  id: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
  code: string;
  warehouse_id: string;
};

type ReceiptFormProps = {
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
};

export default function ReceiptForm({
  products,
  warehouses,
  locations,
}: ReceiptFormProps) {
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [currentQty, setCurrentQty] = useState<number | null>(null);

  const filteredLocations = useMemo(() => {
    if (!warehouseId) return [];
    return locations.filter((location) => location.warehouse_id === warehouseId);
  }, [locations, warehouseId]);

  useEffect(() => {
    setLocationId("");
  }, [warehouseId]);

  useEffect(() => {
    async function loadBalance() {
      if (!productId || !warehouseId || !locationId) {
        setCurrentQty(null);
        return;
      }

      const res = await fetch(
        `/api/stock-balance?product_id=${productId}&warehouse_id=${warehouseId}&location_id=${locationId}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      setCurrentQty(Number(data.quantity ?? 0));
    }

    loadBalance();
  }, [productId, warehouseId, locationId]);

  return (
    <form action="/movements/receive" method="post" className="grid gap-4 md:grid-cols-2">
      <select
        name="product_id"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
      >
        <option value="" disabled>
          Vyber produkt
        </option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.sku ? `${product.sku} - ${product.name}` : product.name}
          </option>
        ))}
      </select>

      <select
        name="warehouse_id"
        value={warehouseId}
        onChange={(e) => setWarehouseId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
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

      <select
        name="location_id"
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
        disabled={!warehouseId}
      >
        <option value="" disabled>
          {warehouseId ? "Vyber lokáciu" : "Najprv vyber sklad"}
        </option>
        {filteredLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.code} - {location.name}
          </option>
        ))}
      </select>

      <input
        name="quantity"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Množstvo"
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 md:col-span-2">
        Aktuálny stav na lokácii: <strong>{currentQty !== null ? currentQty.toFixed(2) : "-"}</strong>
      </div>

      <textarea
        name="note"
        placeholder="Poznámka"
        className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400 md:col-span-2"
      />

      <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 md:col-span-2">
        Uložiť príjem
      </button>
    </form>
  );
}