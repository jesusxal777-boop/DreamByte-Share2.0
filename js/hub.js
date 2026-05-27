/**
 * DreamByte Share 2.0 - Hub, Storage & Social Engine
 */

window.addEventListener('DOMContentLoaded', async () => {
  const clienteSupa = window.supabaseClient || window.supabase;

  if (!clienteSupa) {
    alert("❌ Error: Red de almacenamiento desconectada.");
    return;
  }

  // Proteger la página
  const { data: { session } } = await clienteSupa.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  // Guardar datos del usuario en ventana global para usar en likes/comentarios
  window.usuarioActivo = session.user;

  // Cargar los archivos
  listarArchivos();

  // Lógica para Subir Archivos
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) return;

      const LIMITE_MB = 50 * 1024 * 1024; // 50MB
      if (file.size > LIMITE_MB) {
        alert("⚠️ El plan gratuito limita las subidas a 50 MB por archivo.");
        return;
      }

      const nombreLimpio = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      try {
        alert("🛰️ Subiendo archivo a la Nebulosa...");
        const { error: storageError } = await clienteSupa.storage
          .from('dreambyte-files')
          .upload(nombreLimpio, file);

        if (storageError) throw storageError;

        alert("⚡ ¡Archivo inyectado con éxito!");
        fileInput.value = '';
        listarArchivos();
      } catch (err) {
        alert(`❌ Fallo: ${err.message}`);
      }
    });
  }
});

// Función principal para renderizar el feed
async function listarArchivos() {
  const clienteSupa = window.supabaseClient || window.supabase;
  const listaContenedor = document.getElementById('files-list');
  if (!listaContenedor) return;

  listaContenedor.innerHTML = "<p class='loading-text'>Sincronizando con la nube...</p>";

  try {
    const { data: archivos, error } = await clienteSupa.storage.from('dreambyte-files').list();
    if (error) throw error;

    if (!archivos || archivos.length === 0 || (archivos.length === 1 && archivos[0].name === '.emptyFolderPlaceholder')) {
      listaContenedor.innerHTML = "<p class='empty-text'>🌌 La órbita está vacía.</p>";
      return;
    }

    listaContenedor.innerHTML = '';

    // Mapear cada archivo e inyectarle contadores de Supabase
    for (const item of archivos) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      const { data: urlData } = clienteSupa.storage.from('dreambyte-files').getPublicUrl(item.name);
      const tamanoKB = (item.metadata.size / 1024).toFixed(1);
      const tamanoFinal = tamanoKB > 1024 ? `${(tamanoKB / 1024).toFixed(1)} MB` : `${tamanoKB} KB`;

      // Consultar Likes de este archivo en tiempo real
      const { count: totalLikes } = await clienteSupa
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('file_name', item.name);

      // Consultar si el usuario actual ya le dio like
      const { data: yaTieneLike } = await clienteSupa
        .from('likes')
        .select('id')
        .eq('file_name', item.name)
        .eq('user_id', window.usuarioActivo.id);

      const claseLike = yaTieneLike && yaTieneLike.length > 0 ? 'btn-like activo' : 'btn-like';

      // Crear tarjeta visual
      const card = document.createElement('div');
      card.className = 'file-card';
      card.innerHTML = `
        <div class="file-info">
          <span class="file-icon">📄</span>
          <div class="file-details">
            <p class="file-name" title="${item.name}">${item.name.substring(14)}</p>
            <p class="file-meta">Tamaño: ${tamanoFinal}</p>
          </div>
        </div>
        
        <div class="social-actions">
          <button class="${claseLike}" onclick="interactuarLike('${item.name}', this)">
            ❤️ <span class="like-count">${totalLikes || 0}</span>
          </button>
          <a href="${urlData.publicUrl}" download="${item.name}" target="_blank" class="btn-download">Descargar</a>
        </div>

        <div class="comments-section">
          <div class="comments-list" id="box-${btoa(item.name).replace(/=/g, '')}">
            <small class="loading-text">Cargando notas...</small>
          </div>
          <div class="comment-input-box">
            <input type="text" placeholder="Escribe un comentario..." id="input-${btoa(item.name).replace(/=/g, '')}">
            <button onclick="enviarComentario('${item.name}')">💬</button>
          </div>
        </div>
      `;
      listaContenedor.appendChild(card);
      
      // Cargar los comentarios de este archivo de inmediato
      renderizarComentarios(item.name);
    }

  } catch (err) {
    console.error(err);
    listaContenedor.innerHTML = "<p class='error-text'>❌ Error al mapear los archivos.</p>";
  }
}

// Lógica para dar y quitar Likes
async function interactuarLike(fileName, boton) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const contadorSpan = boton.querySelector('.like-count');
  let currentLikes = parseInt(contadorSpan.innerText);

  if (boton.classList.contains('activo')) {
    // Quitar like
    boton.classList.remove('activo');
    contadorSpan.innerText = currentLikes - 1;
    await clienteSupa.from('likes').delete().eq('file_name', fileName).eq('user_id', window.usuarioActivo.id);
  } else {
    // Dar like
    boton.classList.add('activo');
    contadorSpan.innerText = currentLikes + 1;
    await clienteSupa.from('likes').insert([{ file_name: fileName, user_id: window.usuarioActivo.id }]);
  }
}

// Lógica para renderizar los comentarios guardados
async function renderizarComentarios(fileName) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const cajaId = `box-${btoa(fileName).replace(/=/g, '')}`;
  const caja = document.getElementById(cajaId);
  if (!caja) return;

  const { data: comentarios, error } = await clienteSupa
    .from('comments')
    .select('*')
    .eq('file_name', fileName)
    .order('created_at', { ascending: true });

  if (error || !comentarios || comentarios.length === 0) {
    caja.innerHTML = "<p class='no-comments'>Sin comentarios aún.</p>";
    return;
  }

  caja.innerHTML = comentarios.map(c => `
    <div class="comment-item">
      <strong>@${c.username}:</strong> <span>${c.comment_text}</span>
    </div>
  `).join('');
}

// Lógica para enviar un nuevo comentario
async function enviarComentario(fileName) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const inputId = `input-${btoa(fileName).replace(/=/g, '')}`;
  const input = document.getElementById(inputId);
  
  if (!input || input.value.trim() === '') return;

  // Usamos el email o parte de él como nombre temporal si no guardaron username
  const nickname = window.usuarioActivo.user_metadata.username || window.usuarioActivo.email.split('@')[0];

  const { error } = await clienteSupa.from('comments').insert([{
    file_name: fileName,
    user_id: window.usuarioActivo.id,
    username: nickname,
    comment_text: input.value.trim()
  }]);

  if (error) {
    alert("No se pudo publicar el comentario.");
  } else {
    input.value = '';
    renderizarComentarios(fileName); // Recargar sublista
  }
}
