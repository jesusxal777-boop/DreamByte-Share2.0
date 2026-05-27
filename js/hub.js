/**
 * ==========================================================================
 * DreamByte Share 2.0 - Core Engine (Storage, Social & RBAC Architecture)
 * Developer: jesusxal777 (Admin & Creador)
 * ==========================================================================
 */

window.addEventListener('DOMContentLoaded', async () => {
  const clienteSupa = window.supabaseClient || window.supabase;

  if (!clienteSupa) {
    alert("❌ Error de enlace: No se detectó la configuración de Supabase.");
    return;
  }

  // 1. SISTEMA DE PROTECCIÓN: Verificar si hay una sesión activa
  const { data: { session }, error: sessionError } = await clienteSupa.auth.getSession();
  
  if (sessionError || !session) {
    window.location.href = 'login.html';
    return;
  }

  // Guardar datos del usuario globalmente para las interacciones sociales
  window.usuarioActivo = session.user;

  // 2. EXTRAER RANGO DESDE LA TABLA PROFILES
  try {
    const { data: perfil, error: perfilError } = await clienteSupa
      .from('profiles')
      .select('role, username')
      .eq('id', window.usuarioActivo.id);

    if (!perfilError && perfil && perfil.length > 0) {
      window.usuarioActivo.rango = perfil[0].role;
      window.usuarioActivo.username = perfil[0].username;
    } else {
      // Valores por defecto si la fila aún no se genera
      window.usuarioActivo.rango = 'usuario';
      window.usuarioActivo.username = window.usuarioActivo.id === '022db2dc-c698-4cc5-80d4-71be919db617' 
        ? 'jesusxal777' 
        : window.usuarioActivo.email.split('@')[0];
    }
  } catch (err) {
    window.usuarioActivo.rango = 'usuario';
    window.usuarioActivo.username = window.usuarioActivo.email.split('@')[0];
  }

  // Forzar firma del creador por UID absoluto
  if (window.usuarioActivo.id === '022db2dc-c698-4cc5-80d4-71be919db617') {
    window.usuarioActivo.rango = 'admin';
    window.usuarioActivo.username = 'jesusxal777';
  }

  // 3. ENTIRE FEED: Sincronizar y listar los archivos del almacenamiento
  listarArchivos();

  // 4. MOTOR DE CARGA: Lógica para subir archivos al búnker (Bucket)
  const uploadForm = document.getElementById('upload-form');
  const fileInput = document.getElementById('file-input');

  if (uploadForm) {
    uploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const file = fileInput.files[0];
      if (!file) return;

      // Restricción fija del plan gratuito de Supabase (50 Megabytes)
      const LIMITE_MB = 50 * 1024 * 1024; 
      if (file.size > LIMITE_MB) {
        alert("⚠️ Acceso denegado: El plan gratuito limita las subidas a 50 MB por archivo.");
        return;
      }

      // Sanitizar el nombre del archivo eliminando espacios problemáticos
      const nombreLimpio = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      try {
        alert("🛰️ Subiendo archivo al búnker de DreamByte...");
        
        const { error: storageError } = await clienteSupa.storage
          .from('dreambyte-files')
          .upload(nombreLimpio, file);

        if (storageError) throw storageError;

        alert("⚡ ¡Archivo inyectado con éxito!");
        fileInput.value = '';
        listarArchivos(); // Recargar el contenedor visual
      } catch (err) {
        alert(`❌ Fallo en el búnker: ${err.message}`);
      }
    });
  }
});

/**
 * RENDERIZADO GENERAL: Mapea los archivos de Supabase Storage y construye las tarjetas
 */
async function listarArchivos() {
  const clienteSupa = window.supabaseClient || window.supabase;
  const listaContenedor = document.getElementById('files-list');
  if (!listaContenedor) return;

  listaContenedor.innerHTML = "<p class='loading-text'>Sincronizando con el búnker...</p>";

  try {
    const { data: archivos, error } = await clienteSupa.storage.from('dreambyte-files').list();
    if (error) throw error;

    // Filtrar placeholders vacíos del panel
    if (!archivos || archivos.length === 0 || (archivos.length === 1 && archivos[0].name === '.emptyFolderPlaceholder')) {
      listaContenedor.innerHTML = "<p class='empty-text'>🌌 El almacenamiento está vacío.</p>";
      return;
    }

    listaContenedor.innerHTML = '';

    for (const item of archivos) {
      if (item.name === '.emptyFolderPlaceholder') continue;

      // Obtener el enlace público de descarga directa
      const { data: urlData } = clienteSupa.storage.from('dreambyte-files').getPublicUrl(item.name);
      
      // Calcular tamaño visual de forma elegante
      const tamanoKB = (item.metadata.size / 1024).toFixed(1);
      const tamanoFinal = tamanoKB > 1024 ? `${(tamanoKB / 1024).toFixed(1)} MB` : `${tamanoKB} KB`;

      // Consultar cantidad total de likes en tiempo real
      const { count: totalLikes } = await clienteSupa
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('file_name', item.name);

      // Verificar si el usuario en sesión ya presionó el botón de corazón
      const { data: yaTieneLike } = await clienteSupa
        .from('likes')
        .select('id')
        .eq('file_name', item.name)
        .eq('user_id', window.usuarioActivo.id);

      const claseLike = yaTieneLike && yaTieneLike.length > 0 ? 'btn-like activo' : 'btn-like';

      // 👑 CONTROL DE ACCESO: Si eres Admin o Mod, desplegar botón rojo de purga de archivos
      let botonBorrar = '';
      if (window.usuarioActivo.rango === 'admin' || window.usuarioActivo.rango === 'moderador') {
        botonBorrar = `<button class="btn-delete-file" onclick="borrarArchivoDeLaNube('${item.name}')">🗑️ Borrar</button>`;
      }

      // ID único codificado en Base64 para asociar las cajas de comentarios sin caracteres extraños
      const ID_COMPACTO = btoa(unescape(encodeURIComponent(item.name))).replace(/=/g, '').substring(0, 15);

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
          <div class="comments-list" id="box-${ID_COMPACTO}">
            <small class="loading-text">Cargando notas de red...</small>
          </div>
          <div class="comment-input-box">
            <input type="text" placeholder="Escribe un comentario..." id="input-${ID_COMPACTO}">
            <div class="comment-input-box-btn-wrapper">
              <button onclick="enviarComentario('${item.name}', '${ID_COMPACTO}')">💬</button>
            </div>
          </div>
        </div>
      `;
      listaContenedor.appendChild(card);
      
      // Cargar los comentarios asociados de forma asíncrona e independiente
      renderizarComentarios(item.name, ID_COMPACTO);
    }

  } catch (err) {
    console.error(err);
    listaContenedor.innerHTML = "<p class='error-text'>❌ Error al mapear el almacenamiento de red.</p>";
  }
}

/**
 * INTERACCIÓN DE LIKES: Alternar estados (Insert/Delete) de reacciones en la base de datos
 */
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

/**
 * RENDERIZADO DE COMENTARIOS: Carga las notas vinculadas a un archivo de forma aislada y segura
 */
async function renderizarComentarios(fileName, ID_COMPACTO) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const caja = document.getElementById(`box-${ID_COMPACTO}`);
  if (!caja) return;

  try {
    const { data: comentarios, error } = await clienteSupa
      .from('comments')
      .select('*')
      .eq('file_name', fileName)
      .order('id', { ascending: true });

    if (error) throw error;

    if (!comentarios || comentarios.length === 0) {
      caja.innerHTML = "<p class='no-comments'>Sin comentarios aún.</p>";
      return;
    }

    caja.innerHTML = '';

    for (const c of comentarios) {
      let rangoUser = 'usuario';

      try {
        // Consultar el rol del autor sin usar .single() para prevenir cierres forzados por desincronización
        const { data: prof, error: profError } = await clienteSupa
          .from('profiles')
          .select('role')
          .eq('id', c.user_id);

        if (!profError && prof && prof.length > 0) {
          rangoUser = prof[0].role;
        }
      } catch (e) {
        // El bucle sigue corriendo aunque no halle el perfil
        rangoUser = 'usuario';
      }

      // Forzar visualización estética de tu firma oficial
      let nombreFiltrado = c.username;
      if (c.user_id === '022db2dc-c698-4cc5-80d4-71be919db617') {
        rangoUser = 'admin';
        nombreFiltrado = 'jesusxal777';
      }

      const itemCom = document.createElement('div');
      itemCom.className = 'comment-item';
      itemCom.innerHTML = `
        <span class="badge-role role-${rangoUser}">${rangoUser.toUpperCase()}</span>
        <strong>@${nombreFiltrado}:</strong> <span>${c.comment_text}</span>
      `;
      caja.appendChild(itemCom);
    }
  } catch (err) {
    console.error(err);
    caja.innerHTML = "<p class='no-comments'>⚠️ Error al sincronizar notas.</p>";
  }
}

/**
 * PUBLICAR COMENTARIO: Registra una nueva interacción de texto en la base de datos
 */
async function enviarComentario(fileName, ID_COMPACTO) {
  const clienteSupa = window.supabaseClient || window.supabase;
  const input = document.getElementById(`input-${ID_COMPACTO}`);
  
  if (!input || input.value.trim() === '') return;

  const { error } = await clienteSupa.from('comments').insert([{
    file_name: fileName,
    user_id: window.usuarioActivo.id,
    username: window.usuarioActivo.username,
    comment_text: input.value.trim()
  }]);

  if (!error) {
    input.value = '';
    renderizarComentarios(fileName, ID_COMPACTO); // Refrescar solo esta sublista
  } else {
    alert("No se pudo registrar la nota en la red.");
  }
}

/**
 * 👑 RESERVADO - PURGA DE ARCHIVOS: Elimina un recurso del Storage de forma permanente
 */
async function borrarArchivoDeLaNube(fileName) {
  if (!confirm("🚨 Alerta del Creador: ¿Deseas purgar este archivo del búnker permanentemente?")) return;

  const clienteSupa = window.supabaseClient || window.supabase;

  try {
    const { error } = await clienteSupa.storage.from('dreambyte-files').remove([fileName]);
    if (error) throw error;
    
    alert("💥 Objeto destruido y purgado con éxito.");
    listarArchivos(); // Refrescar el feed principal
  } catch (err) {
    alert(`Operación cancelada por el servidor: ${err.message}`);
  }
}
