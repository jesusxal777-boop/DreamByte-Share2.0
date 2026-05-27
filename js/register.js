/**
 * DreamByte Share 2.0 - Lógica de Registro de Usuarios
 */

window.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form') || document.querySelector('.login-form');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Capturamos los inputs (Asegúrate de que tu register.html tenga estos IDs exactos)
      const emailInput = document.getElementById('register-email') || document.querySelector('input[type="email"]');
      const passwordInput = document.getElementById('register-pass');
      const confirmPasswordInput = document.getElementById('confirm-pass');
      const usernameInput = document.getElementById('register-username') || document.getElementById('username');

      // Validamos en el cliente que las contraseñas coincidan
      if (passwordInput.value !== confirmPasswordInput.value) {
        alert("⚠️ Las contraseñas de sincronización no coinciden.");
        return;
      }

      const clienteSupa = window.supabaseClient || window.supabase;

      if (!clienteSupa) {
        alert("❌ Error de enlace: No se detectó la configuración de Supabase.");
        return;
      }

      try {
        // Creamos el usuario en Supabase Auth
        const { data, error } = await clienteSupa.auth.signUp({
          email: emailInput.value,
          password: passwordInput.value,
          options: {
            // Guardamos el nombre de usuario personalizado en los metadatos de la cuenta
            data: { 
              username: usernameInput ? usernameInput.value : emailInput.value.split('@')[0] 
            } 
          }
        });

        if (error) {
          alert(`❌ Fallo en la creación de identidad: ${error.message}`);
        } else {
          alert("🛰️ ¡Identidad en la nube creada con éxito! Se ha enviado un correo de confirmación (si está activo) o ya puedes iniciar sesión.");
          window.location.href = 'login.html'; // Redirigimos para que estrene su cuenta
        }
      } catch (err) {
        console.error("Error cuántico en el proceso de registro:", err);
        alert("🚀 Ocurrió un error inesperado al inicializar la cuenta.");
      }
    });
  }
});
