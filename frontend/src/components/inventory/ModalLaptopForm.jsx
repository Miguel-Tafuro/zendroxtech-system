import React from "react";
import { X, PlusCircle } from "lucide-react";

export default function ModalLaptopForm({
  isOpen,
  onClose,
  equipoAEditar,
  formLaptop,
  setFormLaptop,
  handleGuardarLaptop,
  loading,
  catalogoHardware,
  filtroMarcaModal,
  setFiltroMarcaModal,
  categoriasTienda,
  onOpenNuevoModelo,
  onOpenNuevaPantalla
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white">
            {equipoAEditar ? `Editar Laptop [${equipoAEditar.codigo_interno}]` : "Agregar Laptop al Inventario"}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleGuardarLaptop} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Código SKU *</label>
              <input
                type="text"
                value={formLaptop.codigo_interno}
                onChange={(e) => setFormLaptop({ ...formLaptop, codigo_interno: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Serial Fabricante (Opcional)</label>
              <input
                type="text"
                value={formLaptop.serial_fabricante}
                onChange={(e) => setFormLaptop({ ...formLaptop, serial_fabricante: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Modelo de Laptop con Filtro de Marca */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-400">Modelo de Laptop *</label>
              <button
                type="button"
                onClick={onOpenNuevoModelo}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Crear Nuevo Modelo (3FN)
              </button>
            </div>

            {/* Filtro rápido por Marca */}
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-1.5">
              <button
                type="button"
                onClick={() => setFiltroMarcaModal("")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                  !filtroMarcaModal ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Todas
              </button>
              {catalogoHardware.marcas.map((m) => (
                <button
                  key={m.id_marca}
                  type="button"
                  onClick={() => setFiltroMarcaModal(m.nombre)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 transition ${
                    filtroMarcaModal.toLowerCase() === m.nombre.toLowerCase()
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {m.nombre}
                </button>
              ))}
            </div>

            <select
              value={formLaptop.id_modelo}
              onChange={(e) => setFormLaptop({ ...formLaptop, id_modelo: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            >
              <option value="">-- Elige Modelo --</option>
              {(filtroMarcaModal
                ? catalogoHardware.modelos.filter((m) => m.marca?.toLowerCase() === filtroMarcaModal.toLowerCase())
                : catalogoHardware.modelos
              ).map((m) => (
                <option key={m.id_modelo} value={m.id_modelo}>
                  {m.nombre_completo || m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Especificación de Pantalla con Botón Nueva Pantalla */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-400">Especificación de Pantalla *</label>
              <button
                type="button"
                onClick={onOpenNuevaPantalla}
                className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <PlusCircle className="w-3.5 h-3.5" /> + Crear Nueva Pantalla (3FN)
              </button>
            </div>
            <select
              value={formLaptop.id_pantalla}
              onChange={(e) => setFormLaptop({ ...formLaptop, id_pantalla: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              required
            >
              <option value="">-- Elige Pantalla --</option>
              {catalogoHardware.pantallas.map((p) => (
                <option key={p.id_pantalla} value={p.id_pantalla}>
                  {p.descripcion}
                </option>
              ))}
            </select>
          </div>

          {/* RAM y Disco Duro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="min-w-0">
              <label className="block text-slate-400 mb-1">RAM (GB) y Tipo *</label>
              <div className="flex gap-2 min-w-0">
                <input
                  type="number"
                  value={formLaptop.ram_gb}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormLaptop({ ...formLaptop, ram_gb: val, ram_detalles: `${val} GB DDR5` });
                  }}
                  className="w-20 sm:w-24 shrink-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
                <input
                  type="text"
                  placeholder="Ej: 16 GB DDR5"
                  value={formLaptop.ram_detalles}
                  onChange={(e) => setFormLaptop({ ...formLaptop, ram_detalles: e.target.value })}
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="block text-slate-400 mb-1">Disco (GB) y Tipo *</label>
              <div className="flex gap-2 min-w-0">
                <input
                  type="number"
                  value={formLaptop.almacenamiento_gb}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormLaptop({ ...formLaptop, almacenamiento_gb: val, almacenamiento_detalles: `${val} GB SSD NVMe M.2` });
                  }}
                  className="w-20 sm:w-24 shrink-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  required
                />
                <input
                  type="text"
                  placeholder="Ej: 512 GB SSD NVMe M.2"
                  value={formLaptop.almacenamiento_detalles}
                  onChange={(e) => setFormLaptop({ ...formLaptop, almacenamiento_detalles: e.target.value })}
                  className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Condición *</label>
              <select
                value={formLaptop.condicion}
                onChange={(e) => setFormLaptop({ ...formLaptop, condicion: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="nuevo">Nuevo</option>
                <option value="exhibicion">Exhibición (Open Box)</option>
                <option value="usado">Usado</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Grado Estético</label>
              <input
                type="text"
                value={formLaptop.grado_estetico}
                onChange={(e) => setFormLaptop({ ...formLaptop, grado_estetico: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Batería (%)</label>
              <input
                type="number"
                value={formLaptop.salud_bateria_porcentaje}
                onChange={(e) => setFormLaptop({ ...formLaptop, salud_bateria_porcentaje: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {/* Precios Compra, Venta y Oferta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-slate-400 mb-1">Precio Compra ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="500.00"
                value={formLaptop.precio_compra}
                onChange={(e) => setFormLaptop({ ...formLaptop, precio_compra: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Precio Venta ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="695.00"
                value={formLaptop.precio_venta}
                onChange={(e) => setFormLaptop({ ...formLaptop, precio_venta: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold text-emerald-400"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Precio Antes ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="1150.00"
                value={formLaptop.precio_oferta}
                onChange={(e) => setFormLaptop({ ...formLaptop, precio_oferta: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Categorías en Tienda (Pills Interactivas) */}
          <div>
            <label className="block text-slate-400 mb-1.5 font-medium">
              Categorías en Tienda Online (Selecciona las que apliquen)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categoriasTienda.map((cat) => {
                const selectedList = (formLaptop.categorias || "")
                  .split(",")
                  .map((c) => c.trim().toLowerCase())
                  .filter(Boolean);
                const isSelected = selectedList.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      let next;
                      if (isSelected) {
                        next = selectedList.filter((c) => c !== cat.id);
                      } else {
                        next = [...selectedList, cat.id];
                      }
                      setFormLaptop({ ...formLaptop, categorias: next.join(",") });
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition border ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Software / Usos ideales */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              🎯 Ideal para (Software recomendado mostrado en la tienda online)
            </label>
            <input
              type="text"
              placeholder="Ej: AutoCAD, Revit, Photoshop, Valorant, Programación Web"
              value={formLaptop.ideal_software}
              onChange={(e) => setFormLaptop({ ...formLaptop, ideal_software: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
            />
          </div>

          {/* Detalles y Observaciones Especiales */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Detalles / Características Especiales</label>
            <input
              type="text"
              placeholder="Ej: Función 2 en 1 (360°), Pantalla táctil, Teclado iluminado, Copilot"
              value={formLaptop.detalles_observaciones}
              onChange={(e) => setFormLaptop({ ...formLaptop, detalles_observaciones: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl transition mt-4 shadow-lg shadow-indigo-600/30"
          >
            {loading ? "Guardando..." : equipoAEditar ? "Guardar Cambios" : "Guardar Laptop en Inventario"}
          </button>
        </form>
      </div>
    </div>
  );
}
