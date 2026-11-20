-- ==============================================================================
-- SISTEMA INTEGRADO ZENDROXTECH VE: INVENTARIO, E-COMMERCE Y CONTABILIDAD
-- Versión: 2.0 (Normalizada 3FN, Multi-billetera, Integración n8n y Landing Page)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLAS MAESTRAS DE HARDWARE Y ESPECIFICACIONES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marca (
    id_marca SERIAL PRIMARY KEY,
    nombre_marca VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS linea (
    id_linea SERIAL PRIMARY KEY,
    id_marca INT NOT NULL REFERENCES marca(id_marca) ON DELETE RESTRICT,
    nombre_linea VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS procesador (
    id_procesador SERIAL PRIMARY KEY,
    nombre_procesador VARCHAR(100) NOT NULL,
    grafica_integrada VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS grafica_dedicada (
    id_grafica_dedicada SERIAL PRIMARY KEY,
    nombre_grafica_dedicada VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS resolucion (
    id_resolucion SERIAL PRIMARY KEY,
    nombre_resolucion VARCHAR(50) NOT NULL, -- Ej: 'Full HD (1920x1080)', 'QHD (2560x1440)'
    ancho_px INT NOT NULL,
    alto_px INT NOT NULL
);

CREATE TABLE IF NOT EXISTS pulgada (
    id_pulgada SERIAL PRIMARY KEY,
    valor_pulgadas NUMERIC(3,1) NOT NULL UNIQUE -- Ej: 13.3, 14.0, 15.6, 16.0, 17.3
);

CREATE TABLE IF NOT EXISTS hzs (
    id_hzs SERIAL PRIMARY KEY,
    numero_hzs INT NOT NULL UNIQUE -- Ej: 60, 120, 144, 165, 240
);

CREATE TABLE IF NOT EXISTS tipo_pantalla (
    id_tipo_pantalla SERIAL PRIMARY KEY,
    nombre_tipo_pantalla VARCHAR(30) NOT NULL UNIQUE -- Ej: 'IPS', 'OLED', 'TN', 'VA'
);

CREATE TABLE IF NOT EXISTS pantalla (
    id_pantalla SERIAL PRIMARY KEY,
    id_resolucion INT NOT NULL REFERENCES resolucion(id_resolucion) ON DELETE RESTRICT,
    id_pulgada INT NOT NULL REFERENCES pulgada(id_pulgada) ON DELETE RESTRICT,
    id_hzs INT NOT NULL REFERENCES hzs(id_hzs) ON DELETE RESTRICT,
    id_tipo_pantalla INT NOT NULL REFERENCES tipo_pantalla(id_tipo_pantalla) ON DELETE RESTRICT,
    tactil BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS modelo (
    id_modelo SERIAL PRIMARY KEY,
    nombre_modelo VARCHAR(120) NOT NULL, -- Ej: 'Nitro 5 AN515-57', 'ThinkPad T14 Gen 2'
    id_linea INT NOT NULL REFERENCES linea(id_linea) ON DELETE RESTRICT,
    id_procesador INT NOT NULL REFERENCES procesador(id_procesador) ON DELETE RESTRICT,
    id_grafica_dedicada INT REFERENCES grafica_dedicada(id_grafica_dedicada) ON DELETE SET NULL,
    descripcion_marketing TEXT
);

-- ------------------------------------------------------------------------------
-- 2. INVENTARIO FÍSICO UNITARIO (LAPTOPS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS equipo (
    id_equipo SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(50) NOT NULL UNIQUE, -- Código SKU autogenerado irrepetible (Ej: 'ZT-001')
    serial_fabricante VARCHAR(100) NULL,        -- Serial de fábrica / BIOS (Opcional)
    id_modelo INT NOT NULL REFERENCES modelo(id_modelo) ON DELETE RESTRICT,
    id_pantalla INT NOT NULL REFERENCES pantalla(id_pantalla) ON DELETE RESTRICT,
    
    -- Hardware puntual de la unidad
    ram_gb INT NOT NULL,
    ram_detalles VARCHAR(100), -- Ej: '16 GB DDR4 (Expansible a 32GB)'
    almacenamiento_gb INT NOT NULL,
    almacenamiento_detalles VARCHAR(100), -- Ej: '512 GB SSD NVMe M.2'
    
    -- Estado comercial y físico
    condicion VARCHAR(20) NOT NULL CHECK (condicion IN ('nuevo', 'exhibicion', 'usado')),
    grado_estetico VARCHAR(20) NULL, -- 'Grado A', 'Grado B', 'Open Box'
    salud_bateria_porcentaje INT NULL CHECK (salud_bateria_porcentaje BETWEEN 0 AND 100),
    ciclos_bateria INT NULL,
    detalles_observaciones TEXT NULL, -- Marcas de uso, detalles estéticos específicos
    caja BOOLEAN DEFAULT FALSE,
    cargador BOOLEAN DEFAULT TRUE,
    garantia_meses INT DEFAULT 3,
    
    -- Precios contables (en USD)
    precio_compra NUMERIC(12,2) NOT NULL, -- Costo de adquisición / Capital invertido
    precio_venta NUMERIC(12,2) NOT NULL,  -- Precio de lista al público
    precio_oferta NUMERIC(12,2) NULL,     -- Precio tachado o descuento promocional
    
    -- Estado de ciclo de vida
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible' 
        CHECK (estado IN ('disponible', 'reservado', 'vendido', 'servicio_tecnico', 'devolucion')),
    
    -- Categorías e Ideal Software personalizados
    categorias VARCHAR(250) NULL,
    ideal_software VARCHAR(300) NULL,

    -- Timestamps
    fecha_ingreso TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_venta TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_equipo_estado ON equipo(estado);
CREATE INDEX idx_equipo_codigo ON equipo(codigo_interno);

-- ------------------------------------------------------------------------------
-- 3. ARCHIVOS MULTIMEDIA (FOTOS Y VIDEOS)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS multimedia (
    id_multimedia SERIAL PRIMARY KEY,
    id_modelo INT NULL REFERENCES modelo(id_modelo) ON DELETE CASCADE,  -- Para fotos de catálogo/promocionales
    id_equipo INT NULL REFERENCES equipo(id_equipo) ON DELETE CASCADE,  -- Para fotos reales de la unidad usada
    url VARCHAR(500) NOT NULL,                                         -- Ruta local (/uploads/...) o URL de CDN
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('foto', 'video')),
    es_portada BOOLEAN DEFAULT FALSE,
    orden INT DEFAULT 0,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pertenencia CHECK (id_modelo IS NOT NULL OR id_equipo IS NOT NULL)
);

CREATE INDEX idx_multimedia_equipo ON multimedia(id_equipo);
CREATE INDEX idx_multimedia_modelo ON multimedia(id_modelo);

-- ------------------------------------------------------------------------------
-- 4. CONTABILIDAD Y TESORERÍA (BILLETERAS MULTI-MONEDA Y LIBRO DIARIO)
-- ------------------------------------------------------------------------------

-- Catálogo de Cuentas / Billeteras (editable desde la interfaz)
CREATE TABLE IF NOT EXISTS cuenta_financiera (
    id_cuenta SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- 'Binance USDT', 'Zinli USD', 'Wallytech USD', 'Zelle USD', 'Efectivo USD'
    moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
    saldo_actual NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Libro Diario: Asientos de doble impacto (Capital vs Ganancia)
CREATE TABLE IF NOT EXISTS transaccion_libro_diario (
    id_transaccion SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'venta_equipo',          -- Ingreso por venta (separa retorno de capital y ganancia líquida)
        'compra_equipo',         -- Salida para compra de inventario (consume capital)
        'reinversion_ganancia',  -- Traspaso interno de Ganancia hacia Capital de trabajo
        'retiro_ganancia',       -- Retiro personal del dueño de ganancias generadas
        'retiro_capital',        -- Retiro de capital de trabajo
        'inyeccion_capital',     -- Entrada de capital nuevo de inversión
        'gasto_operativo',       -- Gastos varios (delivery, embalaje, publicidad, servicios)
        'transferencia_cuentas'  -- Movimiento entre billeteras (Ej: Zelle -> Zinli)
    )),
    id_cuenta_origen INT NULL REFERENCES cuenta_financiera(id_cuenta) ON DELETE RESTRICT,
    id_cuenta_destino INT NULL REFERENCES cuenta_financiera(id_cuenta) ON DELETE RESTRICT,
    
    monto_total NUMERIC(12,2) NOT NULL,
    impacto_capital NUMERIC(12,2) NOT NULL DEFAULT 0.00,   -- (+) Aumenta o (-) Disminuye Capital de Trabajo
    impacto_ganancia NUMERIC(12,2) NOT NULL DEFAULT 0.00,  -- (+) Aumenta o (-) Disminuye Ganancia Acumulada
    
    concepto VARCHAR(255) NOT NULL,
    referencia_pago VARCHAR(100) NULL,
    notas TEXT NULL
);

CREATE INDEX idx_transaccion_fecha ON transaccion_libro_diario(fecha);

-- ------------------------------------------------------------------------------
-- 5. CLIENTES, VENTAS Y CONEXIÓN CON n8n (NOTAS DE ENTREGA)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cliente (
    id_cliente SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    cedula_rif VARCHAR(30) NOT NULL UNIQUE,
    telefono VARCHAR(30) NOT NULL,
    correo VARCHAR(120) NULL,
    ubicacion TEXT NOT NULL, -- Dirección, ciudad o estado (usado en la nota de entrega)
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venta (
    id_venta SERIAL PRIMARY KEY,
    numero_orden VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'ZT-ORD-1001'
    id_cliente INT NOT NULL REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    id_equipo INT NOT NULL UNIQUE REFERENCES equipo(id_equipo) ON DELETE RESTRICT, -- 1 venta = 1 laptop unitaria
    
    -- Desglose financiero
    precio_venta NUMERIC(12,2) NOT NULL,
    costo_equipo NUMERIC(12,2) NOT NULL,
    ganancia_neta NUMERIC(12,2) NOT NULL, -- precio_venta - costo_equipo
    
    -- Cuenta donde entró el dinero
    id_cuenta_destino INT NOT NULL REFERENCES cuenta_financiera(id_cuenta) ON DELETE RESTRICT,
    metodo_pago_nombre VARCHAR(50) NOT NULL, -- 'Zelle', 'Zinli', 'Wallytech', 'Binance', 'Efectivo'
    referencia_comprobante VARCHAR(100) NULL,
    
    -- Integración n8n
    n8n_procesado BOOLEAN NOT NULL DEFAULT FALSE,
    n8n_fecha_envio TIMESTAMP WITH TIME ZONE NULL,
    n8n_pdf_url TEXT NULL,
    
    id_transaccion_contable INT NULL REFERENCES transaccion_libro_diario(id_transaccion) ON DELETE SET NULL,
    fecha_venta TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 6. DATOS SEMILLA INICIALES (BILLETERAS SOLICITADAS)
-- ------------------------------------------------------------------------------

INSERT INTO cuenta_financiera (nombre, moneda, saldo_actual, activa) VALUES
('Binance USDT', 'USD', 0.00, TRUE),
('Zinli USD', 'USD', 0.00, TRUE),
('Wallytech USD', 'USD', 0.00, TRUE),
('Zelle USD', 'USD', 0.00, TRUE),
('Efectivo USD', 'USD', 0.00, TRUE)
ON CONFLICT (nombre) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. VISTA PARA LA LANDING PAGE (CATÁLOGO DE PRODUCTOS EN TIEMPO REAL)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW vista_laptops_catalogo_web AS
SELECT 
    e.id_equipo,
    e.codigo_interno AS sku,
    m.nombre_marca AS marca,
    l.nombre_linea AS linea,
    mo.nombre_modelo AS modelo,
    CONCAT(m.nombre_marca, ' ', mo.nombre_modelo, ' ', p.valor_pulgadas, '" ', res.nombre_resolucion, ' ', hz.numero_hzs, 'Hz') AS titulo_comercial,
    e.precio_venta AS precio,
    e.precio_oferta AS precio_anterior,
    e.condicion,
    e.grado_estetico,
    CONCAT(e.garantia_meses, ' Meses de Garantía') AS garantia,
    e.ram_gb,
    e.ram_detalles,
    e.almacenamiento_gb,
    e.almacenamiento_detalles,
    proc.nombre_procesador AS cpu,
    COALESCE(graf.nombre_grafica_dedicada, proc.grafica_integrada) AS gpu,
    CONCAT(p.valor_pulgadas, '" ', res.nombre_resolucion, ' ', tp.nombre_tipo_pantalla, ' ', hz.numero_hzs, 'Hz') AS pantalla,
    e.salud_bateria_porcentaje,
    e.detalles_observaciones,
    e.caja,
    e.cargador,
    e.estado,
    (
        SELECT url FROM multimedia 
        WHERE (id_equipo = e.id_equipo OR id_modelo = mo.id_modelo) 
          AND es_portada = TRUE 
        LIMIT 1
    ) AS imagen_portada
FROM equipo e
JOIN modelo mo ON e.id_modelo = mo.id_modelo
JOIN linea l ON mo.id_linea = l.id_linea
JOIN marca m ON l.id_marca = m.id_marca
JOIN procesador proc ON mo.id_procesador = proc.id_procesador
LEFT JOIN grafica_dedicada graf ON mo.id_grafica_dedicada = graf.id_grafica_dedicada
JOIN pantalla pan ON e.id_pantalla = pan.id_pantalla
JOIN pulgada p ON pan.id_pulgada = p.id_pulgada
JOIN resolucion res ON pan.id_resolucion = res.id_resolucion
JOIN hzs hz ON pan.id_hzs = hz.id_hzs
JOIN tipo_pantalla tp ON pan.id_tipo_pantalla = tp.id_tipo_pantalla
WHERE e.estado = 'disponible';
