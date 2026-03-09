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

type IssueFormProps = {
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
};

export default function IssueForm({
  products,
  warehouses,
  locations,
}: IssueFormProps) {
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
    <form action="/issues/new" method="post" className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">1. Produkt</div>
        <select
          name="product_id"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">2. Odkiaľ vydať</div>

        <div className="space-y-3">
          <select
            name="warehouse_id"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
        <div className="text-sm text-amber-700">Aktuálny stav na lokácii</div>
        <div className="mt-1 text-3xl font-bold text-amber-900">
          {currentQty !== null ? currentQty.toFixed(2) : "-"}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">3. Množstvo a poznámka</div>

        <div className="space-y-3">
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Množstvo"
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-lg outline-none transition focus:border-gray-400"
            required
          />

          <textarea
            name="note"
            placeholder="Poznámka"
            className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
          />
        </div>
      </div>

      <div className="sticky bottom-20 z-20 md:static">
        <button className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-slate-800">
          Uložiť výdaj
        </button>
      </div>
    </form>
  );
}