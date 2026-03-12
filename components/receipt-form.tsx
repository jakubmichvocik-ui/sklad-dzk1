"use client";

import { useEffect, useMemo, useState } from "react";
import BarcodeInput from "@/components/barcode-input";
import CameraBarcodeScanner from "@/components/camera-barcode-scanner";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
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

  function handleDetectedCode(code: string) {
    const clean = code.trim();

    const found = products.find(
      (product) =>
        product.barcode?.trim() === clean ||
        product.sku?.trim() === clean
    );

    if (found) {
      setProductId(found.id);
    }
  }

  return (
    <form action="/transfers/new" method="post" className="space-y-4">
      <BarcodeInput
        products={products}
        onProductFound={(id) => setProductId(id)}
      />

      <CameraBarcodeScanner onDetected={handleDetectedCode} />

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">1. Produkt a množstvo</div>

        <div className="space-y-3">
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

          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Množstvo"
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-lg outline-none transition focus:border-gray-400"
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">2. Zdroj</div>

        <div className="space-y-3">
          <select
            name="from_warehouse_id"
            value={fromWarehouseId}
            onChange={(e) => setFromWarehouseId(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="text-sm text-blue-700">Aktuálny stav na zdrojovej lokácii</div>
        <div className="mt-1 text-3xl font-bold text-blue-900">
          {fromQty !== null ? fromQty.toFixed(2) : "-"}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">3. Cieľ</div>

        <div className="space-y-3">
          <select
            name="to_warehouse_id"
            value={toWarehouseId}
            onChange={(e) => setToWarehouseId(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
            className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
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
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="text-sm text-emerald-700">Aktuálny stav na cieľovej lokácii</div>
        <div className="mt-1 text-3xl font-bold text-emerald-900">
          {toQty !== null ? toQty.toFixed(2) : "-"}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900">4. Poznámka</div>

        <textarea
          name="note"
          placeholder="Poznámka"
          className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
        />
      </div>

      <div className="sticky bottom-20 z-20 md:static">
        <button className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-slate-800">
          Uložiť presun
        </button>
      </div>
    </form>
  );
}