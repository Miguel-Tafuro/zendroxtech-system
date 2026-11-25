import React from "react";
import { Laptop, X, Sparkles } from "lucide-react";

export default function ModalNuevaPantalla({
  isOpen,
  onClose,
  formNuevaPantalla,
  setFormNuevaPantalla,
  handleCrearNuevaPantalla,
  loading
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-400" />
              Crear Nueva Pantalla (3FN)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Componentes: Pulgadas &rarr; Resolución &rarr; Panel &rarr; Hz &rarr; Táctil
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCrearNuevaPantalla} className="space-y-3.5 text-xs">
          {/* Tamaño en Pulgadas */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tamaño en Pulgadas * <span className="text-slate-500 font-normal">(Ej: 16.1, 15.6, 14.0, 13.3)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="16.1"
                value={formNuevaPantalla.valor_pulgadas}
                onChange={(e) => setFormNuevaPantalla({ ...formNuevaPantalla, valor_pulgadas: e.target.value })}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>
            {/* Accesos rápidos */}
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {[13.3, 14.0, 15.6, 16.0, 16.1, 17.3].map((pulg) => (
                <button
                  key={pulg}
                  type="button"
                  onClick={() => setFormNuevaPantalla({ ...formNuevaPantalla, valor_pulgadas: pulg })}
                  className={`px-2 py-0.5 rounded text-[11px] border ${
                    parseFloat(formNuevaPantalla.valor_pulgadas) === pulg
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white"
                  }`}
                >
                  {pulg}"
                </button>
              ))}
            </div>
          </div>

          {/* Resolución */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Resolución *</label>
            <select
              value={formNuevaPantalla.nombre_resolucion}
              onChange={(e) => {
                const val = e.target.value;
                let ancho = 1920, alto = 1080;
                if (val.includes("1920x1080")) { ancho = 1920; alto = 1080; }
                else if (val.includes("1920x1200")) { ancho = 1920; alto = 1200; }
                else if (val.includes("2560x1440")) { ancho = 2560; alto = 1440; }
                else if (val.includes("2560x1600")) { ancho = 2560; alto = 1600; }
                else if (val.includes("3840x2160")) { ancho = 3840; alto = 2160; }
                else if (val.includes("1366x768")) { ancho = 1366; alto = 768; }
                setFormNuevaPantalla({
                  ...formNuevaPantalla,
                  nombre_resolucion: val,
                  ancho_px: ancho,
                  alto_px: alto
                });
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            >
              <option value="Full HD (1920x1080)">Full HD (1920x1080) - Estándar 16:9</option>
              <option value="FHD+ (1920x1200)">FHD+ (1920x1200) - 16:10</option>
              <option value="2K / QHD (2560x1440)">2K / QHD (2560x1440)</option>
              <option value="2.5K / QHD+ (2560x1600)">2.5K / QHD+ (2560x1600) - 16:10</option>
              <option value="4K UHD (3840x2160)">4K Ultra HD (3840x2160)</option>
              <option value="HD (1366x768)">HD (1366x768)</option>
            </select>
          </div>

          {/* Tipo de Panel y Tasa de Refresco */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tipo de Panel *</label>
              <select
                value={formNuevaPantalla.nombre_tipo_pantalla}
                onChange={(e) => setFormNuevaPantalla({ ...formNuevaPantalla, nombre_tipo_pantalla: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="IPS">IPS (Ángulo amplio)</option>
                <option value="OLED">OLED (Negros puros)</option>
                <option value="AMOLED">AMOLED</option>
                <option value="WVA">WVA</option>
                <option value="TN">TN</option>
                <option value="VA">VA</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tasa de Refresco *</label>
              <select
                value={formNuevaPantalla.numero_hzs}
                onChange={(e) => setFormNuevaPantalla({ ...formNuevaPantalla, numero_hzs: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              >
                <option value="60">60 Hz (Oficina / General)</option>
                <option value="120">120 Hz</option>
                <option value="144">144 Hz (Gaming)</option>
                <option value="165">165 Hz</option>
                <option value="240">240 Hz</option>
                <option value="360">360 Hz</option>
              </select>
            </div>
          </div>

          {/* Switch Táctil */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-xs flex items-center gap-1.5">
                <span>¿Es Pantalla Táctil? (Touchscreen / 360°)</span>
              </p>
              <p className="text-[11px] text-slate-400">Para laptops 2 en 1 convertibles o con panel táctil</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formNuevaPantalla.tactil}
                onChange={(e) => setFormNuevaPantalla({ ...formNuevaPantalla, tactil: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Vista previa en tiempo real */}
          <div className="bg-indigo-950/30 border border-indigo-800/40 p-2.5 rounded-xl text-[11px] text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Vista previa:{" "}
              <strong>
                {formNuevaPantalla.valor_pulgadas}" {formNuevaPantalla.nombre_resolucion}{" "}
                {formNuevaPantalla.nombre_tipo_pantalla} {formNuevaPantalla.numero_hzs}Hz{" "}
                {formNuevaPantalla.tactil ? "(Táctil)" : ""}
              </strong>
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl transition shadow-lg shadow-indigo-600/30"
            >
              Guardar Pantalla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
