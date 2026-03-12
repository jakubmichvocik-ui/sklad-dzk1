"use client";

import { useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
};

type BarcodeInputProps = {
  products: ProductRow[];
  onProductFound: (productId: string) => void;
};

export default function BarcodeInput({
  products,
  onProductFound,
}: BarcodeInputProps) {
  const [barcode, setBarcode] = useState("");
  const [message, setMessage] = useState("");

  function handleSearch(value: string) {
    const clean = value.trim();
    setBarcode(clean);

    if (!clean) {
      setMessage("");
      return;
    }

    const found = products.find(
      (product) =>
        product.barcode?.trim() === clean ||
        product.sku?.trim() === clean
    );

    if (found) {
      onProductFound(found.id);
      setMessage(
        `Nájdené: ${found.sku ? `${found.sku} - ` : ""}${found.name}`
      );
    } else {
      setMessage("Produkt s týmto kódom neexistuje.");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-gray-900">
        Sken čiarového kódu
      </div>

      <input
        value={barcode}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Naskenuj alebo zadaj čiarový kód"
        className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-base outline-none transition focus:border-gray-400"
      />

      {message ? (
        <div className="mt-3 text-sm text-gray-600">{message}</div>
      ) : null}
    </div>
  );
}