/**
 * DreamByte Share 2.0 - Lógica de Inicio de Sesión
 */

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form') || document.querySelector('.login-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Evita que la página se recargue

      // Capturamos los campos del HTML por sus IDs
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      // Buscamos el cliente global de Supabase creado en config.js
      const clienteSupa = window.supabaseClient || window.supabase;

      if (!clienteSupa) {
        alert("❌ Error de enlace: No se detectó la configuración de Supabase en la terminal.");
        return;
      }

      try {
        // Petición de autenticación a Supabase
        const { data, error } = await clienteSupa.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
        });

        if (error) {
          // Si Supabase devuelve un error (datos incorrectos, usuario no existe, etc.)
          alert(`❌ Acceso denegado: ${error.message}`);
        } else {
          // Si todo sale bien
          alert("⚡ Enlace establecido con éxito. Bienvenido a DreamByte Share.");
          window.location.href = 'hub.html'; // Redirección al Hub principal
        }
      } catch (err) {
        console.error("Error cuántico en el proceso de login:", err);
        alert("🚀 Ocurrió un error inesperado al intentar conectar.");
      }
    });
  }
});
