from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# -----------------------------------------------------------------------------
# 1. ESQUEMAS DE HARDWARE Y CATÁLOGOS
# -----------------------------------------------------------------------------

class MarcaSchema(BaseModel):
    id_marca: int
    nombre_marca: str
    class Config:
        from_attributes = True

class LineaSchema(BaseModel):
    id_linea: int
    id_marca: int
    nombre_linea: str
    class Config:
        from_attributes = True

class ProcesadorSchema(BaseModel):
    id_procesador: int
    nombre_procesador: str
    grafica_integrada: Optional[str] = None
    class Config:
        from_attributes = True

class GraficaDedicadaSchema(BaseModel):
    id_grafica_dedicada: int
    nombre_grafica_dedicada: str
    class Config:
        from_attributes = True

class ModeloCreateSchema(BaseModel):
    nombre_modelo: str
    nombre_marca: str
    nombre_linea: str
    nombre_procesador: str
    nombre_grafica: Optional[str] = None

class PantallaCreateSchema(BaseModel):
    valor_pulgadas: float
    nombre_resolucion: str
    ancho_px: Optional[int] = 1920
    alto_px: Optional[int] = 1080
    nombre_tipo_pantalla: str = "IPS"
    numero_hzs: int = 60
    tactil: bool = False

class PantallaInfoSchema(BaseModel):
    id_pantalla: int
    pulgadas: float
    resolucion: str
    hzs: int
    tipo: str
    tactil: bool
    class Config:
        from_attributes = True

# -----------------------------------------------------------------------------
# 2. ESQUEMAS DE INVENTARIO (EQUIPOS)
# -----------------------------------------------------------------------------

class MultimediaSchema(BaseModel):
    id_multimedia: int
    url: str
    tipo: str
    es_portada: bool
    orden: int
    class Config:
        from_attributes = True

class EquipoCreate(BaseModel):
    codigo_interno: str
    serial_fabricante: Optional[str] = None
    id_modelo: int
    id_pantalla: int
    ram_gb: int
    ram_detalles: Optional[str] = None
    almacenamiento_gb: int
    almacenamiento_detalles: Optional[str] = None
    condicion: str # 'nuevo', 'exhibicion', 'usado'
    grado_estetico: Optional[str] = None
    salud_bateria_porcentaje: Optional[int] = None
    ciclos_bateria: Optional[int] = None
    detalles_observaciones: Optional[str] = None
    caja: bool = False
    cargador: bool = True
    garantia_meses: int = 3
    precio_compra: float
    precio_venta: float
    precio_oferta: Optional[float] = None
    categorias: Optional[str] = None
    ideal_software: Optional[str] = None

class EquipoUpdate(BaseModel):
    codigo_interno: Optional[str] = None
    serial_fabricante: Optional[str] = None
    id_modelo: Optional[int] = None
    id_pantalla: Optional[int] = None
    ram_gb: Optional[int] = None
    ram_detalles: Optional[str] = None
    almacenamiento_gb: Optional[int] = None
    almacenamiento_detalles: Optional[str] = None
    condicion: Optional[str] = None
    grado_estetico: Optional[str] = None
    salud_bateria_porcentaje: Optional[int] = None
    ciclos_bateria: Optional[int] = None
    detalles_observaciones: Optional[str] = None
    caja: Optional[bool] = None
    cargador: Optional[bool] = None
    garantia_meses: Optional[int] = None
    precio_compra: Optional[float] = None
    precio_venta: Optional[float] = None
    precio_oferta: Optional[float] = None
    estado: Optional[str] = None
    categorias: Optional[str] = None
    ideal_software: Optional[str] = None

class EquipoResponse(BaseModel):
    id_equipo: int
    codigo_interno: str
    serial_fabricante: Optional[str]
    id_modelo: Optional[int] = None
    id_pantalla: Optional[int] = None
    marca: str
    linea: str
    modelo: str
    cpu: str
    gpu: str
    pantalla_desc: str
    ram_gb: int
    ram_detalles: Optional[str]
    almacenamiento_gb: int
    almacenamiento_detalles: Optional[str]
    condicion: str
    grado_estetico: Optional[str]
    salud_bateria_porcentaje: Optional[int]
    ciclos_bateria: Optional[int]
    detalles_observaciones: Optional[str]
    caja: bool
    cargador: bool
    garantia_meses: int
    precio_compra: float
    precio_venta: float
    precio_oferta: Optional[float]
    estado: str
    fecha_ingreso: datetime
    imagenes: List[str] = []
    categorias: Optional[str] = None
    ideal_software: Optional[str] = None

    class Config:
        from_attributes = True

# Esquema idéntico al objeto productsDB de la Landing Page
class PublicLaptopCatalogSchema(BaseModel):
    id: str
    sku: str
    brand: str
    name: str
    price: float
    oldPrice: Optional[float] = None
    condition: str
    warranty: str
    ram: int
    ramText: str
    storage: str
    cpu: str
    gpu: str
    screen: str
    extra: str
    categories: List[str] = []
    idealSoftware: str = ""
    rating: float = 5.0
    reviews: int = 18
    badge: str = "⭐ CERTIFICADA"
    image: str = ""
    images: List[str] = []
    status: str = "disponible"

# -----------------------------------------------------------------------------
# 3. ESQUEMAS DE CLIENTE, VENTA Y N8N
# -----------------------------------------------------------------------------

class VentaCreate(BaseModel):
    id_equipo: int
    nombre_cliente: str
    cedula_cliente: str
    telefono_cliente: str
    correo_cliente: Optional[str] = ""
    ubicacion_cliente: str
    id_cuenta_destino: int
    metodo_pago_nombre: str
    referencia_comprobante: Optional[str] = None

class VentaResponse(BaseModel):
    id_venta: int
    numero_orden: str
    nombre_cliente: str
    cedula_cliente: str
    laptop_vendida: str
    precio_venta: float
    costo_equipo: float
    ganancia_neta: float
    metodo_pago: str
    cuenta_receptora: str
    fecha_venta: datetime
    n8n_procesado: bool

# Payload que se envía a n8n
class N8nPayload(BaseModel):
    nombre_cliente: str
    telefono_cliente: str
    cedula_cliente: str
    ubicacion: str
    metodo_pago: str
    correo: str
    precio: str
    modelo: str
    numero_orden: str
    fecha_hoy: str

# -----------------------------------------------------------------------------
# 4. ESQUEMAS DE CONTABILIDAD Y TESORERÍA
# -----------------------------------------------------------------------------

class CuentaFinancieraCreate(BaseModel):
    nombre: str
    moneda: str = "USD"
    saldo_actual: float = 0.00

class CuentaFinancieraResponse(BaseModel):
    id_cuenta: int
    nombre: str
    moneda: str
    saldo_actual: float
    activa: bool
    class Config:
        from_attributes = True

class MovimientoTesoreriaCreate(BaseModel):
    tipo_movimiento: str # 'reinversion_ganancia', 'retiro_ganancia', 'retiro_capital', 'inyeccion_capital', 'gasto_operativo', 'transferencia_cuentas'
    id_cuenta_origen: Optional[int] = None
    id_cuenta_destino: Optional[int] = None
    monto: float
    afecta_a: Optional[str] = "capital" # 'capital' o 'ganancia'
    concepto: str
    referencia_pago: Optional[str] = None
    notas: Optional[str] = None

class BalancePatrimonioResponse(BaseModel):
    saldo_total_billeteras: float
    capital_trabajo: float
    ganancia_acumulada: float
    cuentas: List[CuentaFinancieraResponse]
