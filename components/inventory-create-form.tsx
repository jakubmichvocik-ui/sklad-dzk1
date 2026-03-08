"use client";

import { useMemo, useState } from "react";

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

type InventoryCreateFormProps = {
  warehouses: Warehouse[];
  locations: Location[];
};

export default function InventoryCreateForm({
  warehouses,
  locations,
}: InventoryCreateFormProps) {
  const [warehouseId, setWarehouseId] = useState("");

  const filteredLocations = useMemo(() => {
    if (!warehouseId) return [];
    return locations.filter((location) => location.warehouse_id === warehouseId);
  }, [locations, warehouseId]);

  return (
    <form action="/inventory/new" method="post" className="grid gap-4 md:grid-cols-2">
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
        className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400"
        defaultValue=""
        disabled={!warehouseId}
      >
        <option value="">
          {warehouseId ? "Celý sklad alebo konkrétna lokácia" : "Najprv vyber sklad"}
        </option>
        {filteredLocations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.code} - {location.name}
          </option>
        ))}
      </select>

      <textarea
        name="note"
        placeholder="Poznámka"
        className="min-h-[100px] rounded-xl border border-gray-200 px-3 py-2.5 outline-none transition focus:border-gray-400 md:col-span-2"
      />

      <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 md:col-span-2">
        Vytvoriť inventúru
      </button>
    </form>
  );
}