import React from "react";
import { X } from "lucide-react";

export default function ModalMovimientoTesoreria({
  isOpen,
  onClose,
  tipoMovimientoModal,
  formTesoreria,
  setFormTesoreria,
  tesoreria,
  handleMovimientoTesoreria,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white capitalize">{tipoMovimientoModal.replace("_", " ")}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleMovimientoTesoreria} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Monto en Dólares ($) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formTesoreria.monto}
              onChange={(e) => setFormTesoreria({ ...formTesoreria, monto: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm"
              required
            />
          </div>

          {(tipoMovimientoModal === "retiro_ganancia" ||
            tipoMovimientoModal === "gasto_operativo" ||
            tipoMovimientoModal === "transferencia_cuentas") && (
            <div>
              <label className="block text-slate-400 mb-1">Cuenta de Origen *</label>
              <select
                value={formTesoreria.id_cuenta_origen}
                onChange={(e) => setFormTesoreria({ ...formTesoreria, id_cuenta_origen: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              >
                <option value="">-- Elige cuenta --</option>
                {tesoreria.cuentas.map((c) => (
                  <option key={c.id_cuenta} value={c.id_cuenta}>
                    {c.nombre} (${c.saldo_actual.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {tipoMovimientoModal === "transferencia_cuentas" && (
            <div>
              <label className="block text-slate-400 mb-1">Cuenta Destino *</label>
              <select
                value={formTesoreria.id_cuenta_destino}
                onChange={(e) => setFormTesoreria({ ...formTesoreria, id_cuenta_destino: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                required
              >
                <option value="">-- Elige cuenta destino --</option>
                {tesoreria.cuentas.map((c) => (
                  <option key={c.id_cuenta} value={c.id_cuenta}>
                    {c.nombre} (${c.saldo_actual.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1">Concepto / Motivo *</label>
            <input
              type="text"
              placeholder="Ej: Pago de delivery / Traslado a capital"
              value={formTesoreria.concepto}
              onChange={(e) => setFormTesoreria({ ...formTesoreria, concepto: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition mt-4"
          >
            Confirmar Operación
          </button>
        </form>
      </div>
    </div>
  );
}
