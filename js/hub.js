/**
 * DreamByte Share 2.0 - Hub Especializado con Sistema de Rangos (RBAC)
 */

window.addEventListener('DOMContentLoaded', async () => {
  const clienteSupa = window.supabaseClient || window.supabase;

  if (!clienteSupa) {
    alert("❌ Error: Red de almacenamiento desconectada.");
    return;
  }

  // 1. Proteger la página
  const { data: { session } } = await clienteSupa.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  window.usuarioActivo = session.user;

  // 2. Obtener el rango real del usuario desde la tabla 'profiles'
  try {
    const { data: perfil, error } = await clienteSupa
      .from('profiles')
      .select('role, username')
      .eq('id', window.usuarioActivo.id)
      .single();

    if (!error && perfil) {
      window.usuarioActivo.rango = perfil.role;
      window.usuarioActivo.username = perfil.username;
    } else {
      window.usuarioActivo.rango = 'usuario'; // Por si acaso
      window.usuarioActivo.username = window.usuarioActivo.email.split('@')[0];
    }
  } catch (err) {
    window.usuarioActivo.rango = 'usuario';
  }

  // Cargar los archivos de la nube
  listarArchivos();

  // 3. Lógica para Subir Archivos
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) return;

      const LIMITE_MB = 50 * 1024 * 1024; // Límite del plan gratis
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

// 4. Listar Archivos con botones de Moderación / Admin
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

    for (const item of archivos) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      const { data: urlData } = clienteSupa.storage.from('dreambyte-files').getPublicUrl(item.name);
      const tamanoKB = (item.metadata.size / 1024).toFixed(1);
      const tamanoFinal = tamanoKB > 1024 ? `${(tamanoKB / 1024).toFixed(1)} MB` : `${tamanoKB} KB`;

      // Consultar Likes
      const { count: totalLikes } = await clienteSupa
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('file_name', item.name);

      const { data: yaTieneLike } = await clienteSupa
        .from('likes')
        .select('id')
        .eq('file_name', item.name)
        .eq('user_id', window.usuarioActivo.id);

      const claseLike = yaTieneLike && yaTieneLike.length > 0 ? 'btn-like activo' : 'btn-like';

      // 👑 SUPERPODER: Si eres Admin o Mod, se genera el botón de borrado
      let botonBorrar = '';
      if (window.usuarioActivo.rango === 'admin' || window.usuarioActivo.rango === 'moderador') {
        botonBorrar = `<button class="btn-delete-file" onclick="borrarArchivoDeLaNube('${item.name}')">🗑️ Borrar</button>`;
      }

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
          <div class="action-buttons-group">
            <a href="${urlData.publicUrl}" download="${item.name}" target="_blank" class="btn-download">Descargar</a>
            ${botonBorrar}
          </div>
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
      renderizarComentarios(item.name);
    }

  } catch (err) {
    listaContenedor.innerHTML = "<p class='error-text'>❌ Error al mapear los archivos.</p>";
  }
}

// Lógica de Likes
async function interactuarLike(fileName, boton) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const contadorSpan = boton.querySelector('.like-count');
  let currentLikes = parseInt(contadorSpan.innerText);

  if (boton.classList.contains('activo')) {
    boton.classList.remove('activo');
    contadorSpan.innerText = currentLikes - 1;
    await clienteSupa.from('likes').delete().eq('file_name', fileName).eq('user_id', window.usuarioActivo.id);
  } else {
    boton.classList.add('activo');
    contadorSpan.innerText = currentLikes + 1;
    await clienteSupa.from('likes').insert([{ file_name: fileName, user_id: window.usuarioActivo.id }]);
  }
}

// Renderizar Comentarios con Etiquetas de Rango
async function renderizarComentarios(fileName) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const cajaId = `box-${btoa(fileName).replace(/=/g, '')}`;
  const caja = document.getElementById(cajaId);
  if (!caja) return;

  // Hacemos un JOIN interno para traer el comentario junto con el rango del perfil
  const { data: comentarios, error } = await clienteSupa
    .from('comments')
    .select(`
      id,
      comment_text,
      username,
      user_id,
      profiles (role)
    `)
    .eq('file_name', fileName)
    .order('id', { ascending: true });

  if (error || !comentarios || comentarios.length === 0) {
    caja.innerHTML = "<p class='no-comments'>Sin comentarios aún.</p>";
    return;
  }

  caja.innerHTML = comentarios.map(c => {
    const rangoUser = c.profiles ? c.profiles.role : 'usuario';
    // Le asignamos una clase CSS según el rango para pintarlo brillante
    return `
      <div class="comment-item">
        <span class="badge-role role-${rangoUser}">${rangoUser.toUpperCase()}</span>
        <strong>@${c.username}:</strong> <span>${c.comment_text}</span>
      </div>
    `;
  }).join('');
}

// Enviar Comentario
async function enviarComentario(fileName) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const inputId = `input-${btoa(fileName).replace(/=/g, '')}`;
  const input = document.getElementById(inputId);
  if (!input || input.value.trim() === '') return;

  const { error } = await clienteSupa.from('comments').insert([{
    file_name: fileName,
    user_id: window.usuarioActivo.id,
    username: window.usuarioActivo.username,
    comment_text: input.value.trim()
  }]);

  if (!error) {
    input.value = '';
    renderizarComentarios(fileName);
  }
}

// 👑 EXCLUSIVO ADMIN: Función para borrar archivos del Storage
async function borrarArchivoDeLaNube(fileName) {
  if (!confirm("🚨 ¿Seguro que deseas purgar este archivo del búnker permanentemente?")) return;

  const clienteSupa = window.supabaseClient || window.supabase;

  try {
    const { error } = await clienteSupa.storage.from('dreambyte-files').remove([fileName]);
    if (error) throw error;
    
    alert("💥 Archivo eliminado del búnker.");
    listarArchivos(); // Recargar el feed
  } catch (err) {
    alert(`No se pudo borrar: ${err.message}`);
  }
}
