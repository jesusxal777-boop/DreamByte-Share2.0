/**
 * DreamByte Share 2.0 - Supabase Infrastructure Connection
 * Conexión oficial enlazada al proyecto qynkgbgxavjgmvnskbsd
 */

// URL oficial de tu proyecto en Supabase
const SUPABASE_URL = "https://qynkgbgxavjgmvnskbsd.supabase.co";

// Tu clave pública anon verificada y vinculada
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bmtnYmd4YXZqZ212bnNrYnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDQ5NzMsImV4cCI6MjA5NTQyMDk3M30.2lbtOLD-pgKYYrJiNsaOIsw3oM3jaZUgccDA-68Y6JI";

// Inicializamos el cliente de forma global en el navegador
try {
    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("🛰️ Enlace cuántico establecido con el servidor qynkgbgxavjgmvnskbsd.");
    } else {
        console.error("❌ Error crítico: El CDN de Supabase no se cargó en el HTML.");
    }
} catch (error) {
    console.error("Fallo de inicialización en la red de Supabase:", error);
}
