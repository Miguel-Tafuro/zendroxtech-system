import React from "react";
import { Image as ImageIcon, X, RefreshCw, Star, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

export default function ModalMultimedia({
  isOpen,
  onClose,
  equipoSeleccionadoMedia,
  cargandoMedia,
  multimediaLista,
  handleMoverMultimedia,
  handleMarcarPortada,
  handleEliminarMultimedia,
  handleSubirMultimedia,
  loading,
  marcarPortadaSubida,
  setMarcarPortadaSubida
}) {
  if (!isOpen || !equipoSeleccionadoMedia) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              Galería Multimedia del Equipo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              SKU:{" "}
              <span className="text-indigo-300 font-bold font-mono">
                [{equipoSeleccionadoMedia.codigo_interno}]
              </span>{" "}
              {equipoSeleccionadoMedia.marca} {equipoSeleccionadoMedia.modelo}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid de imágenes existentes */}
        <div className="flex-1 overflow-y-auto pr-1">
          {cargandoMedia ? (
            <div className="text-center py-8 text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              Cargando imágenes del equipo...
            </div>
          ) : multimediaLista.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-950/40 text-slate-400 text-xs">
              No hay fotos subidas para este equipo todavía. Agrega la primera abajo.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {multimediaLista.map((med, index) => (
                <div
                  key={med.id_multimedia}
                  className={`relative group bg-slate-950 rounded-xl border overflow-hidden flex flex-col justify-between ${
                    med.es_portada ? "border-amber-500 shadow-md shadow-amber-500/20" : "border-slate-800"
                  }`}
                >
                  {/* Badge de Portada */}
                  <div className="absolute top-2 left-2 z-10 flex gap-1">
                    {med.es_portada ? (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Star className="w-3 h-3 fill-slate-950" /> Portada
                      </span>
                    ) : (
                      <span className="bg-slate-900/80 backdrop-blur-sm text-slate-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {/* Vista previa de imagen o video */}
                  <div className="aspect-[4/3] w-full bg-slate-900 flex items-center justify-center overflow-hidden">
                    {med.tipo === "video" ? (
                      <video src={med.url} className="w-full h-full object-cover" controls />
                    ) : (
                      <img
                        src={med.url}
                        alt="Laptop"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    )}
                  </div>

                  {/* Barra de Controles */}
                  <div className="p-2 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs gap-1">
                    {/* Reordenar */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleMoverMultimedia(med.id_multimedia, "arriba")}
                        disabled={index === 0}
                        title="Mover arriba / antes"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoverMultimedia(med.id_multimedia, "abajo")}
                        disabled={index === multimediaLista.length - 1}
                        title="Mover abajo / después"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Acciones principales */}
                    <div className="flex items-center gap-1">
                      {!med.es_portada && (
                        <button
                          onClick={() => handleMarcarPortada(med.id_multimedia)}
                          title="Convertir en Foto de Portada"
                          className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Star className="w-3 h-3" /> Portada
                        </button>
                      )}
                      <button
                        onClick={() => handleEliminarMultimedia(med.id_multimedia)}
                        title="Eliminar Foto"
                        className="p-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subir Nueva Foto o Video */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <h4 className="text-xs font-bold text-slate-300">Subir Nueva Foto / Video</h4>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleSubirMultimedia}
              disabled={loading}
              className="flex-1 w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
            <label className="flex items-center gap-1.5 text-xs text-slate-300 whitespace-nowrap cursor-pointer select-none">
              <input
                type="checkbox"
                checked={marcarPortadaSubida}
                onChange={(e) => setMarcarPortadaSubida(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Subir como Portada</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
