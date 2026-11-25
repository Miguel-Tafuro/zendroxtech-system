import React from "react";
import { X } from "lucide-react";

export default function QrScannerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-white">Escanear Código SKU / Serial</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-slate-950"></div>
        <p className="text-[11px] text-slate-400 text-center">Apunta la cámara a la etiqueta de la laptop</p>
      </div>
    </div>
  );
}
