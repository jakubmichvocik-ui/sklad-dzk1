"use client";

import { BrowserMultiFormatReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

type CameraBarcodeScannerProps = {
  onDetected: (code: string) => void;
};

export default function CameraBarcodeScanner({
  onDetected,
}: CameraBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");

  async function startScanner() {
    setError("");

    try {
      if (!videoRef.current) return;

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      setRunning(true);

      await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText().trim();

            if (text && text !== lastCode) {
              setLastCode(text);
              onDetected(text);
              stopScanner();
            }
          }

          if (err) {
            const name = (err as { name?: string })?.name;
            if (
              name &&
              name !== "NotFoundException" &&
              name !== "ChecksumException" &&
              name !== "FormatException"
            ) {
              setError("Nepodarilo sa čítať čiarový kód z kamery.");
            }
          }
        }
      );
    } catch {
      setRunning(false);
      setError("Kamera sa nepodarila spustiť. Skontroluj povolenie kamery.");
    }
  }

  function stopScanner() {
    readerRef.current?.reset();
    readerRef.current = null;

    const video = videoRef.current;
    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setRunning(false);
  }

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-900">Sken cez kameru</div>
          <div className="text-xs text-gray-500">
            Mobil cez kameru, desktop cez USB skener do inputu
          </div>
        </div>

        {!running ? (
          <button
            type="button"
            onClick={startScanner}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            Zapnúť kameru
          </button>
        ) : (
          <button
            type="button"
            onClick={stopScanner}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500"
          >
            Vypnúť
          </button>
        )}
      </div>

      {running ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
          <video
            ref={videoRef}
            className="h-72 w-full object-cover"
            muted
            playsInline
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-gray-500">
          Kamera je vypnutá
        </div>
      )}

      {lastCode ? (
        <div className="mt-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">
          Naskenované: {lastCode}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}