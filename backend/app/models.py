from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean, Text, ForeignKey, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Marca(Base):
    __tablename__ = "marca"
    id_marca = Column(Integer, primary_key=True, index=True)
    nombre_marca = Column(String(50), unique=True, nullable=False)

    lineas = relationship("Linea", back_populates="marca")

class Linea(Base):
    __tablename__ = "linea"
    id_linea = Column(Integer, primary_key=True, index=True)
    id_marca = Column(Integer, ForeignKey("marca.id_marca"), nullable=False)
    nombre_linea = Column(String(50), nullable=False)

    marca = relationship("Marca", back_populates="lineas")
    modelos = relationship("Modelo", back_populates="linea")

class Procesador(Base):
    __tablename__ = "procesador"
    id_procesador = Column(Integer, primary_key=True, index=True)
    nombre_procesador = Column(String(100), nullable=False)
    grafica_integrada = Column(String(100), nullable=True)

    modelos = relationship("Modelo", back_populates="procesador")

class GraficaDedicada(Base):
    __tablename__ = "grafica_dedicada"
    id_grafica_dedicada = Column(Integer, primary_key=True, index=True)
    nombre_grafica_dedicada = Column(String(100), nullable=False)

    modelos = relationship("Modelo", back_populates="grafica_dedicada")

class Resolucion(Base):
    __tablename__ = "resolucion"
    id_resolucion = Column(Integer, primary_key=True, index=True)
    nombre_resolucion = Column(String(50), nullable=False)
    ancho_px = Column(Integer, nullable=False)
    alto_px = Column(Integer, nullable=False)

    pantallas = relationship("Pantalla", back_populates="resolucion")

class Pulgada(Base):
    __tablename__ = "pulgada"
    id_pulgada = Column(Integer, primary_key=True, index=True)
    valor_pulgadas = Column(Numeric(3, 1), unique=True, nullable=False)

    pantallas = relationship("Pantalla", back_populates="pulgada")

class Hzs(Base):
    __tablename__ = "hzs"
    id_hzs = Column(Integer, primary_key=True, index=True)
    numero_hzs = Column(Integer, unique=True, nullable=False)

    pantallas = relationship("Pantalla", back_populates="hzs")

class TipoPantalla(Base):
    __tablename__ = "tipo_pantalla"
    id_tipo_pantalla = Column(Integer, primary_key=True, index=True)
    nombre_tipo_pantalla = Column(String(30), unique=True, nullable=False)

    pantallas = relationship("Pantalla", back_populates="tipo_pantalla")

class Pantalla(Base):
    __tablename__ = "pantalla"
    id_pantalla = Column(Integer, primary_key=True, index=True)
    id_resolucion = Column(Integer, ForeignKey("resolucion.id_resolucion"), nullable=False)
    id_pulgada = Column(Integer, ForeignKey("pulgada.id_pulgada"), nullable=False)
    id_hzs = Column(Integer, ForeignKey("hzs.id_hzs"), nullable=False)
    id_tipo_pantalla = Column(Integer, ForeignKey("tipo_pantalla.id_tipo_pantalla"), nullable=False)
    tactil = Column(Boolean, default=False)

    resolucion = relationship("Resolucion", back_populates="pantallas")
    pulgada = relationship("Pulgada", back_populates="pantallas")
    hzs = relationship("Hzs", back_populates="pantallas")
    tipo_pantalla = relationship("TipoPantalla", back_populates="pantallas")
    equipos = relationship("Equipo", back_populates="pantalla")

class Modelo(Base):
    __tablename__ = "modelo"
    id_modelo = Column(Integer, primary_key=True, index=True)
    nombre_modelo = Column(String(120), nullable=False)
    id_linea = Column(Integer, ForeignKey("linea.id_linea"), nullable=False)
    id_procesador = Column(Integer, ForeignKey("procesador.id_procesador"), nullable=False)
    id_grafica_dedicada = Column(Integer, ForeignKey("grafica_dedicada.id_grafica_dedicada"), nullable=True)
    descripcion_marketing = Column(Text, nullable=True)

    linea = relationship("Linea", back_populates="modelos")
    procesador = relationship("Procesador", back_populates="modelos")
    grafica_dedicada = relationship("GraficaDedicada", back_populates="modelos")
    equipos = relationship("Equipo", back_populates="modelo")
    multimedia = relationship("Multimedia", back_populates="modelo")

class Equipo(Base):
    __tablename__ = "equipo"
    id_equipo = Column(Integer, primary_key=True, index=True)
    codigo_interno = Column(String(50), unique=True, nullable=False, index=True)
    serial_fabricante = Column(String(100), nullable=True)
    id_modelo = Column(Integer, ForeignKey("modelo.id_modelo"), nullable=False)
    id_pantalla = Column(Integer, ForeignKey("pantalla.id_pantalla"), nullable=False)
    
    ram_gb = Column(Integer, nullable=False)
    ram_detalles = Column(String(100), nullable=True)
    almacenamiento_gb = Column(Integer, nullable=False)
    almacenamiento_detalles = Column(String(100), nullable=True)
    
    condicion = Column(String(20), nullable=False) # 'nuevo', 'exhibicion', 'usado'
    grado_estetico = Column(String(20), nullable=True) # 'Grado A', 'Grado B', 'Open Box'
    salud_bateria_porcentaje = Column(Integer, nullable=True)
    ciclos_bateria = Column(Integer, nullable=True)
    detalles_observaciones = Column(Text, nullable=True)
    caja = Column(Boolean, default=False)
    cargador = Column(Boolean, default=True)
    garantia_meses = Column(Integer, default=3)
    
    precio_compra = Column(Numeric(12, 2), nullable=False)
    precio_venta = Column(Numeric(12, 2), nullable=False)
    precio_oferta = Column(Numeric(12, 2), nullable=True)
    
    estado = Column(String(20), default="disponible", nullable=False, index=True)
    categorias = Column(String(250), nullable=True) # Etiquetas separadas por comas (e.g. "ofimatica,gaming,estudiantes")
    ideal_software = Column(String(300), nullable=True) # Software recomendado (e.g. "AutoCAD, Premiere, Valorant")
    fecha_ingreso = Column(DateTime(timezone=True), default=func.now())
    fecha_venta = Column(DateTime(timezone=True), nullable=True)

    modelo = relationship("Modelo", back_populates="equipos")
    pantalla = relationship("Pantalla", back_populates="equipos")
    multimedia = relationship("Multimedia", back_populates="equipo")
    venta = relationship("Venta", back_populates="equipo", uselist=False)

class Multimedia(Base):
    __tablename__ = "multimedia"
    id_multimedia = Column(Integer, primary_key=True, index=True)
    id_modelo = Column(Integer, ForeignKey("modelo.id_modelo", ondelete="CASCADE"), nullable=True)
    id_equipo = Column(Integer, ForeignKey("equipo.id_equipo", ondelete="CASCADE"), nullable=True)
    url = Column(String(500), nullable=False)
    tipo = Column(String(10), nullable=False) # 'foto', 'video'
    es_portada = Column(Boolean, default=False)
    orden = Column(Integer, default=0)
    fecha_subida = Column(DateTime(timezone=True), default=func.now())

    modelo = relationship("Modelo", back_populates="multimedia")
    equipo = relationship("Equipo", back_populates="multimedia")

class CuentaFinanciera(Base):
    __tablename__ = "cuenta_financiera"
    id_cuenta = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    moneda = Column(String(10), default="USD", nullable=False)
    saldo_actual = Column(Numeric(12, 2), default=0.00, nullable=False)
    activa = Column(Boolean, default=True, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), default=func.now())

class TransaccionLibroDiario(Base):
    __tablename__ = "transaccion_libro_diario"
    id_transaccion = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime(timezone=True), default=func.now(), index=True)
    tipo_movimiento = Column(String(30), nullable=False)
    id_cuenta_origen = Column(Integer, ForeignKey("cuenta_financiera.id_cuenta"), nullable=True)
    id_cuenta_destino = Column(Integer, ForeignKey("cuenta_financiera.id_cuenta"), nullable=True)
    monto_total = Column(Numeric(12, 2), nullable=False)
    impacto_capital = Column(Numeric(12, 2), default=0.00, nullable=False)
    impacto_ganancia = Column(Numeric(12, 2), default=0.00, nullable=False)
    concepto = Column(String(255), nullable=False)
    referencia_pago = Column(String(100), nullable=True)
    notas = Column(Text, nullable=True)

    cuenta_origen = relationship("CuentaFinanciera", foreign_keys=[id_cuenta_origen])
    cuenta_destino = relationship("CuentaFinanciera", foreign_keys=[id_cuenta_destino])

class Cliente(Base):
    __tablename__ = "cliente"
    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    cedula_rif = Column(String(30), unique=True, nullable=False)
    telefono = Column(String(30), nullable=False)
    correo = Column(String(120), nullable=True)
    ubicacion = Column(Text, nullable=False)
    fecha_registro = Column(DateTime(timezone=True), default=func.now())

    ventas = relationship("Venta", back_populates="cliente")

class Venta(Base):
    __tablename__ = "venta"
    id_venta = Column(Integer, primary_key=True, index=True)
    numero_orden = Column(String(50), unique=True, nullable=False, index=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    id_equipo = Column(Integer, ForeignKey("equipo.id_equipo"), unique=True, nullable=False)
    precio_venta = Column(Numeric(12, 2), nullable=False)
    costo_equipo = Column(Numeric(12, 2), nullable=False)
    ganancia_neta = Column(Numeric(12, 2), nullable=False)
    id_cuenta_destino = Column(Integer, ForeignKey("cuenta_financiera.id_cuenta"), nullable=False)
    metodo_pago_nombre = Column(String(50), nullable=False)
    referencia_comprobante = Column(String(100), nullable=True)
    n8n_procesado = Column(Boolean, default=False, nullable=False)
    n8n_fecha_envio = Column(DateTime(timezone=True), nullable=True)
    n8n_pdf_url = Column(Text, nullable=True)
    id_transaccion_contable = Column(Integer, ForeignKey("transaccion_libro_diario.id_transaccion"), nullable=True)
    fecha_venta = Column(DateTime(timezone=True), default=func.now())

    cliente = relationship("Cliente", back_populates="ventas")
    equipo = relationship("Equipo", back_populates="venta")
    cuenta_destino = relationship("CuentaFinanciera")
    transaccion = relationship("TransaccionLibroDiario")
