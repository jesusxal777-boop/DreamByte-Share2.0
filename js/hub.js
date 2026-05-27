/**
 * DreamByte Share 2.0 - Hub & Storage Engine
 */

window.addEventListener('DOMContentLoaded', async () => {
  const clienteSupa = window.supabaseClient || window.supabase;

  if (!clienteSupa) {
    alert("❌ Error: Red de almacenamiento desconectada.");
    return;
  }

  // 1. Proteger la página: Si no hay sesión, patitas a la calle (al login)
  const { data: { session } } = await clienteSupa.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Cargar los archivos que ya existen en la nube
  listarArchivos();

  // 2. Lógica para Subir Archivos
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const file = fileInput.files[0];
      if (!file) {
        alert("⚠️ Por favor, selecciona un archivo primero.");
        return;
      }

      // Regla de Oro 1: Límite estricto de 100 MB (100 * 1024 * 1024 bytes)
      const LIMITE_MB = 100 * 1024 * 1024;
      if (file.size > LIMITE_MB) {
        alert("⚠️ Acceso denegado: El archivo excede el límite de 100 MB por usuario.");
        return;
      }

      // Crear un nombre único para que no se sobrescriban en la nube
      const nombreLimpio = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      try {
        alert("🛰️ Subiendo archivo a la Nebulosa de DreamByte... Espera un momento.");

        // Subir el archivo físico al Storage de Supabase
        const { data: storageData, error: storageError } = await clienteSupa.storage
          .from('dreambyte-files')
          .upload(nombreLimpio, file);

        if (storageError) throw storageError;

        // Obtener la URL pública de descarga directa
        const { data: urlData } = clienteSupa.storage
          .from('dreambyte-files')
          .getPublicUrl(nombreLimpio);

        alert("⚡ ¡Archivo inyectado con éxito!");
        fileInput.value = ''; // Limpiar el campo
        listarArchivos(); // Recargar la lista visual

      } catch (err) {
        console.error(err);
        alert(`❌ Fallo en la subida: ${err.message}`);
      }
    });
  }
});

// 3. Función para listar y renderizar los archivos guardados
async function listarArchivos() {
  const clienteSupa = window.supabaseClient || window.supabase;
  const listaContenedor = document.getElementById('files-list');
  if (!listaContenedor) return;

  listaContenedor.innerHTML = "<p class='loading-text'>Sincronizando con la nube...</p>";

  try {
    // Pedimos la lista de archivos guardados en el Bucket
    const { data, error } = await clienteSupa.storage.from('dreambyte-files').list();

    if (error) throw error;

    if (!data || data.length === 0 || (data.length === 1 && data[0].name === '.emptyFolderPlaceholder')) {
      listaContenedor.innerHTML = "<p class='empty-text'>🌌 La órbita está vacía. Sube el primer archivo.</p>";
      return;
    }

    listaContenedor.innerHTML = ''; // Limpiamos

    data.forEach(item => {
      if (item.name === '.emptyFolderPlaceholder') return;

      // Obtener URL de descarga
      const { data: urlData } = clienteSupa.storage.from('dreambyte-files').getPublicUrl(item.name);
      
      // Calcular tamaño legible
      const tamanoKB = (item.metadata.size / 1024).toFixed(1);
      const tamanoFinal = tamanoKB > 1024 ? `${(tamanoKB / 1024).toFixed(1)} MB` : `${tamanoKB} KB`;

      // Maquetar la tarjeta con estética Frutiger Glass
      const card = document.createElement('div');
      card.className = 'file-card';
      card.innerHTML = `
        <div class="file-info">
          <span class="file-icon">📄</span>
          <div class="file-details">
            <p class="file-name" title="${item.name}">${item.name.substring(14)}</p>
            <p class="file-meta">Tamaño: ${tamanoFinal} | ⏳ Expira si no hay descargas en 7 días</p>
          </div>
        </div>
        <div class="file-actions">
          <a href="${urlData.publicUrl}" download="${item.name}" target="_blank" class="btn-download">Descargar</a>
        </div>
      `;
      listaContenedor.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    listaContenedor.innerHTML = "<p class='error-text'>❌ Error al mapear los archivos de la nube.</p>";
  }
}

