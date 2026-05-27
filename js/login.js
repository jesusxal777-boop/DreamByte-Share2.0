/**
 * DreamByte Share 2.0 - Lógica de Autenticación
 * Maneja el inicio de sesión con Supabase
 */

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form') || document.querySelector('.login-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Evita que la página se recargue

      // Capturamos los campos del formulario
      const emailInput = document.getElementById('email') || document.querySelector('input[type="email"]');
      const passwordInput = document.getElementById('password') || document.querySelector('input[type="password"]');
      
      // Buscamos el cliente global de Supabase que se creó en config.js
      const clienteSupa = window.supabaseClient || window.supabase;

      if (!clienteSupa) {
        alert("❌ Error: No se pudo conectar con Supabase.");
        return;
      }

      try {
        // Intentamos iniciar sesión con los datos ingresados
        const { data, error } = await clienteSupa.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
        });

        if (error) {
          alert(`❌ Acceso denegado: ${error.message}`);
        } else {
          alert("⚡ Enlace establecido. Bienvenido.");
          window.location.href = 'dashboard.html'; // Redirigimos al Hub
        }
      } catch (err) {
        console.error("Error en la terminal de inicio:", err);
      }
    });
  }
});
