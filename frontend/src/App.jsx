import React, { useState, useEffect, useRef } from "react";
import { 
  Laptop, ShoppingCart, DollarSign, PlusCircle, Search, 
  Camera, Upload, CheckCircle2, AlertCircle, RefreshCw, 
  ArrowRightLeft, TrendingUp, ShieldAlert, X, Eye, Tag,
  Trash2, Star, ArrowUp, ArrowDown, Sparkles, Layers, Image as ImageIcon,
  Edit
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import NotificationToast from "./components/common/NotificationToast.jsx";
import QrScannerModal from "./components/common/QrScannerModal.jsx";
import ModalLaptopForm from "./components/inventory/ModalLaptopForm.jsx";
import ModalNuevoModelo from "./components/inventory/ModalNuevoModelo.jsx";
import ModalNuevaPantalla from "./components/inventory/ModalNuevaPantalla.jsx";
import ModalMultimedia from "./components/media/ModalMultimedia.jsx";
import ModalMovimientoTesoreria from "./components/treasury/ModalMovimientoTesoreria.jsx";

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
      <NotificationToast notificacion={notificacion} />

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
      {/* MODAL: REGISTRAR O EDITAR LAPTOP */}
      <ModalLaptopForm
        isOpen={modalLaptopOpen}
        onClose={() => setModalLaptopOpen(false)}
        equipoAEditar={equipoAEditar}
        formLaptop={formLaptop}
        setFormLaptop={setFormLaptop}
        handleGuardarLaptop={handleGuardarLaptop}
        loading={loading}
        catalogoHardware={catalogoHardware}
        filtroMarcaModal={filtroMarcaModal}
        setFiltroMarcaModal={setFiltroMarcaModal}
        categoriasTienda={CATEGORIAS_TIENDA}
        onOpenNuevoModelo={() => {
          setFormNuevoModelo((prev) => ({ ...prev, nombre_marca: filtroMarcaModal || "" }));
          setModalNuevoModeloOpen(true);
        }}
        onOpenNuevaPantalla={() => setModalNuevaPantallaOpen(true)}
      />

      {/* MODAL: GESTOR INTERACTIVO DE MULTIMEDIA (FOTOS / VIDEOS) */}
      <ModalMultimedia
        isOpen={modalMultimediaOpen}
        onClose={() => setModalMultimediaOpen(false)}
        equipoSeleccionadoMedia={equipoSeleccionadoMedia}
        cargandoMedia={cargandoMedia}
        multimediaLista={multimediaLista}
        handleMoverMultimedia={handleMoverMultimedia}
        handleMarcarPortada={handleMarcarPortada}
        handleEliminarMultimedia={handleEliminarMultimedia}
        handleSubirMultimedia={handleSubirMultimedia}
        loading={loading}
        marcarPortadaSubida={marcarPortadaSubida}
        setMarcarPortadaSubida={setMarcarPortadaSubida}
      />


      {/* MODAL: CREAR NUEVO MODELO DE HARDWARE (3FN) */}
      <ModalNuevoModelo
        isOpen={modalNuevoModeloOpen}
        onClose={() => setModalNuevoModeloOpen(false)}
        formNuevoModelo={formNuevoModelo}
        setFormNuevoModelo={setFormNuevoModelo}
        catalogoHardware={catalogoHardware}
        handleCrearNuevoModelo={handleCrearNuevoModelo}
        loading={loading}
      />

      {/* MODAL: CREAR NUEVA PANTALLA (3FN) */}
      <ModalNuevaPantalla
        isOpen={modalNuevaPantallaOpen}
        onClose={() => setModalNuevaPantallaOpen(false)}
        formNuevaPantalla={formNuevaPantalla}
        setFormNuevaPantalla={setFormNuevaPantalla}
        handleCrearNuevaPantalla={handleCrearNuevaPantalla}
        loading={loading}
      />

      {/* MODAL: ESCÁNER QR / CÓDIGO DE BARRAS */}
      <QrScannerModal
        isOpen={modalScannerOpen}
        onClose={() => setModalScannerOpen(false)}
      />

      {/* MODAL: OPERACIONES DE TESORERÍA */}
      <ModalMovimientoTesoreria
        isOpen={modalMovimientoOpen}
        onClose={() => setModalMovimientoOpen(false)}
        tipoMovimientoModal={tipoMovimientoModal}
        formTesoreria={formTesoreria}
        setFormTesoreria={setFormTesoreria}
        tesoreria={tesoreria}
        handleMovimientoTesoreria={handleMovimientoTesoreria}
        loading={loading}
      />


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
