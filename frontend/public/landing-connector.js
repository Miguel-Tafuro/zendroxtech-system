/**
 * Conector en Tiempo Real para zendroxtech_e_commerce_store.html
 * Consume GET /api/public/laptops y sincroniza el catálogo de productos disponibles
 */
const API_PUBLIC_URL = "/api/public/laptops";

async function sincronizarCatalogoZendrox() {
  try {
    const response = await fetch(API_PUBLIC_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      window.productsDB = data;
      if (typeof window.renderProducts === "function") {
        window.renderProducts();
      }
      console.log(`[ZendroxTech] Catálogo actualizado en vivo: ${data.length} laptops disponibles.`);
    }
  } catch (err) {
    console.warn("[ZendroxTech] Modo sin conexión / API no detectada. Usando catálogo local.", err);
  }
}

// Ejecutar sincronización al cargar la página
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", sincronizarCatalogoZendrox);
} else {
  sincronizarCatalogoZendrox();
}
