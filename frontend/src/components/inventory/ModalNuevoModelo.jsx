import React from "react";
import { Layers, X, Sparkles } from "lucide-react";

export default function ModalNuevoModelo({
  isOpen,
  onClose,
  formNuevoModelo,
  setFormNuevoModelo,
  catalogoHardware,
  handleCrearNuevoModelo,
  loading
}) {
  if (!isOpen) return null;

  const marcaSeleccionadaObj = catalogoHardware.marcas.find(
    (m) => m.nombre.toLowerCase() === formNuevoModelo.nombre_marca.trim().toLowerCase()
  );
  const lineasFiltradas = marcaSeleccionadaObj
    ? catalogoHardware.lineas.filter((l) => l.id_marca === marcaSeleccionadaObj.id_marca)
    : [];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Crear Nuevo Modelo de Hardware
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Estructura 3FN Relacional: Marca &rarr; Línea &rarr; Modelo
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCrearNuevoModelo} className="space-y-3.5 text-xs">
          {/* 1. Marca */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              1. Marca del Fabricante *
            </label>
            <div className="flex gap-2">
              <select
                value={
                  catalogoHardware.marcas.some(
                    (m) => m.nombre.toLowerCase() === formNuevoModelo.nombre_marca.toLowerCase()
                  )
                    ? formNuevoModelo.nombre_marca
                    : formNuevoModelo.nombre_marca
                    ? "__OTRA__"
                    : ""
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "__OTRA__") {
                    setFormNuevoModelo({ ...formNuevoModelo, nombre_marca: "", nombre_linea: "" });
                  } else {
                    setFormNuevoModelo({ ...formNuevoModelo, nombre_marca: val, nombre_linea: "" });
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white flex-1"
              >
                <option value="">-- Elige Marca --</option>
                {catalogoHardware.marcas.map((m) => (
                  <option key={m.id_marca} value={m.nombre}>
                    {m.nombre}
                  </option>
                ))}
                <option value="__OTRA__">+ Otra marca (Escribir)...</option>
              </select>

              {(!catalogoHardware.marcas.some(
                (m) => m.nombre.toLowerCase() === formNuevoModelo.nombre_marca.toLowerCase()
              ) ||
                formNuevoModelo.nombre_marca === "") && (
                <input
                  type="text"
                  placeholder="Nombre de la nueva marca..."
                  value={formNuevoModelo.nombre_marca}
                  onChange={(e) =>
                    setFormNuevoModelo({ ...formNuevoModelo, nombre_marca: e.target.value, nombre_linea: "" })
                  }
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              )}
            </div>
          </div>

          {/* 2. Línea / Serie (Filtrada por la marca elegida) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-300 font-semibold">
                2. Línea o Serie {formNuevoModelo.nombre_marca ? `de ${formNuevoModelo.nombre_marca}` : ""} *
              </label>
              {formNuevoModelo.nombre_marca && (
                <span className="text-[11px] text-indigo-400">
                  {lineasFiltradas.length > 0 ? `${lineasFiltradas.length} series registradas` : "Nueva serie"}
                </span>
              )}
            </div>

            <input
              type="text"
              list="lista-lineas-filtradas"
              disabled={!formNuevoModelo.nombre_marca}
              placeholder={
                formNuevoModelo.nombre_marca ? `Ej: Envy, Victus, Pavilion...` : `Primero selecciona una marca`
              }
              value={formNuevoModelo.nombre_linea}
              onChange={(e) => setFormNuevoModelo({ ...formNuevoModelo, nombre_linea: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
              required
            />
            <datalist id="lista-lineas-filtradas">
              {lineasFiltradas.map((l) => (
                <option key={l.id_linea} value={l.nombre} />
              ))}
            </datalist>

            {lineasFiltradas.length > 0 && (
              <div className="flex gap-1.5 mt-1.5 flex-wrap items-center">
                <span className="text-[10px] text-slate-500">Líneas de {formNuevoModelo.nombre_marca}:</span>
                {lineasFiltradas.map((l) => (
                  <button
                    key={l.id_linea}
                    type="button"
                    onClick={() => setFormNuevoModelo({ ...formNuevoModelo, nombre_linea: l.nombre })}
                    className={`px-2 py-0.5 rounded text-[11px] border transition ${
                      formNuevoModelo.nombre_linea.toLowerCase() === l.nombre.toLowerCase()
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {l.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Procesador (CPU) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              3. Procesador (CPU) *{" "}
              <span className="text-slate-500 font-normal">(Ej: AMD Ryzen 5 8640HS, Intel Core i7-13700H)</span>
            </label>
            <input
              type="text"
              list="lista-procesadores"
              placeholder="Selecciona o escribe el procesador..."
              value={formNuevoModelo.nombre_procesador}
              onChange={(e) => setFormNuevoModelo({ ...formNuevoModelo, nombre_procesador: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
              required
            />
            <datalist id="lista-procesadores">
              {catalogoHardware.procesadores.map((p) => (
                <option key={p.id_procesador} value={p.nombre} />
              ))}
            </datalist>
          </div>

          {/* 4. Gráfica Dedicada (GPU) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              4. Gráfica Dedicada (GPU){" "}
              <span className="text-slate-500 font-normal">(Opcional: Si usa integrados, dejar vacío)</span>
            </label>
            <input
              type="text"
              list="lista-graficas"
              placeholder="Ej: NVIDIA GeForce RTX 4060 8GB (o dejar vacío)"
              value={formNuevoModelo.nombre_grafica}
              onChange={(e) => setFormNuevoModelo({ ...formNuevoModelo, nombre_grafica: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
            />
            <datalist id="lista-graficas">
              {catalogoHardware.graficas.map((g) => (
                <option key={g.id_grafica_dedicada} value={g.nombre} />
              ))}
            </datalist>
          </div>

          {/* 5. Nombre / Referencia Exacta del Modelo */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              5. Nombre / Referencia Exacta del Modelo *
            </label>
            <input
              type="text"
              placeholder="Ej: Envy x360 16-AD0013DX / Legion 5 15ARP8 / ThinkPad T14"
              value={formNuevoModelo.nombre_modelo}
              onChange={(e) => setFormNuevoModelo({ ...formNuevoModelo, nombre_modelo: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Resumen pedagógico visual */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="text-indigo-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Normalización Relacional 3FN:
            </p>
            <p>
              Vinculará <code className="text-indigo-200">{formNuevoModelo.nombre_marca || "Marca"}</code> &rarr;{" "}
              <code className="text-indigo-200">{formNuevoModelo.nombre_linea || "Línea"}</code> &rarr;{" "}
              <code className="text-indigo-200">{formNuevoModelo.nombre_modelo || "Modelo"}</code> garantizando integridad.
            </p>
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
              Guardar Modelo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
