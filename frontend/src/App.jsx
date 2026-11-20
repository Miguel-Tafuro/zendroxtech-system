import React, { useState, useEffect, useRef } from "react";
import { 
  Laptop, ShoppingCart, DollarSign, PlusCircle, Search, 
  Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, 
  ArrowRightLeft, TrendingUp, ShieldAlert, X, Eye, Tag,
  Trash2, Star, ArrowUp, ArrowDown, Sparkles, Layers, Image as ImageIcon,
  Edit
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

const API_BASE = "/api/admin";

const CATEGORIAS_TIENDA = [
  { id: "ofimatica", label: "💼 Ofimática / Oficina" },
  { id: "estudiantes", label: "🎓 Estudiantes" },
  { id: "programacion", label: "🧑‍💻 Programación" },
  { id: "gaming", label: "🎮 Gaming" },
  { id: "arquitectura", label: "📐 Arquitectura" },
  { id: "diseno", label: "🎨 Diseño & 360°" },
  { id: "apple", label: "🍎 Apple MacBook" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("pos"); // pos | inventario | tesoreria
  const [laptops, setLaptops] = useState([]);
  const [catalogoHardware, setCatalogoHardware] = useState({ marcas: [], lineas: [], modelos: [], procesadores: [], graficas: [], pantallas: [] });
  const [tesoreria, setTesoreria] = useState({
    saldo_total_billeteras: 0,
    capital_trabajo: 0,
    ganancia_acumulada: 0,
    cuentas: []
  });
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  // Filtros de inventario
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroCondicion, setFiltroCondicion] = useState("");

  // Modales
  const [modalLaptopOpen, setModalLaptopOpen] = useState(false);
  const [equipoAEditar, setEquipoAEditar] = useState(null); // null = crear nueva, objeto = editando
  const [modalNuevoModeloOpen, setModalNuevoModeloOpen] = useState(false);
  const [modalNuevaPantallaOpen, setModalNuevaPantallaOpen] = useState(false);
  const [modalMultimediaOpen, setModalMultimediaOpen] = useState(false);
  const [equipoSeleccionadoMedia, setEquipoSeleccionadoMedia] = useState(null);
  const [multimediaLista, setMultimediaLista] = useState([]);
  const [cargandoMedia, setCargandoMedia] = useState(false);
  const [marcarPortadaSubida, setMarcarPortadaSubida] = useState(false);

  // Filtro de marca en el modal de laptop
  const [filtroMarcaModal, setFiltroMarcaModal] = useState("");

  // Formulario nuevo modelo hardware (3FN)
  const [formNuevoModelo, setFormNuevoModelo] = useState({
    nombre_marca: "",
    nombre_linea: "",
    nombre_procesador: "",
    nombre_grafica: "",
    nombre_modelo: ""
  });

  // Formulario nueva pantalla (3FN)
  const [formNuevaPantalla, setFormNuevaPantalla] = useState({
    valor_pulgadas: 15.6,
    nombre_resolucion: "Full HD (1920x1080)",
    ancho_px: 1920,
    alto_px: 1080,
    nombre_tipo_pantalla: "IPS",
    numero_hzs: 60,
    tactil: false
  });

  const [modalScannerOpen, setModalScannerOpen] = useState(false);
  const [modalMovimientoOpen, setModalMovimientoOpen] = useState(false);
  const [tipoMovimientoModal, setTipoMovimientoModal] = useState("reinversion_ganancia");

  // Estado Formulario Nueva Laptop
  const [formLaptop, setFormLaptop] = useState({
    codigo_interno: `ZT-${Math.floor(100 + Math.random() * 900)}`,
    serial_fabricante: "",
    id_modelo: "",
    id_pantalla: "",
    ram_gb: 16,
    ram_detalles: "16 GB DDR4",
    almacenamiento_gb: 512,
    almacenamiento_detalles: "512 GB SSD NVMe M.2",
    condicion: "usado",
    grado_estetico: "Grado A",
    salud_bateria_porcentaje: 95,
    ciclos_bateria: 120,
    detalles_observaciones: "Impecable, cargador original",
    caja: false,
    cargador: true,
    garantia_meses: 3,
    precio_compra: "",
    precio_venta: "",
    precio_oferta: "",
    categorias: "ofimatica",
    ideal_software: ""
  });

  // Estado Formulario Venta (POS)
  const [ventaLaptopId, setVentaLaptopId] = useState("");
  const [formVenta, setFormVenta] = useState({
    nombre_cliente: "",
    cedula_cliente: "",
    telefono_cliente: "",
    correo_cliente: "",
    ubicacion_cliente: "",
    id_cuenta_destino: "",
    metodo_pago_nombre: "Zelle",
    referencia_comprobante: ""
  });
  const [resultadoVenta, setResultadoVenta] = useState(null);

  // Estado Formulario Operaciones Tesorería
  const [formTesoreria, setFormTesoreria] = useState({
    monto: "",
    id_cuenta_origen: "",
    id_cuenta_destino: "",
    afecta_a: "capital",
    concepto: "",
    referencia_pago: ""
  });

  const scannerRef = useRef(null);

  const mostrarNotif = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 5000);
  };

  // Carga inicial de datos
  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [resLaptops, resHard, resTes, resMov] = await Promise.all([
        fetch(`${API_BASE}/laptops`),
        fetch(`${API_BASE}/catalogo-hardware`),
        fetch(`${API_BASE}/tesoreria/balance`),
        fetch(`${API_BASE}/tesoreria/movimientos`)
      ]);
      if (resLaptops.ok) setLaptops(await resLaptops.json());
      if (resHard.ok) setCatalogoHardware(await resHard.json());
      if (resTes.ok) setTesoreria(await resTes.json());
      if (resMov.ok) setMovimientos(await resMov.json());
    } catch (e) {
      mostrarNotif("error", "Error conectando con la API: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTodo();
  }, []);

  // Inicializar escáner QR / Barras
  useEffect(() => {
    if (modalScannerOpen) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      html5QrcodeScanner.render(
        (decodedText) => {
          // Si escanea un SKU
          const match = laptops.find(
            (l) => l.codigo_interno.toLowerCase() === decodedText.toLowerCase() ||
                   (l.serial_fabricante && l.serial_fabricante.toLowerCase() === decodedText.toLowerCase())
          );
          if (match) {
            if (activeTab === "pos") {
              setVentaLaptopId(match.id_equipo);
              mostrarNotif("exito", `Laptop seleccionada: ${match.codigo_interno} (${match.modelo})`);
            } else {
              setBusqueda(decodedText);
            }
          } else {
            setBusqueda(decodedText);
            mostrarNotif("info", `Código escaneado: ${decodedText}`);
          }
          html5QrcodeScanner.clear();
          setModalScannerOpen(false);
        },
        (error) => {}
      );
      scannerRef.current = html5QrcodeScanner;
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [modalScannerOpen]);

  // Manejo de Venta
  const handleRegistrarVenta = async (e) => {
    e.preventDefault();
    if (!ventaLaptopId) return mostrarNotif("error", "Selecciona una laptop para la venta.");
    if (!formVenta.id_cuenta_destino) return mostrarNotif("error", "Selecciona la cuenta receptora del dinero.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ventas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_equipo: parseInt(ventaLaptopId),
          ...formVenta,
          id_cuenta_destino: parseInt(formVenta.id_cuenta_destino)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error registrando la venta");

      setResultadoVenta(data);
      mostrarNotif("exito", `¡Venta procesada con éxito! Orden: ${data.numero_orden}`);
      setVentaLaptopId("");
      setFormVenta({
        nombre_cliente: "",
        cedula_cliente: "",
        telefono_cliente: "",
        correo_cliente: "",
        ubicacion_cliente: "",
        id_cuenta_destino: "",
        metodo_pago_nombre: "Zelle",
        referencia_comprobante: ""
      });
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Creación o Edición de Laptop
  const handleGuardarLaptop = async (e) => {
    e.preventDefault();
    if (!formLaptop.id_modelo) return mostrarNotif("error", "Selecciona el modelo de laptop.");
    if (!formLaptop.id_pantalla) return mostrarNotif("error", "Selecciona las especificaciones de pantalla.");

    setLoading(true);
    try {
      const isEditing = Boolean(equipoAEditar);
      const url = isEditing ? `${API_BASE}/laptops/${equipoAEditar.id_equipo}` : `${API_BASE}/laptops`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formLaptop,
          id_modelo: parseInt(formLaptop.id_modelo),
          id_pantalla: parseInt(formLaptop.id_pantalla),
          precio_compra: parseFloat(formLaptop.precio_compra),
          precio_venta: parseFloat(formLaptop.precio_venta),
          precio_oferta: formLaptop.precio_oferta ? parseFloat(formLaptop.precio_oferta) : null,
          categorias: formLaptop.categorias || "",
          ideal_software: formLaptop.ideal_software || ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error guardando laptop");

      mostrarNotif("exito", isEditing ? `Laptop ${data.codigo_interno} actualizada exitosamente.` : `Laptop ${data.codigo_interno} creada exitosamente.`);
      setModalLaptopOpen(false);
      setEquipoAEditar(null);
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCrearLaptop = () => {
    setEquipoAEditar(null);
    setFormLaptop({
      codigo_interno: `ZT-${Math.floor(100 + Math.random() * 900)}`,
      serial_fabricante: "",
      id_modelo: "",
      id_pantalla: "",
      ram_gb: 16,
      ram_detalles: "16 GB DDR4",
      almacenamiento_gb: 512,
      almacenamiento_detalles: "512 GB SSD NVMe M.2",
      condicion: "usado",
      grado_estetico: "Grado A",
      salud_bateria_porcentaje: 95,
      ciclos_bateria: 120,
      detalles_observaciones: "Impecable, cargador original",
      caja: false,
      cargador: true,
      garantia_meses: 3,
      precio_compra: "",
      precio_venta: "",
      precio_oferta: "",
      categorias: "ofimatica",
      ideal_software: ""
    });
    setModalLaptopOpen(true);
  };

  const abrirModalEditarLaptop = (lap) => {
    setEquipoAEditar(lap);
    setFormLaptop({
      codigo_interno: lap.codigo_interno || "",
      serial_fabricante: lap.serial_fabricante || "",
      id_modelo: lap.id_modelo || "",
      id_pantalla: lap.id_pantalla || "",
      ram_gb: lap.ram_gb || 16,
      ram_detalles: lap.ram_detalles || "",
      almacenamiento_gb: lap.almacenamiento_gb || 512,
      almacenamiento_detalles: lap.almacenamiento_detalles || "",
      condicion: lap.condicion || "usado",
      grado_estetico: lap.grado_estetico || "Grado A",
      salud_bateria_porcentaje: lap.salud_bateria_porcentaje ?? 95,
      ciclos_bateria: lap.ciclos_bateria ?? 120,
      detalles_observaciones: lap.detalles_observaciones || "",
      caja: lap.caja ?? false,
      cargador: lap.cargador ?? true,
      garantia_meses: lap.garantia_meses ?? 3,
      precio_compra: lap.precio_compra || "",
      precio_venta: lap.precio_venta || "",
      precio_oferta: lap.precio_oferta || "",
      categorias: lap.categorias || "",
      ideal_software: lap.ideal_software || ""
    });
    setModalLaptopOpen(true);
  };

  const handleEliminarLaptop = async (lap) => {
    const confirmar = window.confirm(`¿Estás seguro de eliminar el equipo [${lap.codigo_interno}] (${lap.marca} ${lap.modelo}) del inventario?\n\nEsta acción no se puede deshacer.`);
    if (!confirmar) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/laptops/${lap.id_equipo}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error eliminando laptop");

      mostrarNotif("exito", data.message || `Equipo ${lap.codigo_interno} eliminado.`);
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carga de Multimedia de un equipo específico
  const cargarMultimediaEquipo = async (id_equipo) => {
    setCargandoMedia(true);
    try {
      const res = await fetch(`${API_BASE}/laptops/${id_equipo}/multimedia`);
      if (res.ok) {
        const data = await res.json();
        setMultimediaLista(data);
      }
    } catch (e) {
      mostrarNotif("error", "Error cargando multimedia: " + e.message);
    } finally {
      setCargandoMedia(false);
    }
  };

  const abrirModalMultimedia = (equipo) => {
    setEquipoSeleccionadoMedia(equipo);
    setMultimediaLista([]);
    cargarMultimediaEquipo(equipo.id_equipo);
    setModalMultimediaOpen(true);
  };

  // Subir Multimedia sin cerrar el modal
  const handleSubirMultimedia = async (e) => {
    const file = e.target.files[0];
    if (!file || !equipoSeleccionadoMedia) return;

    const formData = new FormData();
    formData.append("archivo", file);
    formData.append("tipo", file.type.startsWith("video/") ? "video" : "foto");
    formData.append("es_portada", marcarPortadaSubida);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/laptops/${equipoSeleccionadoMedia.id_equipo}/multimedia`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error subiendo archivo");

      mostrarNotif("exito", "Archivo multimedia subido correctamente.");
      e.target.value = "";
      setMarcarPortadaSubida(false);
      await cargarMultimediaEquipo(equipoSeleccionadoMedia.id_equipo);
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar Foto/Video de disco y base de datos
  const handleEliminarMultimedia = async (id_multimedia) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta imagen de forma permanente?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/laptops/${equipoSeleccionadoMedia.id_equipo}/multimedia/${id_multimedia}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error eliminando imagen");
      }
      mostrarNotif("exito", "Imagen eliminada con éxito.");
      await cargarMultimediaEquipo(equipoSeleccionadoMedia.id_equipo);
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Marcar como Foto de Portada Principal
  const handleMarcarPortada = async (id_multimedia) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/laptops/${equipoSeleccionadoMedia.id_equipo}/multimedia/${id_multimedia}/portada`, {
        method: "PUT"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error asignando portada");
      }
      mostrarNotif("exito", "Foto establecida como portada principal.");
      await cargarMultimediaEquipo(equipoSeleccionadoMedia.id_equipo);
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reorganizar orden de las fotos
  const handleMoverMultimedia = async (id_multimedia, direccion) => {
    try {
      const res = await fetch(`${API_BASE}/laptops/${equipoSeleccionadoMedia.id_equipo}/multimedia/${id_multimedia}/mover?direccion=${direccion}`, {
        method: "PUT"
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error reordenando imagen");
      }
      await cargarMultimediaEquipo(equipoSeleccionadoMedia.id_equipo);
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    }
  };

  // Crear Nuevo Modelo de Hardware en 3FN
  const handleCrearNuevoModelo = async (e) => {
    e.preventDefault();
    if (!formNuevoModelo.nombre_marca.trim() || !formNuevoModelo.nombre_linea.trim() || !formNuevoModelo.nombre_procesador.trim() || !formNuevoModelo.nombre_modelo.trim()) {
      return mostrarNotif("error", "Por favor completa Marca, Línea, Procesador y Nombre del Modelo.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/catalogo-hardware/modelo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_modelo: formNuevoModelo.nombre_modelo.trim(),
          nombre_marca: formNuevoModelo.nombre_marca.trim(),
          nombre_linea: formNuevoModelo.nombre_linea.trim(),
          nombre_procesador: formNuevoModelo.nombre_procesador.trim(),
          nombre_grafica: formNuevoModelo.nombre_grafica.trim() || null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error creando modelo de hardware");

      mostrarNotif("exito", `¡Modelo "${data.nombre}" registrado en catálogo!`);
      
      // Recargar catálogo de hardware
      const resHard = await fetch(`${API_BASE}/catalogo-hardware`);
      if (resHard.ok) {
        const dataHard = await resHard.json();
        setCatalogoHardware(dataHard);
      }

      // Preseleccionar el nuevo modelo en formLaptop
      setFormLaptop((prev) => ({ ...prev, id_modelo: data.id_modelo }));

      // Cerrar modal de nuevo modelo y resetear
      setModalNuevoModeloOpen(false);
      setFormNuevoModelo({
        nombre_marca: "",
        nombre_linea: "",
        nombre_procesador: "",
        nombre_grafica: "",
        nombre_modelo: ""
      });
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Crear Nueva Pantalla en 3FN
  const handleCrearNuevaPantalla = async (e) => {
    e.preventDefault();
    if (!formNuevaPantalla.valor_pulgadas || !formNuevaPantalla.nombre_resolucion) {
      return mostrarNotif("error", "Por favor completa las especificaciones de la pantalla.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/catalogo-hardware/pantalla`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor_pulgadas: parseFloat(formNuevaPantalla.valor_pulgadas),
          nombre_resolucion: formNuevaPantalla.nombre_resolucion.trim(),
          ancho_px: parseInt(formNuevaPantalla.ancho_px) || 1920,
          alto_px: parseInt(formNuevaPantalla.alto_px) || 1080,
          nombre_tipo_pantalla: formNuevaPantalla.nombre_tipo_pantalla.trim().toUpperCase(),
          numero_hzs: parseInt(formNuevaPantalla.numero_hzs) || 60,
          tactil: Boolean(formNuevaPantalla.tactil)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error creando pantalla");

      mostrarNotif("exito", `¡Pantalla registrada: ${data.descripcion}!`);

      // Recargar catálogo de hardware
      const resHard = await fetch(`${API_BASE}/catalogo-hardware`);
      if (resHard.ok) {
        const dataHard = await resHard.json();
        setCatalogoHardware(dataHard);
      }

      // Preseleccionar en formLaptop
      setFormLaptop((prev) => ({ ...prev, id_pantalla: data.id_pantalla }));

      // Cerrar modal
      setModalNuevaPantallaOpen(false);
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Movimientos de Tesorería
  const handleMovimientoTesoreria = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tesoreria/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_movimiento: tipoMovimientoModal,
          monto: parseFloat(formTesoreria.monto),
          id_cuenta_origen: formTesoreria.id_cuenta_origen ? parseInt(formTesoreria.id_cuenta_origen) : null,
          id_cuenta_destino: formTesoreria.id_cuenta_destino ? parseInt(formTesoreria.id_cuenta_destino) : null,
          afecta_a: formTesoreria.afecta_a,
          concepto: formTesoreria.concepto,
          referencia_pago: formTesoreria.referencia_pago
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error registrando movimiento");

      mostrarNotif("exito", "Operación registrada en el libro diario.");
      setModalMovimientoOpen(false);
      setFormTesoreria({ monto: "", id_cuenta_origen: "", id_cuenta_destino: "", afecta_a: "capital", concepto: "", referencia_pago: "" });
      cargarTodo();
    } catch (err) {
      mostrarNotif("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtro de laptops disponibles para POS
  const laptopsDisponibles = laptops.filter((l) => l.estado === "disponible");

  const laptopsFiltradas = laptops.filter((l) => {
    const matchBusq = !busqueda || 
      l.codigo_interno.toLowerCase().includes(busqueda.toLowerCase()) ||
      (l.serial_fabricante && l.serial_fabricante.toLowerCase().includes(busqueda.toLowerCase())) ||
      l.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      l.marca.toLowerCase().includes(busqueda.toLowerCase());
    const matchEst = !filtroEstado || l.estado === filtroEstado;
    const matchCond = !filtroCondicion || l.condicion === filtroCondicion;
    return matchBusq && matchEst && matchCond;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 md:pb-6">
      {/* HEADER SUPERIOR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-indigo-500/30 shadow-md">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
              ZendroxTech VE
            </h1>
            <p className="text-xs text-slate-400">Inventario, POS n8n & Tesorería</p>
          </div>
        </div>

        {/* Acciones Rápidas Header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalScannerOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition"
          >
            <Camera className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Escanear SKU</span>
          </button>
          <button
            onClick={cargarTodo}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </header>

      {/* NOTIFICACIONES TOAST */}
      {notificacion && (
        <div
          className={`fixed top-16 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border transition-all animate-bounce ${
            notificacion.tipo === "exito"
              ? "bg-emerald-950 text-emerald-200 border-emerald-700"
              : notificacion.tipo === "error"
              ? "bg-rose-950 text-rose-200 border-rose-700"
              : "bg-blue-950 text-blue-200 border-blue-700"
          }`}
        >
          {notificacion.tipo === "exito" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
          {notificacion.mensaje}
        </div>
      )}

      {/* BARRA DE NAVEGACIÓN DESKTOP */}
      <nav className="hidden md:flex bg-slate-900/60 border-b border-slate-800/80 px-6 py-2 gap-2">
        <button
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "pos" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Punto de Venta (POS & n8n)
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "inventario" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Laptop className="w-4 h-4" /> Inventario de Laptops ({laptops.length})
        </button>
        <button
          onClick={() => setActiveTab("tesoreria")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === "tesoreria" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Tesorería & Libro Diario
        </button>
      </nav>

      {/* CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ============================================================== */}
        {/* PESTAÑA 1: PUNTO DE VENTA (POS) & WEBHOOK N8N                  */}
        {/* ============================================================== */}
        {activeTab === "pos" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario de Venta */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-bold text-base text-white">Venta Rápida y Nota de Entrega</h2>
                </div>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30">
                  {laptopsDisponibles.length} Laptops Disponibles
                </span>
              </div>

              <form onSubmit={handleRegistrarVenta} className="space-y-4">
                {/* Selector de Laptop */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    1. Selecciona la Laptop a Vender *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={ventaLaptopId}
                      onChange={(e) => setVentaLaptopId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Elige una laptop de la lista --</option>
                      {laptopsDisponibles.map((lap) => (
                        <option key={lap.id_equipo} value={lap.id_equipo}>
                          [{lap.codigo_interno}] {lap.marca} {lap.modelo} - ${lap.precio_venta} ({lap.condicion})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setModalScannerOpen(true)}
                      className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300"
                      title="Escanear con cámara"
                    >
                      <Camera className="w-5 h-5 text-indigo-400" />
                    </button>
                  </div>
                </div>

                {/* Datos del Cliente (10 variables para n8n) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="Ej: Miguel Angel Perez"
                      value={formVenta.nombre_cliente}
                      onChange={(e) => setFormVenta({ ...formVenta, nombre_cliente: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Cédula / RIF *</label>
                    <input
                      type="text"
                      placeholder="Ej: V-25123456"
                      value={formVenta.cedula_cliente}
                      onChange={(e) => setFormVenta({ ...formVenta, cedula_cliente: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono WhatsApp *</label>
                    <input
                      type="text"
                      placeholder="Ej: 04121234567"
                      value={formVenta.telefono_cliente}
                      onChange={(e) => setFormVenta({ ...formVenta, telefono_cliente: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      placeholder="cliente@gmail.com"
                      value={formVenta.correo_cliente}
                      onChange={(e) => setFormVenta({ ...formVenta, correo_cliente: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Ubicación / Dirección de Entrega *</label>
                    <input
                      type="text"
                      placeholder="Ej: Caracas, Los Cortijos, Av. Principal"
                      value={formVenta.ubicacion_cliente}
                      onChange={(e) => setFormVenta({ ...formVenta, ubicacion_cliente: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Cuenta Receptora y Método de Pago */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Cuenta Receptora de Fondos *</label>
                    <select
                      value={formVenta.id_cuenta_destino}
                      onChange={(e) => {
                        const id = e.target.value;
                        const cuentaObj = tesoreria.cuentas.find((c) => c.id_cuenta === parseInt(id));
                        setFormVenta({
                          ...formVenta,
                          id_cuenta_destino: id,
                          metodo_pago_nombre: cuentaObj ? cuentaObj.nombre : "Zelle"
                        });
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">-- Elige cuenta bancaria / wallet --</option>
                      {tesoreria.cuentas.map((c) => (
                        <option key={c.id_cuenta} value={c.id_cuenta}>
                          {c.nombre} (${c.saldo_actual.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Referencia / Comprobante</label>
                    <input
                      type="text"
                      placeholder="Ej: #Ref 987410"
                      value={formVenta.referencia_comprobante}
                      onChange={(e) => setFormVenta({ ...formVenta, referencia_comprobante: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Botón Acción Principal */}
                <button
                  type="submit"
                  disabled={loading || !ventaLaptopId}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmar Venta y Disparar Nota a n8n</span>
                </button>
              </form>
            </div>

            {/* Panel Lateral: Vista Previa y Confirmación */}
            <div className="lg:col-span-5 space-y-5">
              {resultadoVenta ? (
                <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-6 h-6" />
                    <h3 className="font-bold text-lg">¡Venta Procesada!</h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    Orden: <span className="font-mono text-emerald-300">{resultadoVenta.numero_orden}</span>
                  </p>
                  
                  {/* Desglose de Doble Impacto */}
                  <div className="bg-slate-900/80 rounded-xl p-3 space-y-2 border border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Total Cobrado:</span>
                      <span className="text-white font-bold text-sm">${resultadoVenta.desglose.precio_venta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-blue-400">
                      <span>Retorno Capital (Costo):</span>
                      <span className="font-semibold">+${resultadoVenta.desglose.capital_recuperado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Ganancia Líquida:</span>
                      <span className="font-semibold">+${resultadoVenta.desglose.ganancia_neta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1.5">
                      <span>Cuenta Receptora:</span>
                      <span className="font-semibold">{resultadoVenta.desglose.cuenta_receptora}</span>
                    </div>
                  </div>

                  {/* Estado Webhook n8n */}
                  <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                    resultadoVenta.webhook_n8n.enviado 
                      ? "bg-emerald-900/30 text-emerald-300 border-emerald-800" 
                      : "bg-amber-900/30 text-amber-300 border-amber-800"
                  }`}>
                    <span>Webhook n8n:</span>
                    <span className="font-bold">
                      {resultadoVenta.webhook_n8n.enviado ? "ENVIADO CON ÉXITO" : "PENDIENTE (Revisar n8n)"}
                    </span>
                  </div>

                  <button
                    onClick={() => setResultadoVenta(null)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    Nueva Venta
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-sm text-slate-200">¿Cómo funciona la venta automática?</h3>
                  <ul className="text-xs text-slate-400 space-y-2.5">
                    <li className="flex items-start gap-2">
                      <span className="bg-indigo-600/30 text-indigo-400 p-1 rounded font-bold">1</span>
                      <span>El equipo seleccionado cambia inmediatamente a <strong>'vendido'</strong> y se oculta de la Landing Page pública.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-indigo-600/30 text-indigo-400 p-1 rounded font-bold">2</span>
                      <span>Se genera el asiento contable separando <strong>Capital</strong> (recuperación de costo) y <strong>Ganancia</strong> en el libro diario.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-indigo-600/30 text-indigo-400 p-1 rounded font-bold">3</span>
                      <span>La app envía las 10 variables exactas por Webhook a <strong>n8n</strong> para generar el PDF y enviarlo por Telegram.</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: INVENTARIO DE LAPTOPS & MULTIMEDIA                  */}
        {/* ============================================================== */}
        {activeTab === "inventario" && (
          <div className="space-y-5">
            {/* Barra de Filtros y Botón Nuevo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-lg">
              <div className="flex flex-1 flex-wrap gap-2 w-full md:w-auto">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por SKU, serial, modelo, marca..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                >
                  <option value="">Todos los Estados</option>
                  <option value="disponible">Disponibles</option>
                  <option value="vendido">Vendidos</option>
                  <option value="reservado">Reservados</option>
                </select>
                <select
                  value={filtroCondicion}
                  onChange={(e) => setFiltroCondicion(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                >
                  <option value="">Todas las Condiciones</option>
                  <option value="nuevo">Nuevo</option>
                  <option value="exhibicion">Exhibición (Open Box)</option>
                  <option value="usado">Usado</option>
                </select>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setModalScannerOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-indigo-400" /> Escanear
                </button>
                <button
                  onClick={() => abrirModalCrearLaptop()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                >
                  <PlusCircle className="w-4 h-4" /> Agregar Laptop
                </button>
              </div>
            </div>

            {/* Listado de Laptops */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {laptopsFiltradas.map((lap) => (
                <div
                  key={lap.id_equipo}
                  className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between transition hover:border-slate-600 shadow-md ${
                    lap.estado === "disponible" ? "border-slate-800" : "border-slate-800 opacity-60"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold bg-slate-800 text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-700">
                        {lap.codigo_interno}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          lap.estado === "disponible"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {lap.estado.toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white line-clamp-1">{lap.marca} {lap.modelo}</h3>
                      <p className="text-xs text-slate-400">{lap.cpu} • {lap.ram_gb}GB • {lap.almacenamiento_detalles || `${lap.almacenamiento_gb}GB`}</p>
                    </div>

                    {/* Precios y Condición */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-400">Venta: </span>
                        <span className="text-emerald-400 font-bold text-sm">${lap.precio_venta.toFixed(2)}</span>
                        <span className="text-slate-500 text-[10px] ml-1">(Costo: ${lap.precio_compra.toFixed(2)})</span>
                      </div>
                      <span className="text-slate-300 font-medium capitalize bg-slate-800 px-2 py-0.5 rounded">
                        {lap.condicion}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="flex items-center gap-1.5 pt-4 mt-3 border-t border-slate-800">
                    <button
                      onClick={() => abrirModalMultimedia(lap)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition"
                      title="Administrar Fotos y Videos"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Fotos ({lap.imagenes?.length || 0})</span>
                    </button>
                    <button
                      onClick={() => abrirModalEditarLaptop(lap)}
                      className="bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 text-indigo-300 border border-slate-700 p-2 rounded-lg transition"
                      title="Editar especificaciones y precios"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {lap.estado === "disponible" && (
                      <button
                        onClick={() => handleEliminarLaptop(lap)}
                        className="bg-slate-800 hover:bg-rose-600/30 hover:border-rose-500/50 text-rose-400 border border-slate-700 p-2 rounded-lg transition"
                        title="Eliminar laptop del inventario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {lap.estado === "disponible" && (
                      <button
                        onClick={() => {
                          setVentaLaptopId(lap.id_equipo);
                          setActiveTab("pos");
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition shrink-0"
                        title="Vender en POS"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Vender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: TESORERÍA, BILLETERAS & LIBRO DIARIO                */}
        {/* ============================================================== */}
        {activeTab === "tesoreria" && (
          <div className="space-y-6">
            {/* Ecuación Patrimonial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase">Saldo Total Billeteras</span>
                <p className="text-2xl font-black text-white mt-1">
                  ${tesoreria.saldo_total_billeteras.toFixed(2)}
                </p>
                <span className="text-[11px] text-slate-500">Liquidez disponible en cuentas</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-xs font-semibold text-blue-400 uppercase">Capital de Trabajo</span>
                <p className="text-2xl font-black text-blue-300 mt-1">
                  ${tesoreria.capital_trabajo.toFixed(2)}
                </p>
                <span className="text-[11px] text-slate-500">Fondo para reponer laptops</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
                <span className="text-xs font-semibold text-emerald-400 uppercase">Ganancia Acumulada</span>
                <p className="text-2xl font-black text-emerald-300 mt-1">
                  ${tesoreria.ganancia_acumulada.toFixed(2)}
                </p>
                <span className="text-[11px] text-slate-500">Utilidad neta disponible</span>
              </div>
            </div>

            {/* Billeteras y Acciones Rápidas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cuentas / Billeteras */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white">Billeteras Activas</h3>
                  <span className="text-xs text-slate-400">{tesoreria.cuentas.length} cuentas registradas</span>
                </div>
                <div className="space-y-2">
                  {tesoreria.cuentas.map((c) => (
                    <div
                      key={c.id_cuenta}
                      className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/60"
                    >
                      <span className="text-sm font-semibold text-slate-200">{c.nombre}</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">${c.saldo_actual.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Operaciones Financieras */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-sm text-white">Operaciones de Libro Diario</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setTipoMovimientoModal("reinversion_ganancia");
                      setModalMovimientoOpen(true);
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-400 mb-1" />
                    <p className="text-xs font-bold text-white">Reinversión</p>
                    <p className="text-[10px] text-slate-400">Ganancia $\rightarrow$ Capital</p>
                  </button>
                  <button
                    onClick={() => {
                      setTipoMovimientoModal("retiro_ganancia");
                      setModalMovimientoOpen(true);
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400 mb-1" />
                    <p className="text-xs font-bold text-white">Retiro de Ganancias</p>
                    <p className="text-[10px] text-slate-400">Retiro personal del dueño</p>
                  </button>
                  <button
                    onClick={() => {
                      setTipoMovimientoModal("gasto_operativo");
                      setModalMovimientoOpen(true);
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
                  >
                    <Tag className="w-4 h-4 text-amber-400 mb-1" />
                    <p className="text-xs font-bold text-white">Gasto Operativo</p>
                    <p className="text-[10px] text-slate-400">Flete, delivery, empaque</p>
                  </button>
                  <button
                    onClick={() => {
                      setTipoMovimientoModal("transferencia_cuentas");
                      setModalMovimientoOpen(true);
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-left transition"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-purple-400 mb-1" />
                    <p className="text-xs font-bold text-white">Transferencia</p>
                    <p className="text-[10px] text-slate-400">Mover entre cuentas</p>
                  </button>
                </div>
              </div>
            </div>

            {/* Libro Diario (Últimas Transacciones) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-white">Historial de Libro Diario</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Fecha</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Concepto</th>
                      <th className="p-2.5">Monto Total</th>
                      <th className="p-2.5 text-blue-400">Imp. Capital</th>
                      <th className="p-2.5 text-emerald-400">Imp. Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {movimientos.map((m) => (
                      <tr key={m.id_transaccion} className="hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400">{new Date(m.fecha).toLocaleDateString()}</td>
                        <td className="p-2.5 font-semibold text-slate-300">{m.tipo_movimiento}</td>
                        <td className="p-2.5 text-slate-200">{m.concepto}</td>
                        <td className="p-2.5 font-bold text-white">${m.monto_total.toFixed(2)}</td>
                        <td className={`p-2.5 font-semibold ${m.impacto_capital >= 0 ? "text-blue-400" : "text-rose-400"}`}>
                          {m.impacto_capital !== 0 ? `${m.impacto_capital > 0 ? "+" : ""}$${m.impacto_capital.toFixed(2)}` : "-"}
                        </td>
                        <td className={`p-2.5 font-semibold ${m.impacto_ganancia >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {m.impacto_ganancia !== 0 ? `${m.impacto_ganancia > 0 ? "+" : ""}$${m.impacto_ganancia.toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* MODAL: REGISTRAR O EDITAR LAPTOP                               */}
      {/* ============================================================== */}
      {modalLaptopOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white">
                {equipoAEditar ? `Editar Laptop [${equipoAEditar.codigo_interno}]` : "Agregar Laptop al Inventario"}
              </h3>
              <button onClick={() => setModalLaptopOpen(false)} className="text-slate-400 hover:text-white">
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
                    onClick={() => {
                      setFormNuevoModelo((prev) => ({ ...prev, nombre_marca: filtroMarcaModal || "" }));
                      setModalNuevoModeloOpen(true);
                    }}
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
                    onClick={() => setModalNuevaPantallaOpen(true)}
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

              {/* RAM y Disco Duro con ancho adaptable responsive */}
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
                  {CATEGORIAS_TIENDA.map((cat) => {
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

              {/* Software / Usos ideales (Texto personalizado para landing) */}
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
                {loading ? "Guardando..." : (equipoAEditar ? "Guardar Cambios" : "Guardar Laptop en Inventario")}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SUBIR MULTIMEDIA (FOTOS / VIDEOS)                        */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* MODAL: GESTOR INTERACTIVO DE MULTIMEDIA (FOTOS / VIDEOS)       */}
      {/* ============================================================== */}
      {modalMultimediaOpen && equipoSeleccionadoMedia && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 max-h-[92vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-indigo-400" />
                  Galería Multimedia del Equipo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  SKU: <span className="text-indigo-300 font-bold font-mono">[{equipoSeleccionadoMedia.codigo_interno}]</span> {equipoSeleccionadoMedia.marca} {equipoSeleccionadoMedia.modelo}
                </p>
              </div>
              <button onClick={() => setModalMultimediaOpen(false)} className="text-slate-400 hover:text-white p-1">
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
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80"; }}
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
      )}

      {/* ============================================================== */}
      {/* MODAL: CREAR NUEVO MODELO DE HARDWARE (3FN)                    */}
      {/* ============================================================== */}
      {modalNuevoModeloOpen && (() => {
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
                    Estructura 3FN Relacional: Marca $\rightarrow$ Línea $\rightarrow$ Modelo
                  </p>
                </div>
                <button onClick={() => setModalNuevoModeloOpen(false)} className="text-slate-400 hover:text-white p-1">
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
                      value={catalogoHardware.marcas.some(m => m.nombre.toLowerCase() === formNuevoModelo.nombre_marca.toLowerCase()) ? formNuevoModelo.nombre_marca : (formNuevoModelo.nombre_marca ? "__OTRA__" : "")}
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

                    {(!catalogoHardware.marcas.some(m => m.nombre.toLowerCase() === formNuevoModelo.nombre_marca.toLowerCase()) || formNuevoModelo.nombre_marca === "") && (
                      <input
                        type="text"
                        placeholder="Nombre de la nueva marca..."
                        value={formNuevoModelo.nombre_marca}
                        onChange={(e) => setFormNuevoModelo({ ...formNuevoModelo, nombre_marca: e.target.value, nombre_linea: "" })}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                        required
                      />
                    )}
                  </div>
                </div>

                {/* 2. Línea / Serie (Filtrada estrictamente por la marca elegida) */}
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
                    placeholder={formNuevoModelo.nombre_marca ? `Ej: Envy, Victus, Pavilion...` : `Primero selecciona una marca`}
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

                  {/* Chips con las líneas de esa marca */}
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
                    3. Procesador (CPU) * <span className="text-slate-500 font-normal">(Ej: AMD Ryzen 5 8640HS, Intel Core i7-13700H)</span>
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
                    4. Gráfica Dedicada (GPU) <span className="text-slate-500 font-normal">(Opcional: Si usa integrados, dejar vacío)</span>
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
                    Vinculará <code className="text-indigo-200">{formNuevoModelo.nombre_marca || "Marca"}</code> $\rightarrow$ <code className="text-indigo-200">{formNuevoModelo.nombre_linea || "Línea"}</code> $\rightarrow$ <code className="text-indigo-200">{formNuevoModelo.nombre_modelo || "Modelo"}</code> garantizando que las líneas de una marca nunca se mezclen con otras.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalNuevoModeloOpen(false)}
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
      })()}

      {/* ============================================================== */}
      {/* MODAL: CREAR NUEVA PANTALLA (3FN)                              */}
      {/* ============================================================== */}
      {modalNuevaPantallaOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-indigo-400" />
                  Crear Nueva Pantalla (3FN)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Componentes: Pulgadas $\rightarrow$ Resolución $\rightarrow$ Panel $\rightarrow$ Hz $\rightarrow$ Táctil
                </p>
              </div>
              <button onClick={() => setModalNuevaPantallaOpen(false)} className="text-slate-400 hover:text-white p-1">
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
                  Vista previa: <strong>{formNuevaPantalla.valor_pulgadas}" {formNuevaPantalla.nombre_resolucion} {formNuevaPantalla.nombre_tipo_pantalla} {formNuevaPantalla.numero_hzs}Hz {formNuevaPantalla.tactil ? "(Táctil)" : ""}</strong>
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNuevaPantallaOpen(false)}
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
      )}

      {/* ============================================================== */}
      {/* MODAL: ESCÁNER QR / CÓDIGO DE BARRAS                           */}
      {/* ============================================================== */}
      {modalScannerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">Escanear Código SKU / Serial</h3>
              <button onClick={() => setModalScannerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div id="qr-reader" className="w-full overflow-hidden rounded-xl bg-slate-950"></div>
            <p className="text-[11px] text-slate-400 text-center">Apunta la cámara a la etiqueta de la laptop</p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: OPERACIONES DE TESORERÍA                                */}
      {/* ============================================================== */}
      {modalMovimientoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white capitalize">{tipoMovimientoModal.replace("_", " ")}</h3>
              <button onClick={() => setModalMovimientoOpen(false)} className="text-slate-400 hover:text-white">
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

              {(tipoMovimientoModal === "retiro_ganancia" || tipoMovimientoModal === "gasto_operativo" || tipoMovimientoModal === "transferencia_cuentas") && (
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
      )}

      {/* BARRA INFERIOR MÓVIL (TIPO APP NATIVA) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex justify-around py-2 z-40">
        <button
          onClick={() => setActiveTab("pos")}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg ${
            activeTab === "pos" ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Venta POS</span>
        </button>
        <button
          onClick={() => setActiveTab("inventario")}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg ${
            activeTab === "inventario" ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <Laptop className="w-5 h-5" />
          <span>Inventario</span>
        </button>
        <button
          onClick={() => setActiveTab("tesoreria")}
          className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1 px-3 rounded-lg ${
            activeTab === "tesoreria" ? "text-indigo-400" : "text-slate-400"
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span>Tesorería</span>
        </button>
      </nav>
    </div>
  );
}
