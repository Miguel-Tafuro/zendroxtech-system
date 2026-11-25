import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function NotificationToast({ notificacion }) {
  if (!notificacion) return null;

  return (
    <div
      className={`fixed top-16 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border transition-all animate-bounce ${
        notificacion.tipo === "exito"
          ? "bg-emerald-950 text-emerald-200 border-emerald-700"
          : notificacion.tipo === "error"
          ? "bg-rose-950 text-rose-200 border-rose-700"
          : "bg-blue-950 text-blue-200 border-blue-700"
      }`}
    >
      {notificacion.tipo === "exito" ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      ) : (
        <AlertCircle className="w-5 h-5 text-rose-400" />
      )}
      {notificacion.mensaje}
    </div>
  );
}
