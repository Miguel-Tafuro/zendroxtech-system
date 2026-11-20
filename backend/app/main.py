import os
import uuid
import shutil
from datetime import datetime
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
import httpx

from .database import engine, Base, get_db
from . import models, schemas

# Crear tablas si no existen al iniciar (respaldo de seguridad)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ZendroxTech VE - API de Inventario, E-commerce y Contabilidad",
    version="2.0.0",
    description="Backend oficial para ZendroxTech VE con PostgreSQL, control de stock unitario, libro diario y n8n."
)

# CORS para permitir peticiones desde la Landing Page y el Panel Admin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads", "laptops"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads/laptops", StaticFiles(directory=UPLOAD_DIR), name="uploads")

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678/webhook/notas-entrega")

# =============================================================================
# INICIALIZADOR DE CUENTAS POR DEFECTO
# =============================================================================
@app.on_event("startup")
def init_seed_data():
    db = next(get_db())
    try:
        cuentas_base = [
            ("Binance USDT", "USD"),
            ("Zinli USD", "USD"),
            ("Wallytech USD", "USD"),
            ("Zelle USD", "USD"),
            ("Efectivo USD", "USD")
        ]
        for nombre, moneda in cuentas_base:
            existe = db.query(models.CuentaFinanciera).filter_by(nombre=nombre).first()
            if not existe:
                db.add(models.CuentaFinanciera(nombre=nombre, moneda=moneda, saldo_actual=0.00, activa=True))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error inicializando semillas: {e}")
    finally:
        db.close()

# =============================================================================
# 1. ENDPOINTS PÚBLICOS (CATÁLOGO EN TIEMPO REAL PARA LANDING PAGE)
# =============================================================================

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "ZendroxTech VE", "version": "2.0.0", "timestamp": datetime.now()}

@app.get("/api/public/laptops", response_model=List[schemas.PublicLaptopCatalogSchema])
def get_catalogo_publico_laptops(db: Session = Depends(get_db)):
    """
    Retorna el catálogo de laptops disponibles mapeado exactamente a la estructura
    productsDB que espera zendroxtech_e_commerce_store.html.
    """
    equipos = (
        db.query(models.Equipo)
        .options(
            joinedload(models.Equipo.modelo)
                .joinedload(models.Modelo.linea)
                .joinedload(models.Linea.marca),
            joinedload(models.Equipo.modelo).joinedload(models.Modelo.procesador),
            joinedload(models.Equipo.modelo).joinedload(models.Modelo.grafica_dedicada),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.resolucion),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.pulgada),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.hzs),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.tipo_pantalla),
            joinedload(models.Equipo.multimedia),
            joinedload(models.Equipo.modelo).joinedload(models.Modelo.multimedia)
        )
        .filter(models.Equipo.estado == "disponible")
        .order_by(models.Equipo.precio_venta.asc())
        .all()
    )

    catalogo = []
    for eq in equipos:
        m = eq.modelo
        marca_nom = m.linea.marca.nombre_marca if m and m.linea and m.linea.marca else "Laptop"
        modelo_nom = m.nombre_modelo if m else "Modelo"
        p = eq.pantalla
        pulgadas = float(p.pulgada.valor_pulgadas) if p and p.pulgada else 15.6
        res = p.resolucion.nombre_resolucion if p and p.resolucion else "Full HD"
        hz = p.hzs.numero_hzs if p and p.hzs else 60
        tipo_pan = p.tipo_pantalla.nombre_tipo_pantalla if p and p.tipo_pantalla else "IPS"

        titulo = f"{marca_nom} {modelo_nom} {pulgadas}\" {res} {hz}Hz"
        
        # Fotos: priorizar fotos de la unidad puntual, luego fotos del modelo
        fotos = [media.url for media in eq.multimedia]
        if not fotos and m:
            fotos = [media.url for media in m.multimedia]
        if not fotos:
            fotos = ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"]

        cond_texto = "Nuevo" if eq.condicion == "nuevo" else ("Open Box" if eq.condicion == "exhibicion" else f"Usado ({eq.grado_estetico or 'Grado A'})")
        badge_val = "🔥 OPEN BOX" if eq.condicion == "exhibicion" else ("✨ NUEVO" if eq.condicion == "nuevo" else "⭐ CERTIFICADA")
        foto_principal = fotos[0] if fotos else "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"

        # Categorías dinámicas configuradas por el admin
        user_cats = [c.strip().lower() for c in (eq.categorias or "").split(",") if c.strip()]
        if not user_cats:
            user_cats = ["gaming" if (m and m.grafica_dedicada) else "ofimatica"]
        if eq.condicion and eq.condicion.lower() not in user_cats:
            user_cats.append(eq.condicion.lower())

        # Ideal software personalizado por equipo o fallback inteligente
        ideal_sw = eq.ideal_software if eq.ideal_software else (
            "AutoCAD, Premiere Pro, Gaming, Render 3D" if (m and m.grafica_dedicada) else "Ofimática, Estudios, Navegación Web, Zoom"
        )

        catalogo.append(schemas.PublicLaptopCatalogSchema(
            id=eq.codigo_interno.lower().replace(" ", "-"),
            sku=eq.codigo_interno,
            brand=marca_nom,
            name=titulo,
            price=float(eq.precio_venta),
            oldPrice=float(eq.precio_oferta) if eq.precio_oferta else float(eq.precio_venta) + 80.0,
            condition=cond_texto,
            warranty=f"{eq.garantia_meses} Meses de Garantía",
            ram=eq.ram_gb,
            ramText=eq.ram_detalles or f"{eq.ram_gb} GB RAM",
            storage=eq.almacenamiento_detalles or f"{eq.almacenamiento_gb} GB SSD",
            cpu=m.procesador.nombre_procesador if m and m.procesador else "Procesador multinúcleo",
            gpu=m.grafica_dedicada.nombre_grafica_dedicada if m and m.grafica_dedicada else (m.procesador.grafica_integrada or "Gráficos Integrados"),
            screen=f"{pulgadas}\" {res} {tipo_pan} {hz}Hz",
            extra=eq.detalles_observaciones or ("Caja y cargador original" if eq.caja else "Cargador original incluido"),
            categories=user_cats,
            idealSoftware=ideal_sw,
            rating=5.0,
            reviews=18,
            badge=badge_val,
            image=foto_principal,
            images=fotos,
            status=eq.estado
        ))

    return catalogo

# =============================================================================
# 2. PANEL ADMINISTRATIVO: INVENTARIO Y MULTIMEDIA
# =============================================================================

@app.get("/api/admin/catalogo-hardware")
def get_catalogo_hardware(db: Session = Depends(get_db)):
    """Retorna las listas maestras de hardware para alimentar los selectores en el panel admin."""
    marcas = db.query(models.Marca).order_by(models.Marca.nombre_marca.asc()).all()
    lineas = db.query(models.Linea).order_by(models.Linea.nombre_linea.asc()).all()
    modelos = db.query(models.Modelo).options(
        joinedload(models.Modelo.linea).joinedload(models.Linea.marca),
        joinedload(models.Modelo.procesador)
    ).order_by(models.Modelo.nombre_modelo.asc()).all()
    procesadores = db.query(models.Procesador).order_by(models.Procesador.nombre_procesador.asc()).all()
    graficas = db.query(models.GraficaDedicada).order_by(models.GraficaDedicada.nombre_grafica_dedicada.asc()).all()
    pantallas = (
        db.query(models.Pantalla)
        .options(
            joinedload(models.Pantalla.pulgada),
            joinedload(models.Pantalla.resolucion),
            joinedload(models.Pantalla.hzs),
            joinedload(models.Pantalla.tipo_pantalla)
        ).all()
    )
    pantallas_formateadas = [
        {
            "id_pantalla": p.id_pantalla,
            "descripcion": f"{float(p.pulgada.valor_pulgadas)}\" {p.resolucion.nombre_resolucion} {p.tipo_pantalla.nombre_tipo_pantalla} {p.hzs.numero_hzs}Hz {'(Táctil)' if p.tactil else ''}".strip()
        }
        for p in pantallas
    ]

    resoluciones = db.query(models.Resolucion).all()
    pulgadas = db.query(models.Pulgada).order_by(models.Pulgada.valor_pulgadas.asc()).all()
    tipos_pantalla = db.query(models.TipoPantalla).all()
    hzs = db.query(models.Hzs).order_by(models.Hzs.numero_hzs.asc()).all()

    return {
        "marcas": [{"id_marca": m.id_marca, "nombre": m.nombre_marca} for m in marcas],
        "lineas": [{"id_linea": l.id_linea, "id_marca": l.id_marca, "nombre": l.nombre_linea} for l in lineas],
        "modelos": [
            {
                "id_modelo": mo.id_modelo,
                "id_linea": mo.id_linea,
                "id_marca": mo.linea.id_marca if mo.linea else None,
                "marca": mo.linea.marca.nombre_marca if mo.linea and mo.linea.marca else "",
                "nombre": mo.nombre_modelo,
                "nombre_completo": f"[{mo.linea.marca.nombre_marca if mo.linea and mo.linea.marca else 'Laptop'}] {mo.nombre_modelo} ({mo.procesador.nombre_procesador if mo.procesador else ''})".strip()
            }
            for mo in modelos
        ],
        "procesadores": [{"id_procesador": pr.id_procesador, "nombre": pr.nombre_procesador} for pr in procesadores],
        "graficas": [{"id_grafica_dedicada": gr.id_grafica_dedicada, "nombre": gr.nombre_grafica_dedicada} for gr in graficas],
        "pantallas": pantallas_formateadas,
        "opciones_pantalla": {
            "pulgadas": [float(pu.valor_pulgadas) for pu in pulgadas],
            "resoluciones": [{"id": r.id_resolucion, "nombre": r.nombre_resolucion, "ancho": r.ancho_px, "alto": r.alto_px} for r in resoluciones],
            "tipos": [t.nombre_tipo_pantalla for t in tipos_pantalla],
            "hzs": [h.numero_hzs for h in hzs]
        }
    }

@app.post("/api/admin/catalogo-hardware/modelo")
def crear_nuevo_modelo_hardware(
    datos: schemas.ModeloCreateSchema,
    db: Session = Depends(get_db)
):
    """Crea una nueva combinación de Marca, Línea, Procesador y Modelo sin tocar código."""
    marca = db.query(models.Marca).filter_by(nombre_marca=datos.nombre_marca.strip()).first()
    if not marca:
        marca = models.Marca(nombre_marca=datos.nombre_marca.strip())
        db.add(marca)
        db.flush()

    linea = db.query(models.Linea).filter_by(nombre_linea=datos.nombre_linea.strip(), id_marca=marca.id_marca).first()
    if not linea:
        linea = models.Linea(nombre_linea=datos.nombre_linea.strip(), id_marca=marca.id_marca)
        db.add(linea)
        db.flush()

    proc = db.query(models.Procesador).filter_by(nombre_procesador=datos.nombre_procesador.strip()).first()
    if not proc:
        proc = models.Procesador(nombre_procesador=datos.nombre_procesador.strip(), grafica_integrada="Gráficos Integrados")
        db.add(proc)
        db.flush()

    id_graf = None
    if datos.nombre_grafica and datos.nombre_grafica.strip():
        graf = db.query(models.GraficaDedicada).filter_by(nombre_grafica_dedicada=datos.nombre_grafica.strip()).first()
        if not graf:
            graf = models.GraficaDedicada(nombre_grafica_dedicada=datos.nombre_grafica.strip())
            db.add(graf)
            db.flush()
        id_graf = graf.id_grafica_dedicada

    existente = db.query(models.Modelo).filter_by(nombre_modelo=datos.nombre_modelo.strip(), id_linea=linea.id_linea).first()
    if existente:
        return {"message": "El modelo ya existía en el catálogo", "id_modelo": existente.id_modelo, "nombre": existente.nombre_modelo}

    nuevo_mod = models.Modelo(
        nombre_modelo=datos.nombre_modelo.strip(),
        id_linea=linea.id_linea,
        id_procesador=proc.id_procesador,
        id_grafica_dedicada=id_graf
    )
    db.add(nuevo_mod)
    db.commit()
    db.refresh(nuevo_mod)

    return {"message": "Modelo creado con éxito", "id_modelo": nuevo_mod.id_modelo, "nombre": nuevo_mod.nombre_modelo}

@app.post("/api/admin/catalogo-hardware/pantalla")
def crear_nueva_pantalla_hardware(
    datos: schemas.PantallaCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Crea o reutiliza los componentes atómicos 3FN de una pantalla:
    pulgada, resolucion, hzs, tipo_pantalla, y crea el registro en pantalla.
    """
    import re
    # 1. Pulgada
    val_pulg = round(float(datos.valor_pulgadas), 1)
    pulg = db.query(models.Pulgada).filter_by(valor_pulgadas=val_pulg).first()
    if not pulg:
        pulg = models.Pulgada(valor_pulgadas=val_pulg)
        db.add(pulg)
        db.flush()

    # 2. Resolución
    nombre_res = datos.nombre_resolucion.strip()
    ancho = datos.ancho_px or 1920
    alto = datos.alto_px or 1080
    match_res = re.search(r"(\d{3,4})\s*[xX*]\s*(\d{3,4})", nombre_res)
    if match_res:
        ancho = int(match_res.group(1))
        alto = int(match_res.group(2))

    res = db.query(models.Resolucion).filter_by(nombre_resolucion=nombre_res).first()
    if not res:
        res = models.Resolucion(nombre_resolucion=nombre_res, ancho_px=ancho, alto_px=alto)
        db.add(res)
        db.flush()

    # 3. Tipo Pantalla (Panel)
    nom_tipo = datos.nombre_tipo_pantalla.strip().upper()
    tipo = db.query(models.TipoPantalla).filter(func.upper(models.TipoPantalla.nombre_tipo_pantalla) == nom_tipo).first()
    if not tipo:
        tipo = models.TipoPantalla(nombre_tipo_pantalla=nom_tipo)
        db.add(tipo)
        db.flush()

    # 4. Hzs
    val_hzs = int(datos.numero_hzs)
    hz = db.query(models.Hzs).filter_by(numero_hzs=val_hzs).first()
    if not hz:
        hz = models.Hzs(numero_hzs=val_hzs)
        db.add(hz)
        db.flush()

    # 5. Registro en Pantalla (3FN)
    pantalla_existente = db.query(models.Pantalla).filter_by(
        id_pulgada=pulg.id_pulgada,
        id_resolucion=res.id_resolucion,
        id_tipo_pantalla=tipo.id_tipo_pantalla,
        id_hzs=hz.id_hzs,
        tactil=datos.tactil
    ).first()

    desc_completa = f"{float(pulg.valor_pulgadas)}\" {res.nombre_resolucion} {tipo.nombre_tipo_pantalla} {hz.numero_hzs}Hz {'(Táctil)' if datos.tactil else ''}".strip()

    if pantalla_existente:
        return {
            "message": "La pantalla ya existía en el catálogo",
            "id_pantalla": pantalla_existente.id_pantalla,
            "descripcion": desc_completa
        }

    nueva_pantalla = models.Pantalla(
        id_pulgada=pulg.id_pulgada,
        id_resolucion=res.id_resolucion,
        id_tipo_pantalla=tipo.id_tipo_pantalla,
        id_hzs=hz.id_hzs,
        tactil=datos.tactil
    )
    db.add(nueva_pantalla)
    db.commit()
    db.refresh(nueva_pantalla)

    return {
        "message": "Pantalla creada con éxito",
        "id_pantalla": nueva_pantalla.id_pantalla,
        "descripcion": desc_completa
    }

@app.get("/api/admin/laptops")
def get_admin_laptops(
    estado: Optional[str] = None,
    busqueda: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Lista todos los equipos para el inventario administrativo con filtros."""
    query = (
        db.query(models.Equipo)
        .options(
            joinedload(models.Equipo.modelo)
                .joinedload(models.Modelo.linea)
                .joinedload(models.Linea.marca),
            joinedload(models.Equipo.modelo).joinedload(models.Modelo.procesador),
            joinedload(models.Equipo.modelo).joinedload(models.Modelo.grafica_dedicada),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.resolucion),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.pulgada),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.hzs),
            joinedload(models.Equipo.pantalla).joinedload(models.Pantalla.tipo_pantalla),
            joinedload(models.Equipo.multimedia)
        )
    )
    if estado:
        query = query.filter(models.Equipo.estado == estado)
    if busqueda:
        busq = f"%{busqueda}%"
        query = query.join(models.Modelo).join(models.Linea).join(models.Marca).filter(
            (models.Equipo.codigo_interno.ilike(busq)) |
            (models.Equipo.serial_fabricante.ilike(busq)) |
            (models.Modelo.nombre_modelo.ilike(busq)) |
            (models.Marca.nombre_marca.ilike(busq))
        )
    equipos = query.order_by(models.Equipo.id_equipo.desc()).all()

    resultado = []
    for eq in equipos:
        m = eq.modelo
        p = eq.pantalla
        fotos = [med.url for med in eq.multimedia]
        resultado.append({
            "id_equipo": eq.id_equipo,
            "codigo_interno": eq.codigo_interno,
            "serial_fabricante": eq.serial_fabricante,
            "id_modelo": eq.id_modelo,
            "id_pantalla": eq.id_pantalla,
            "marca": m.linea.marca.nombre_marca if m and m.linea and m.linea.marca else "",
            "linea": m.linea.nombre_linea if m and m.linea else "",
            "modelo": m.nombre_modelo if m else "",
            "cpu": m.procesador.nombre_procesador if m and m.procesador else "",
            "gpu": m.grafica_dedicada.nombre_grafica_dedicada if m and m.grafica_dedicada else (m.procesador.grafica_integrada if m and m.procesador else ""),
            "pantalla": f"{float(p.pulgada.valor_pulgadas)}\" {p.resolucion.nombre_resolucion}" if p else "",
            "ram_gb": eq.ram_gb,
            "ram_detalles": eq.ram_detalles,
            "almacenamiento_gb": eq.almacenamiento_gb,
            "almacenamiento_detalles": eq.almacenamiento_detalles,
            "condicion": eq.condicion,
            "grado_estetico": eq.grado_estetico,
            "salud_bateria_porcentaje": eq.salud_bateria_porcentaje,
            "ciclos_bateria": eq.ciclos_bateria,
            "detalles_observaciones": eq.detalles_observaciones,
            "caja": eq.caja,
            "cargador": eq.cargador,
            "garantia_meses": eq.garantia_meses,
            "precio_compra": float(eq.precio_compra),
            "precio_venta": float(eq.precio_venta),
            "precio_oferta": float(eq.precio_oferta) if eq.precio_oferta else None,
            "estado": eq.estado,
            "categorias": eq.categorias,
            "ideal_software": eq.ideal_software,
            "fecha_ingreso": eq.fecha_ingreso,
            "imagenes": fotos
        })
    return resultado

@app.post("/api/admin/laptops", status_code=status.HTTP_201_CREATED)
def crear_equipo(datos: schemas.EquipoCreate, db: Session = Depends(get_db)):
    """Registra una nueva laptop en inventario con su código único SKU."""
    # Verificar si el código interno ya existe
    existe = db.query(models.Equipo).filter_by(codigo_interno=datos.codigo_interno).first()
    if existe:
        raise HTTPException(status_code=400, detail=f"El código interno '{datos.codigo_interno}' ya está registrado.")

    nuevo_equipo = models.Equipo(
        codigo_interno=datos.codigo_interno,
        serial_fabricante=datos.serial_fabricante,
        id_modelo=datos.id_modelo,
        id_pantalla=datos.id_pantalla,
        ram_gb=datos.ram_gb,
        ram_detalles=datos.ram_detalles,
        almacenamiento_gb=datos.almacenamiento_gb,
        almacenamiento_detalles=datos.almacenamiento_detalles,
        condicion=datos.condicion,
        grado_estetico=datos.grado_estetico,
        salud_bateria_porcentaje=datos.salud_bateria_porcentaje,
        ciclos_bateria=datos.ciclos_bateria,
        detalles_observaciones=datos.detalles_observaciones,
        caja=datos.caja,
        cargador=datos.cargador,
        garantia_meses=datos.garantia_meses,
        precio_compra=datos.precio_compra,
        precio_venta=datos.precio_venta,
        precio_oferta=datos.precio_oferta,
        categorias=datos.categorias,
        ideal_software=datos.ideal_software,
        estado="disponible"
    )
    db.add(nuevo_equipo)
    db.commit()
    db.refresh(nuevo_equipo)
    return {"message": "Laptop registrada exitosamente en inventario", "id_equipo": nuevo_equipo.id_equipo, "codigo_interno": nuevo_equipo.codigo_interno}

@app.put("/api/admin/laptops/{id_equipo}")
def actualizar_equipo(
    id_equipo: int,
    datos: schemas.EquipoUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza los datos técnicos, categorías o precios de una laptop existente."""
    equipo = db.query(models.Equipo).filter_by(id_equipo=id_equipo).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")

    if datos.codigo_interno and datos.codigo_interno != equipo.codigo_interno:
        duplicado = db.query(models.Equipo).filter(
            models.Equipo.codigo_interno == datos.codigo_interno,
            models.Equipo.id_equipo != id_equipo
        ).first()
        if duplicado:
            raise HTTPException(status_code=400, detail=f"El código interno '{datos.codigo_interno}' ya pertenece a otro equipo.")
        equipo.codigo_interno = datos.codigo_interno

    update_fields = [
        "serial_fabricante", "id_modelo", "id_pantalla", "ram_gb", "ram_detalles",
        "almacenamiento_gb", "almacenamiento_detalles", "condicion", "grado_estetico",
        "salud_bateria_porcentaje", "ciclos_bateria", "detalles_observaciones",
        "caja", "cargador", "garantia_meses", "precio_compra", "precio_venta",
        "precio_oferta", "estado", "categorias", "ideal_software"
    ]
    for field in update_fields:
        val = getattr(datos, field, None)
        if val is not None:
            setattr(equipo, field, val)

    db.commit()
    db.refresh(equipo)
    return {
        "message": "Equipo actualizado exitosamente.",
        "id_equipo": equipo.id_equipo,
        "codigo_interno": equipo.codigo_interno
    }

@app.delete("/api/admin/laptops/{id_equipo}")
def eliminar_equipo(
    id_equipo: int,
    db: Session = Depends(get_db)
):
    """Elimina una laptop del inventario y sus archivos multimedia asociados (solo si no ha sido vendida)."""
    equipo = db.query(models.Equipo).filter_by(id_equipo=id_equipo).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")

    # Verificar si tiene una venta registrada
    venta_asociada = db.query(models.Venta).filter_by(id_equipo=id_equipo).first()
    if venta_asociada:
        raise HTTPException(status_code=400, detail="No se puede eliminar un equipo que ya posee una venta registrada en el sistema.")

    # Borrar archivos multimedia físicos de disco
    for media in equipo.multimedia:
        if media.url and media.url.startswith("/uploads/laptops/"):
            nombre_arch = os.path.basename(media.url)
            ruta_disco = os.path.join(UPLOAD_DIR, nombre_arch)
            if os.path.exists(ruta_disco):
                try:
                    os.remove(ruta_disco)
                except Exception as e:
                    print(f"Error borrando archivo de disco {ruta_disco}: {e}")

    codigo = equipo.codigo_interno
    db.delete(equipo)
    db.commit()
    return {"message": f"Equipo {codigo} y sus archivos asociados han sido eliminados del inventario."}

@app.post("/api/admin/laptops/{id_equipo}/multimedia")
def subir_multimedia_equipo(
    id_equipo: int,
    archivo: UploadFile = File(...),
    tipo: str = Form("foto"), # 'foto' o 'video'
    es_portada: bool = Form(False),
    db: Session = Depends(get_db)
):
    """Sube un archivo de foto o video para un equipo puntual y lo guarda en /uploads/laptops."""
    equipo = db.query(models.Equipo).filter_by(id_equipo=id_equipo).first()
    if not equipo:
        raise HTTPException(status_code=404, detail="Equipo no encontrado.")

    # Generar nombre único seguro
    ext = os.path.splitext(archivo.filename)[1].lower()
    if not ext:
        ext = ".jpg" if tipo == "foto" else ".mp4"
    nombre_archivo = f"{equipo.codigo_interno}_{uuid.uuid4().hex[:8]}{ext}"
    ruta_destino = os.path.join(UPLOAD_DIR, nombre_archivo)

    with open(ruta_destino, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    url_publica = f"/uploads/laptops/{nombre_archivo}"

    count_existentes = db.query(models.Multimedia).filter_by(id_equipo=id_equipo).count()
    if count_existentes == 0:
        es_portada = True

    if es_portada:
        # Desmarcar portadas anteriores para este equipo
        db.query(models.Multimedia).filter_by(id_equipo=id_equipo).update({"es_portada": False})

    registro = models.Multimedia(
        id_equipo=id_equipo,
        url=url_publica,
        tipo=tipo,
        es_portada=es_portada,
        orden=count_existentes
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)

    return {"message": "Archivo multimedia subido con éxito", "url": url_publica, "id_multimedia": registro.id_multimedia}

@app.get("/api/admin/laptops/{id_equipo}/multimedia")
def obtener_multimedia_equipo(id_equipo: int, db: Session = Depends(get_db)):
    """Retorna la lista ordenada de fotos y videos de un equipo."""
    media = (
        db.query(models.Multimedia)
        .filter_by(id_equipo=id_equipo)
        .order_by(models.Multimedia.es_portada.desc(), models.Multimedia.orden.asc(), models.Multimedia.id_multimedia.asc())
        .all()
    )
    return [
        {
            "id_multimedia": m.id_multimedia,
            "url": m.url,
            "tipo": m.tipo,
            "es_portada": m.es_portada,
            "orden": m.orden,
            "fecha_subida": m.fecha_subida
        }
        for m in media
    ]

@app.delete("/api/admin/laptops/{id_equipo}/multimedia/{id_multimedia}")
def eliminar_multimedia_equipo(id_equipo: int, id_multimedia: int, db: Session = Depends(get_db)):
    """Elimina una foto o video tanto de la base de datos como del disco físico."""
    media = db.query(models.Multimedia).filter_by(id_equipo=id_equipo, id_multimedia=id_multimedia).first()
    if not media:
        raise HTTPException(status_code=404, detail="Archivo multimedia no encontrado.")
    
    # Si es archivo local en /uploads/laptops, borrarlo del disco
    if media.url.startswith("/uploads/laptops/"):
        nombre_arch = os.path.basename(media.url)
        ruta_disco = os.path.join(UPLOAD_DIR, nombre_arch)
        if os.path.exists(ruta_disco):
            try:
                os.remove(ruta_disco)
            except Exception as e:
                print(f"Error borrando archivo de disco: {e}")

    db.delete(media)
    db.commit()

    # Si se borró la portada, asignar la primera foto restante como portada
    restantes = db.query(models.Multimedia).filter_by(id_equipo=id_equipo).order_by(models.Multimedia.id_multimedia.asc()).all()
    tiene_portada = any(m.es_portada for m in restantes)
    if restantes and not tiene_portada:
        restantes[0].es_portada = True
        db.commit()

    return {"message": "Archivo multimedia eliminado con éxito."}

@app.put("/api/admin/laptops/{id_equipo}/multimedia/{id_multimedia}/portada")
def marcar_como_portada(id_equipo: int, id_multimedia: int, db: Session = Depends(get_db)):
    """Establece esta imagen como la foto principal/portada del equipo."""
    media = db.query(models.Multimedia).filter_by(id_equipo=id_equipo, id_multimedia=id_multimedia).first()
    if not media:
        raise HTTPException(status_code=404, detail="Archivo multimedia no encontrado.")

    # Desmarcar todas las portadas de este equipo
    db.query(models.Multimedia).filter_by(id_equipo=id_equipo).update({"es_portada": False})
    media.es_portada = True
    media.orden = 0
    db.commit()

    return {"message": "Foto establecida como portada principal.", "url": media.url}

@app.put("/api/admin/laptops/{id_equipo}/multimedia/{id_multimedia}/mover")
def mover_orden_multimedia(id_equipo: int, id_multimedia: int, direccion: str = Query("arriba"), db: Session = Depends(get_db)):
    """Mueve una foto arriba o abajo en el orden de visualización intercambiando su posición."""
    todos = (
        db.query(models.Multimedia)
        .filter_by(id_equipo=id_equipo)
        .order_by(models.Multimedia.es_portada.desc(), models.Multimedia.orden.asc(), models.Multimedia.id_multimedia.asc())
        .all()
    )
    idx = -1
    for i, m in enumerate(todos):
        if m.id_multimedia == id_multimedia:
            idx = i
            break

    if idx == -1:
        raise HTTPException(status_code=404, detail="Archivo multimedia no encontrado.")

    if direccion == "arriba" and idx > 0:
        target_idx = idx - 1
        # Intercambiar orden
        todos[idx], todos[target_idx] = todos[target_idx], todos[idx]
        for i, m in enumerate(todos):
            m.orden = i
        db.commit()
    elif direccion == "abajo" and idx < len(todos) - 1:
        target_idx = idx + 1
        # Intercambiar orden
        todos[idx], todos[target_idx] = todos[target_idx], todos[idx]
        for i, m in enumerate(todos):
            m.orden = i
        db.commit()

    return {"message": "Orden actualizado con éxito."}

@app.post("/api/admin/catalogo-hardware/marca")
def crear_marca(nombre_marca: str = Form(...), db: Session = Depends(get_db)):
    existe = db.query(models.Marca).filter_by(nombre_marca=nombre_marca.strip()).first()
    if existe:
        return {"id_marca": existe.id_marca, "nombre": existe.nombre_marca, "mensaje": "Ya existía"}
    nueva = models.Marca(nombre_marca=nombre_marca.strip())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id_marca": nueva.id_marca, "nombre": nueva.nombre_marca, "mensaje": "Marca creada con éxito"}

@app.post("/api/admin/catalogo-hardware/linea")
def crear_linea(id_marca: int = Form(...), nombre_linea: str = Form(...), db: Session = Depends(get_db)):
    existe = db.query(models.Linea).filter_by(id_marca=id_marca, nombre_linea=nombre_linea.strip()).first()
    if existe:
        return {"id_linea": existe.id_linea, "nombre": existe.nombre_linea, "mensaje": "Ya existía"}
    nueva = models.Linea(id_marca=id_marca, nombre_linea=nombre_linea.strip())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id_linea": nueva.id_linea, "nombre": nueva.nombre_linea, "mensaje": "Línea creada con éxito"}

@app.post("/api/admin/catalogo-hardware/procesador")
def crear_procesador(nombre_procesador: str = Form(...), grafica_integrada: Optional[str] = Form(None), db: Session = Depends(get_db)):
    existe = db.query(models.Procesador).filter_by(nombre_procesador=nombre_procesador.strip()).first()
    if existe:
        return {"id_procesador": existe.id_procesador, "nombre": existe.nombre_procesador}
    nuevo = models.Procesador(nombre_procesador=nombre_procesador.strip(), grafica_integrada=grafica_integrada or "Gráficos Integrados")
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id_procesador": nuevo.id_procesador, "nombre": nuevo.nombre_procesador}

@app.post("/api/admin/catalogo-hardware/grafica")
def crear_grafica(nombre_grafica: str = Form(...), db: Session = Depends(get_db)):
    existe = db.query(models.GraficaDedicada).filter_by(nombre_grafica_dedicada=nombre_grafica.strip()).first()
    if existe:
        return {"id_grafica_dedicada": existe.id_grafica_dedicada, "nombre": existe.nombre_grafica_dedicada}
    nueva = models.GraficaDedicada(nombre_grafica_dedicada=nombre_grafica.strip())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id_grafica_dedicada": nueva.id_grafica_dedicada, "nombre": nueva.nombre_grafica_dedicada}

# =============================================================================
# 3. MÓDULO DE VENTA ATÓMICA + CONTABILIDAD + WEBHOOK N8N
# =============================================================================

@app.post("/api/admin/ventas", status_code=status.HTTP_201_CREATED)
async def registrar_venta_y_disparar_n8n(
    datos: schemas.VentaCreate,
    db: Session = Depends(get_db)
):
    """
    Ejecuta la transacción atómica de venta:
    1. Bloqueo FOR UPDATE de la laptop y cambio a 'vendido'.
    2. Creación / actualización de cliente.
    3. Asiento en el Libro Diario separando Capital de Trabajo (costo) y Ganancia Líquida (utilidad).
    4. Aumento del saldo en la cuenta receptora seleccionada.
    5. Disparo del Webhook hacia n8n con los 10 campos requeridos para la nota de entrega.
    """
    # 1. Bloqueo de fila
    equipo = db.query(models.Equipo).filter_by(id_equipo=datos.id_equipo).with_for_update().first()
    if not equipo:
        raise HTTPException(status_code=404, detail="El equipo solicitado no existe.")
    if equipo.estado != "disponible":
        raise HTTPException(status_code=400, detail=f"El equipo {equipo.codigo_interno} ya no está disponible (Estado actual: {equipo.estado}).")

    cuenta = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_destino).with_for_update().first()
    if not cuenta:
        raise HTTPException(status_code=404, detail="La cuenta receptora de fondos no existe.")

    # 2. Cliente (buscar o crear)
    cliente = db.query(models.Cliente).filter_by(cedula_rif=datos.cedula_cliente.strip().upper()).first()
    if not cliente:
        cliente = models.Cliente(
            nombre_completo=datos.nombre_cliente.strip(),
            cedula_rif=datos.cedula_cliente.strip().upper(),
            telefono=datos.telefono_cliente.strip(),
            correo=datos.correo_cliente.strip() if datos.correo_cliente else None,
            ubicacion=datos.ubicacion_cliente.strip()
        )
        db.add(cliente)
        db.flush()
    else:
        cliente.nombre_completo = datos.nombre_cliente.strip()
        cliente.telefono = datos.telefono_cliente.strip()
        cliente.ubicacion = datos.ubicacion_cliente.strip()
        if datos.correo_cliente:
            cliente.correo = datos.correo_cliente.strip()

    # 3. Cálculos financieros
    precio_venta = float(equipo.precio_venta)
    costo_equipo = float(equipo.precio_compra)
    ganancia_neta = precio_venta - costo_equipo

    numero_orden = f"ZT-ORD-{int(datetime.now().timestamp())}"

    # 4. Asiento Contable (Doble Impacto: Retorno de Capital + Ganancia Realizada)
    asiento = models.TransaccionLibroDiario(
        tipo_movimiento="venta_equipo",
        id_cuenta_destino=cuenta.id_cuenta,
        monto_total=precio_venta,
        impacto_capital=costo_equipo,
        impacto_ganancia=ganancia_neta,
        concepto=f"Venta laptop {equipo.codigo_interno} a {cliente.nombre_completo} ({numero_orden})",
        referencia_pago=datos.referencia_comprobante
    )
    db.add(asiento)
    db.flush()

    # Actualizar saldo de la cuenta
    cuenta.saldo_actual = float(cuenta.saldo_actual) + precio_venta

    # 5. Marcar equipo como vendido
    equipo.estado = "vendido"
    equipo.fecha_venta = func.now()

    # 6. Registrar Venta
    nueva_venta = models.Venta(
        numero_orden=numero_orden,
        id_cliente=cliente.id_cliente,
        id_equipo=equipo.id_equipo,
        precio_venta=precio_venta,
        costo_equipo=costo_equipo,
        ganancia_neta=ganancia_neta,
        id_cuenta_destino=cuenta.id_cuenta,
        metodo_pago_nombre=datos.metodo_pago_nombre,
        referencia_comprobante=datos.referencia_comprobante,
        id_transaccion_contable=asiento.id_transaccion,
        n8n_procesado=False
    )
    db.add(nueva_venta)
    db.commit()
    db.refresh(nueva_venta)

    # 7. Disparo inmediato a n8n
    # Cargar detalles del modelo para la nota de entrega
    modelo_nombre = equipo.modelo.nombre_modelo if equipo.modelo else "Laptop"
    marca_nombre = equipo.modelo.linea.marca.nombre_marca if (equipo.modelo and equipo.modelo.linea and equipo.modelo.linea.marca) else ""
    nombre_producto = f"{marca_nombre} {modelo_nombre} (SKU: {equipo.codigo_interno})"

    meses_garantia = int(equipo.garantia_meses) if equipo.garantia_meses else 3
    dias_garantia = meses_garantia * 30

    payload_n8n = {
        "nombre_cliente": cliente.nombre_completo,
        "telefono_cliente": cliente.telefono,
        "cedula_cliente": cliente.cedula_rif,
        "ubicacion": cliente.ubicacion,
        "metodo_pago": datos.metodo_pago_nombre,
        "correo": cliente.correo or "ventas@zendroxtech.com",
        "precio": f"{precio_venta:.2f}",
        "modelo": nombre_producto,
        "numero_orden": numero_orden,
        "fecha_hoy": datetime.now().strftime("%d/%m/%Y"),
        "garantia_meses": str(meses_garantia),
        "garantia_dias": str(dias_garantia)
    }

    n8n_enviado = False
    n8n_error = None
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(N8N_WEBHOOK_URL, json=payload_n8n)
            if resp.status_code in [200, 201]:
                n8n_enviado = True
                nueva_venta.n8n_procesado = True
                nueva_venta.n8n_fecha_envio = func.now()
                db.commit()
            else:
                n8n_error = f"n8n respondió con código {resp.status_code}: {resp.text[:200]}"
    except Exception as e:
        n8n_error = f"No se pudo conectar a n8n ({N8N_WEBHOOK_URL}): {str(e)}"

    return {
        "message": "Venta registrada con éxito.",
        "numero_orden": numero_orden,
        "id_venta": nueva_venta.id_venta,
        "equipo_sku": equipo.codigo_interno,
        "desglose": {
            "precio_venta": precio_venta,
            "capital_recuperado": costo_equipo,
            "ganancia_neta": ganancia_neta,
            "cuenta_receptora": cuenta.nombre,
            "saldo_actualizado": float(cuenta.saldo_actual)
        },
        "webhook_n8n": {
            "enviado": n8n_enviado,
            "endpoint": N8N_WEBHOOK_URL,
            "error": n8n_error
        }
    }

# =============================================================================
# 4. MÓDULO DE CONTABILIDAD, TESORERÍA Y LIBRO DIARIO
# =============================================================================

@app.get("/api/admin/tesoreria/balance", response_model=schemas.BalancePatrimonioResponse)
def get_balance_patrimonio(db: Session = Depends(get_db)):
    """
    Calcula el balance contable en tiempo real:
    - Saldo Total en Billeteras
    - Capital de Trabajo acumulado
    - Ganancias Acumuladas
    """
    cuentas = db.query(models.CuentaFinanciera).filter_by(activa=True).all()
    saldo_total = sum(float(c.saldo_actual) for c in cuentas)

    # Impacto total en Capital y Ganancia a partir del Libro Diario
    res_capital = db.query(func.coalesce(func.sum(models.TransaccionLibroDiario.impacto_capital), 0)).scalar()
    res_ganancia = db.query(func.coalesce(func.sum(models.TransaccionLibroDiario.impacto_ganancia), 0)).scalar()

    capital_trabajo = float(res_capital)
    ganancia_acumulada = float(res_ganancia)

    cuentas_resp = [
        schemas.CuentaFinancieraResponse(
            id_cuenta=c.id_cuenta,
            nombre=c.nombre,
            moneda=c.moneda,
            saldo_actual=float(c.saldo_actual),
            activa=c.activa
        )
        for c in cuentas
    ]

    return schemas.BalancePatrimonioResponse(
        saldo_total_billeteras=saldo_total,
        capital_trabajo=capital_trabajo,
        ganancia_acumulada=ganancia_acumulada,
        cuentas=cuentas_resp
    )

@app.get("/api/admin/tesoreria/cuentas")
def listar_cuentas(db: Session = Depends(get_db)):
    cuentas = db.query(models.CuentaFinanciera).all()
    return [{"id_cuenta": c.id_cuenta, "nombre": c.nombre, "moneda": c.moneda, "saldo_actual": float(c.saldo_actual), "activa": c.activa} for c in cuentas]

@app.post("/api/admin/tesoreria/cuentas")
def crear_cuenta(datos: schemas.CuentaFinancieraCreate, db: Session = Depends(get_db)):
    existe = db.query(models.CuentaFinanciera).filter_by(nombre=datos.nombre).first()
    if existe:
        raise HTTPException(status_code=400, detail="Ya existe una cuenta con ese nombre.")
    nueva = models.CuentaFinanciera(nombre=datos.nombre, moneda=datos.moneda, saldo_actual=datos.saldo_actual, activa=True)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"message": "Cuenta creada con éxito", "id_cuenta": nueva.id_cuenta, "nombre": nueva.nombre}

@app.get("/api/admin/tesoreria/movimientos")
def listar_movimientos_libro_diario(db: Session = Depends(get_db), limite: int = Query(50)):
    movimientos = (
        db.query(models.TransaccionLibroDiario)
        .options(
            joinedload(models.TransaccionLibroDiario.cuenta_origen),
            joinedload(models.TransaccionLibroDiario.cuenta_destino)
        )
        .order_by(models.TransaccionLibroDiario.id_transaccion.desc())
        .limit(limite)
        .all()
    )
    return [
        {
            "id_transaccion": m.id_transaccion,
            "fecha": m.fecha,
            "tipo_movimiento": m.tipo_movimiento,
            "cuenta_origen": m.cuenta_origen.nombre if m.cuenta_origen else None,
            "cuenta_destino": m.cuenta_destino.nombre if m.cuenta_destino else None,
            "monto_total": float(m.monto_total),
            "impacto_capital": float(m.impacto_capital),
            "impacto_ganancia": float(m.impacto_ganancia),
            "concepto": m.concepto,
            "referencia": m.referencia_pago
        }
        for m in movimientos
    ]

@app.post("/api/admin/tesoreria/movimientos")
def registrar_movimiento_tesoreria(
    datos: schemas.MovimientoTesoreriaCreate,
    db: Session = Depends(get_db)
):
    """
    Registra operaciones especiales de tesorería:
    - Reinversión: Traslado interno de Ganancia hacia Capital de trabajo
    - Retiro de Ganancia: El dueño retira dinero de su ganancia personal
    - Retiro de Capital: Retiro de capital de trabajo
    - Inyección de Capital: Nuevo aporte de inversión
    - Gasto Operativo: Flete, delivery, embalaje, publicidad
    - Transferencia entre Billeteras: Mover fondos de una cuenta a otra
    """
    monto = float(datos.monto)
    if monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a cero.")

    impacto_cap = 0.0
    impacto_gan = 0.0

    if datos.tipo_movimiento == "reinversion_ganancia":
        # Traslada ganancia a capital (el saldo bancario no cambia)
        impacto_gan = -monto
        impacto_cap = +monto

    elif datos.tipo_movimiento == "retiro_ganancia":
        if not datos.id_cuenta_origen:
            raise HTTPException(status_code=400, detail="Debe indicar la cuenta de donde se retira el dinero.")
        cuenta = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_origen).first()
        if not cuenta or float(cuenta.saldo_actual) < monto:
            raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta seleccionada.")
        cuenta.saldo_actual = float(cuenta.saldo_actual) - monto
        impacto_gan = -monto

    elif datos.tipo_movimiento == "retiro_capital":
        if not datos.id_cuenta_origen:
            raise HTTPException(status_code=400, detail="Debe indicar la cuenta de donde se retira el dinero.")
        cuenta = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_origen).first()
        if not cuenta or float(cuenta.saldo_actual) < monto:
            raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta seleccionada.")
        cuenta.saldo_actual = float(cuenta.saldo_actual) - monto
        impacto_cap = -monto

    elif datos.tipo_movimiento == "inyeccion_capital":
        if not datos.id_cuenta_destino:
            raise HTTPException(status_code=400, detail="Debe indicar la cuenta receptora de los fondos.")
        cuenta = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_destino).first()
        if not cuenta:
            raise HTTPException(status_code=404, detail="Cuenta receptora no encontrada.")
        cuenta.saldo_actual = float(cuenta.saldo_actual) + monto
        impacto_cap = +monto

    elif datos.tipo_movimiento == "gasto_operativo":
        if not datos.id_cuenta_origen:
            raise HTTPException(status_code=400, detail="Debe indicar la cuenta de donde sale el dinero del gasto.")
        cuenta = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_origen).first()
        if not cuenta or float(cuenta.saldo_actual) < monto:
            raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta seleccionada.")
        cuenta.saldo_actual = float(cuenta.saldo_actual) - monto
        if datos.afecta_a == "ganancia":
            impacto_gan = -monto
        else:
            impacto_cap = -monto

    elif datos.tipo_movimiento == "transferencia_cuentas":
        if not datos.id_cuenta_origen or not datos.id_cuenta_destino:
            raise HTTPException(status_code=400, detail="Debe indicar cuenta origen y cuenta destino.")
        if datos.id_cuenta_origen == datos.id_cuenta_destino:
            raise HTTPException(status_code=400, detail="La cuenta de origen y destino no pueden ser la misma.")
        c_orig = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_origen).first()
        c_dest = db.query(models.CuentaFinanciera).filter_by(id_cuenta=datos.id_cuenta_destino).first()
        if not c_orig or float(c_orig.saldo_actual) < monto:
            raise HTTPException(status_code=400, detail="Saldo insuficiente en la cuenta de origen.")
        if not c_dest:
            raise HTTPException(status_code=404, detail="Cuenta destino no encontrada.")
        c_orig.saldo_actual = float(c_orig.saldo_actual) - monto
        c_dest.saldo_actual = float(c_dest.saldo_actual) + monto

    else:
        raise HTTPException(status_code=400, detail=f"Tipo de movimiento no válido: {datos.tipo_movimiento}")

    asiento = models.TransaccionLibroDiario(
        tipo_movimiento=datos.tipo_movimiento,
        id_cuenta_origen=datos.id_cuenta_origen,
        id_cuenta_destino=datos.id_cuenta_destino,
        monto_total=monto,
        impacto_capital=impacto_cap,
        impacto_ganancia=impacto_gan,
        concepto=datos.concepto,
        referencia_pago=datos.referencia_pago,
        notas=datos.notas
    )
    db.add(asiento)
    db.commit()
    db.refresh(asiento)

    return {"message": "Movimiento registrado con éxito en el libro diario", "id_transaccion": asiento.id_transaccion}
