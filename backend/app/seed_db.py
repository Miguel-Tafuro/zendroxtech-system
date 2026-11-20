import os
from decimal import Decimal
from app.database import SessionLocal
from app import models

def seed():
    db = SessionLocal()
    try:
        # 1. Marcas
        marcas_data = ["Acer", "Lenovo", "Dell", "HP", "Asus", "Apple"]
        marcas_dict = {}
        for m in marcas_data:
            obj = db.query(models.Marca).filter_by(nombre_marca=m).first()
            if not obj:
                obj = models.Marca(nombre_marca=m)
                db.add(obj)
                db.flush()
            marcas_dict[m] = obj

        # 2. Líneas
        lineas_data = [
            ("Nitro", marcas_dict["Acer"].id_marca),
            ("ThinkPad", marcas_dict["Lenovo"].id_marca),
            ("Latitude", marcas_dict["Dell"].id_marca),
            ("Victus", marcas_dict["HP"].id_marca),
            ("TUF Gaming", marcas_dict["Asus"].id_marca),
        ]
        lineas_dict = {}
        for nom, id_m in lineas_data:
            obj = db.query(models.Linea).filter_by(nombre_linea=nom, id_marca=id_m).first()
            if not obj:
                obj = models.Linea(nombre_linea=nom, id_marca=id_m)
                db.add(obj)
                db.flush()
            lineas_dict[nom] = obj

        # 3. Procesadores
        proc_data = [
            ("Intel Core i5-11400H (6C/12T hasta 4.5GHz)", "Intel UHD Graphics"),
            ("Intel Core i7-11800H (8C/16T hasta 4.6GHz)", "Intel UHD Graphics"),
            ("Intel Core i5-1135G7 (4C/8T hasta 4.2GHz)", "Intel Iris Xe Graphics"),
            ("AMD Ryzen 5 5600H (6C/12T hasta 4.2GHz)", "AMD Radeon Graphics"),
        ]
        proc_dict = {}
        for nom, igpu in proc_data:
            obj = db.query(models.Procesador).filter_by(nombre_procesador=nom).first()
            if not obj:
                obj = models.Procesador(nombre_procesador=nom, grafica_integrada=igpu)
                db.add(obj)
                db.flush()
            proc_dict[nom] = obj

        # 4. Gráficas Dedicadas
        graf_data = ["NVIDIA GeForce RTX 3050 4GB", "NVIDIA GeForce RTX 3060 6GB", "NVIDIA GeForce GTX 1650 4GB"]
        graf_dict = {}
        for g in graf_data:
            obj = db.query(models.GraficaDedicada).filter_by(nombre_grafica_dedicada=g).first()
            if not obj:
                obj = models.GraficaDedicada(nombre_grafica_dedicada=g)
                db.add(obj)
                db.flush()
            graf_dict[g] = obj

        # 5. Resoluciones, Pulgadas, Hzs, Tipos de Pantalla
        res_fhd = db.query(models.Resolucion).filter_by(nombre_resolucion="Full HD (1920x1080)").first()
        if not res_fhd:
            res_fhd = models.Resolucion(nombre_resolucion="Full HD (1920x1080)", ancho_px=1920, alto_px=1080)
            db.add(res_fhd)
            db.flush()

        pulg_156 = db.query(models.Pulgada).filter_by(valor_pulgadas=Decimal("15.6")).first()
        if not pulg_156:
            pulg_156 = models.Pulgada(valor_pulgadas=Decimal("15.6"))
            db.add(pulg_156)
            db.flush()

        pulg_140 = db.query(models.Pulgada).filter_by(valor_pulgadas=Decimal("14.0")).first()
        if not pulg_140:
            pulg_140 = models.Pulgada(valor_pulgadas=Decimal("14.0"))
            db.add(pulg_140)
            db.flush()

        hz_144 = db.query(models.Hzs).filter_by(numero_hzs=144).first()
        if not hz_144:
            hz_144 = models.Hzs(numero_hzs=144)
            db.add(hz_144)
            db.flush()

        hz_60 = db.query(models.Hzs).filter_by(numero_hzs=60).first()
        if not hz_60:
            hz_60 = models.Hzs(numero_hzs=60)
            db.add(hz_60)
            db.flush()

        tipo_ips = db.query(models.TipoPantalla).filter_by(nombre_tipo_pantalla="IPS").first()
        if not tipo_ips:
            tipo_ips = models.TipoPantalla(nombre_tipo_pantalla="IPS")
            db.add(tipo_ips)
            db.flush()

        # Pantalla Gamer 15.6 144Hz IPS
        pan_gamer = db.query(models.Pantalla).filter_by(
            id_resolucion=res_fhd.id_resolucion, id_pulgada=pulg_156.id_pulgada, id_hzs=hz_144.id_hzs
        ).first()
        if not pan_gamer:
            pan_gamer = models.Pantalla(
                id_resolucion=res_fhd.id_resolucion,
                id_pulgada=pulg_156.id_pulgada,
                id_hzs=hz_144.id_hzs,
                id_tipo_pantalla=tipo_ips.id_tipo_pantalla,
                tactil=False
            )
            db.add(pan_gamer)
            db.flush()

        # Pantalla Oficina 14.0 60Hz IPS
        pan_oficina = db.query(models.Pantalla).filter_by(
            id_resolucion=res_fhd.id_resolucion, id_pulgada=pulg_140.id_pulgada, id_hzs=hz_60.id_hzs
        ).first()
        if not pan_oficina:
            pan_oficina = models.Pantalla(
                id_resolucion=res_fhd.id_resolucion,
                id_pulgada=pulg_140.id_pulgada,
                id_hzs=hz_60.id_hzs,
                id_tipo_pantalla=tipo_ips.id_tipo_pantalla,
                tactil=False
            )
            db.add(pan_oficina)
            db.flush()

        # 6. Modelos de Laptops
        # Acer Nitro 5
        mod_nitro = db.query(models.Modelo).filter_by(nombre_modelo="Nitro 5 AN515-57").first()
        if not mod_nitro:
            mod_nitro = models.Modelo(
                nombre_modelo="Nitro 5 AN515-57",
                id_linea=lineas_dict["Nitro"].id_linea,
                id_procesador=proc_dict["Intel Core i5-11400H (6C/12T hasta 4.5GHz)"].id_procesador,
                id_grafica_dedicada=graf_dict["NVIDIA GeForce RTX 3050 4GB"].id_grafica_dedicada,
                descripcion_marketing="Gaming de alto rendimiento con doble ventilador CoolBoost y teclado retroiluminado."
            )
            db.add(mod_nitro)
            db.flush()

        # Lenovo ThinkPad T14
        mod_t14 = db.query(models.Modelo).filter_by(nombre_modelo="ThinkPad T14 Gen 2").first()
        if not mod_t14:
            mod_t14 = models.Modelo(
                nombre_modelo="ThinkPad T14 Gen 2",
                id_linea=lineas_dict["ThinkPad"].id_linea,
                id_procesador=proc_dict["Intel Core i5-1135G7 (4C/8T hasta 4.2GHz)"].id_procesador,
                id_grafica_dedicada=None,
                descripcion_marketing="Línea empresarial legendaria. Chasis de magnesio resistente a golpes y teclado antiderrame."
            )
            db.add(mod_t14)
            db.flush()

        # Dell Latitude 5420
        mod_lat = db.query(models.Modelo).filter_by(nombre_modelo="Latitude 5420").first()
        if not mod_lat:
            mod_lat = models.Modelo(
                nombre_modelo="Latitude 5420",
                id_linea=lineas_dict["Latitude"].id_linea,
                id_procesador=proc_dict["Intel Core i5-1135G7 (4C/8T hasta 4.2GHz)"].id_procesador,
                id_grafica_dedicada=None,
                descripcion_marketing="Equipo ultraportátil profesional para ejecutivos, estudiantes y programación."
            )
            db.add(mod_lat)
            db.flush()

        # HP Victus 15
        mod_vic = db.query(models.Modelo).filter_by(nombre_modelo="Victus 15-fb0028nr").first()
        if not mod_vic:
            mod_vic = models.Modelo(
                nombre_modelo="Victus 15-fb0028nr",
                id_linea=lineas_dict["Victus"].id_linea,
                id_procesador=proc_dict["AMD Ryzen 5 5600H (6C/12T hasta 4.2GHz)"].id_procesador,
                id_grafica_dedicada=graf_dict["NVIDIA GeForce GTX 1650 4GB"].id_grafica_dedicada,
                descripcion_marketing="Potencia equilibrada para arquitectura, diseño y juegos competitivos."
            )
            db.add(mod_vic)
            db.flush()

        # 7. Equipos Disponibles en Inventario
        laptops_semilla = [
            {
                "codigo_interno": "ZT-AN515-57",
                "serial": "NHQBWAA00112345",
                "modelo": mod_nitro,
                "pantalla": pan_gamer,
                "ram_gb": 16,
                "ram_detalles": "16 GB DDR4 (Expansible a 32GB)",
                "almacenamiento_gb": 512,
                "almacenamiento_detalles": "512 GB SSD NVMe M.2",
                "condicion": "exhibicion",
                "grado_estetico": "Open Box",
                "salud_bateria": 98,
                "ciclos": 15,
                "detalles": "Impecable en caja con plásticos y cargador original",
                "precio_compra": 450.00,
                "precio_venta": 590.00,
                "precio_oferta": 720.00,
                "foto": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"
            },
            {
                "codigo_interno": "ZT-T14-G2",
                "serial": "PC12XYZ456",
                "modelo": mod_t14,
                "pantalla": pan_oficina,
                "ram_gb": 16,
                "ram_detalles": "16 GB DDR4 Dual Channel",
                "almacenamiento_gb": 256,
                "almacenamiento_detalles": "256 GB SSD NVMe ultrarrápido",
                "condicion": "usado",
                "grado_estetico": "Grado A",
                "salud_bateria": 92,
                "ciclos": 85,
                "detalles": "Sin rayones notables, teclado en español impecable",
                "precio_compra": 310.00,
                "precio_venta": 440.00,
                "precio_oferta": 520.00,
                "foto": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"
            },
            {
                "codigo_interno": "ZT-LAT-5420",
                "serial": "8B99XZ2",
                "modelo": mod_lat,
                "pantalla": pan_oficina,
                "ram_gb": 16,
                "ram_detalles": "16 GB DDR4 (2x8GB)",
                "almacenamiento_gb": 512,
                "almacenamiento_detalles": "512 GB SSD NVMe M.2",
                "condicion": "usado",
                "grado_estetico": "Grado A",
                "salud_bateria": 94,
                "ciclos": 60,
                "detalles": "Batería de larga duración, cargador Dell Tipo C original",
                "precio_compra": 280.00,
                "precio_venta": 395.00,
                "precio_oferta": 480.00,
                "foto": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"
            },
            {
                "codigo_interno": "ZT-VIC-15",
                "serial": "5CD2348911",
                "modelo": mod_vic,
                "pantalla": pan_gamer,
                "ram_gb": 16,
                "ram_detalles": "16 GB DDR4 3200MHz",
                "almacenamiento_gb": 512,
                "almacenamiento_detalles": "512 GB SSD NVMe",
                "condicion": "nuevo",
                "grado_estetico": "Nuevo Sellado",
                "salud_bateria": 100,
                "ciclos": 1,
                "detalles": "Caja sellada de fábrica, garantía de 6 meses",
                "precio_compra": 510.00,
                "precio_venta": 680.00,
                "precio_oferta": 790.00,
                "foto": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80"
            }
        ]

        for item in laptops_semilla:
            eq = db.query(models.Equipo).filter_by(codigo_interno=item["codigo_interno"]).first()
            if not eq:
                eq = models.Equipo(
                    codigo_interno=item["codigo_interno"],
                    serial_fabricante=item["serial"],
                    id_modelo=item["modelo"].id_modelo,
                    id_pantalla=item["pantalla"].id_pantalla,
                    ram_gb=item["ram_gb"],
                    ram_detalles=item["ram_detalles"],
                    almacenamiento_gb=item["almacenamiento_gb"],
                    almacenamiento_detalles=item["almacenamiento_detalles"],
                    condicion=item["condicion"],
                    grado_estetico=item["grado_estetico"],
                    salud_bateria_porcentaje=item["salud_bateria"],
                    ciclos_bateria=item["ciclos"],
                    detalles_observaciones=item["detalles"],
                    caja=True,
                    cargador=True,
                    garantia_meses=3 if item["condicion"] != "nuevo" else 6,
                    precio_compra=item["precio_compra"],
                    precio_venta=item["precio_venta"],
                    precio_oferta=item["precio_oferta"],
                    estado="disponible"
                )
                db.add(eq)
                db.flush()

                # Foto de portada
                media = models.Multimedia(
                    id_equipo=eq.id_equipo,
                    url=item["foto"],
                    tipo="foto",
                    es_portada=True,
                    orden=0
                )
                db.add(media)

        # 8. Saldos Iniciales en Cuentas (Capital de Trabajo de arranque)
        cuentas_fondos = [
            ("Zelle USD", 1200.00),
            ("Binance USDT", 850.00),
            ("Zinli USD", 350.00),
            ("Wallytech USD", 200.00),
            ("Efectivo USD", 400.00)
        ]
        total_inyeccion = sum(f[1] for f in cuentas_fondos)

        # Verificar si ya existe movimiento inicial
        existe_asiento = db.query(models.TransaccionLibroDiario).filter_by(tipo_movimiento="inyeccion_capital").first()
        if not existe_asiento:
            for nom, fondo in cuentas_fondos:
                c = db.query(models.CuentaFinanciera).filter_by(nombre=nom).first()
                if c:
                    c.saldo_actual = Decimal(str(fondo))

            asiento_capital = models.TransaccionLibroDiario(
                tipo_movimiento="inyeccion_capital",
                monto_total=Decimal(str(total_inyeccion)),
                impacto_capital=Decimal(str(total_inyeccion)),
                impacto_ganancia=Decimal("0.00"),
                concepto="Inyección inicial de Capital de Trabajo para compras de inventario"
            )
            db.add(asiento_capital)

        db.commit()
        print("Base de datos inicializada con éxito con catálogo, laptops semilla y saldos iniciales.")
    except Exception as e:
        db.rollback()
        print(f"Error en el sembrado de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
