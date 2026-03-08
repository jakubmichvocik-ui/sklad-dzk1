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

type TransferFormProps = {
  products: Product[];
  warehouses: Warehouse[];
  locations: Location[];
};

export default function TransferForm({
  products,
  warehouses,
  locations,
}: TransferFormProps) {
  const [productId, setProductId] = useState("");
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [toLocationId, setToLocationId] = useState("");

  const [fromQty, setFromQty] = useState<number | null>(null);
  const [toQty, setToQty] = useState<number | null>(null);

  const fromLocations = useMemo(() => {
    if (!fromWarehouseId) return [];
    return locations.filter((location) => location.warehouse_id === fromWarehouseId);
  }, [locations, fromWarehouseId]);

  const toLocations = useMemo(() => {
    if (!toWarehouseId) return [];
    return locations.filter((location) => location.warehouse_id === toWarehouseId);
  }, [locations, toWarehouseId]);

  useEffect(() => {
    setFromLocationId("");
  }, [fromWarehouseId]);

  useEffect(() => {
    setToLocationId("");
  }, [toWarehouseId]);

  useEffect(() => {
    async function loadFromBalance() {
      if (!productId || !fromWarehouseId || !fromLocationId) {
        setFromQty(null);
        return;
      }

      const res = await fetch(
        `/api/stock-balance?product_id=${productId}&warehouse_id=${fromWarehouseId}&location_id=${fromLocationId}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      setFromQty(Number(data.quantity ?? 0));
    }

    loadFromBalance();
  }, [productId, fromWarehouseId, fromLocationId]);

  useEffect(() => {
    async function loadToBalance() {
      if (!productId || !toWarehouseId || !toLocationId) {
        setToQty(null);
        return;
      }

      const res = await fetch(
        `/api/stock-balance?product_id=${productId}&warehouse_id=${toWarehouseId}&location_id=${toLocationId}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      setToQty(Number(data.quantity ?? 0));
    }

    loadToBalance();
  }, [productId, toWarehouseId, toLocationId]);

  return (
    <form action="/transfers/new" method="post" className="grid gap-4 md:grid-cols-2">
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

      <input
        name="quantity"
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Množstvo"
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
      />

      <select
        name="from_warehouse_id"
        value={fromWarehouseId}
        onChange={(e) => setFromWarehouseId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
      >
        <option value="" disabled>
          Zdrojový sklad
        </option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </select>

      <select
        name="from_location_id"
        value={fromLocationId}
        onChange={(e) => setFromLocationId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
        disabled={!fromWarehouseId}
      >
        <option value="" disabled>
          {fromWarehouseId ? "Zdrojová lokácia" : "Najprv vyber zdrojový sklad"}
        </option>
        {fromLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.code} - {location.name}
          </option>
        ))}
      </select>

      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 md:col-span-2">
        Aktuálny stav na zdrojovej lokácii: <strong>{fromQty !== null ? fromQty.toFixed(2) : "-"}</strong>
      </div>

      <select
        name="to_warehouse_id"
        value={toWarehouseId}
        onChange={(e) => setToWarehouseId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
      >
        <option value="" disabled>
          Cieľový sklad
        </option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name}
          </option>
        ))}
      </select>

      <select
        name="to_location_id"
        value={toLocationId}
        onChange={(e) => setToLocationId(e.target.value)}
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        required
        disabled={!toWarehouseId}
      >
        <option value="" disabled>
          {toWarehouseId ? "Cieľová lokácia" : "Najprv vyber cieľový sklad"}
        </option>
        {toLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.code} - {location.name}
          </option>
        ))}
      </select>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 md:col-span-2">
        Aktuálny stav na cieľovej lokácii: <strong>{toQty !== null ? toQty.toFixed(2) : "-"}</strong>
      </div>

      <textarea
        name="note"
        placeholder="Poznámka"
        className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400 md:col-span-2"
      />

      <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 md:col-span-2">
        Uložiť presun
      </button>
    </form>
  );
}