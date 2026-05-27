/**
 * DreamByte Share 2.0 - Lógica de Inicio de Sesión
 */

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form') || document.querySelector('.login-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      const clienteSupa = window.supabaseClient || window.supabase;

      if (!clienteSupa) {
        alert("❌ Error de enlace: No se detectó la configuración de Supabase.");
        return;
      }

      try {
        const { data, error } = await clienteSupa.auth.signInWithPassword({
          email: emailInput.value,
          password: passwordInput.value,
        });

        if (error) {
          alert(`❌ Acceso denegado: ${error.message}`);
        } else {
          alert("⚡ Enlace establecido con éxito. Bienvenido a DreamByte Share.");
          window.location.href = 'hub.html'; // <-- CORREGIDO: Redirige directo a tu hub.html
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
});
