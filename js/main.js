/**
 * DreamByte Share 2.0 - Core UI & UX Engine
 * Gestión de interacciones Frutiger Aero y Seguridad de Navegación
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🌌 Sistema DreamByte Share 2.0 Inicializado.");
    
    // 1. EJECUTAR SISTEMA DE SEGURIDAD (Solo en páginas privadas)
    protegerDashboard();

    // 2. INICIALIZAR EFECTOS VISUALES
    aplicarEfectosGlassmorphism();
    inicializarSubidaVisual();
});

/**
 * Guardián de Ruta (Client-side Security)
 * Evita que usuarios sin sesión entren al Dashboard o a la página de subida.
 */
async function protegerDashboard() {
    const paginasPrivadas = ['dashboard.html', 'upload.html'];
    
    // Obtenemos el nombre del archivo actual de la URL de forma segura
    const pathSeggments = window.location.pathname.split('/');
    const paginaActual = pathSeggments[pathSeggments.length - 1] || 'index.html';

    // Parche de seguridad: Si estamos en login o registro, ignorar la validación para evitar bucles
    if (paginaActual === 'login.html' || paginaActual === 'register.html') {
        return;
    }

    // Si la página actual no está marcada como privada, no hacemos nada
    if (!paginasPrivadas.includes(paginaActual)) {
        return;
    }

    // Verificamos la disponibilidad del cliente de Supabase
    const clientSupa = window.supabaseClient || window.supabase;
    
    if (!clientSupa) {
        console.error("⚠️ Error: No se detectó el núcleo de Supabase para validar accesos.");
        window.location.href = 'login.html';
        return;
    }

    try {
        // Validar si hay una sesión activa en el almacenamiento del navegador
        const { data: { session }, error } = await clientSupa.auth.getSession();

        if (error || !session) {
            console.warn("🔒 Acceso no autorizado detectado. Redirigiendo a la terminal de login.");
            window.location.href = 'login.html';
        } else {
            console.log(`📡 Enlace cuántico verificado para: ${session.user.email}`);
            
            // Renderizar nombre de usuario en la interfaz si el elemento existe
            const userDisplay = document.getElementById('user-display-name');
            if (userDisplay) {
                userDisplay.textContent = session.user.user_metadata.username || session.user.email.split('@')[0];
            }
        }
    } catch (err) {
        console.error("Error crítico durante la verificación de la sesión:", err);
        window.location.href = 'login.html';
    }
}

/**
 * Micro-interacciones Frutiger Aero Modernas
 * Controla los brillos dinámicos (Glossy) al pasar el mouse por los contenedores de cristal.
 */
function aplicarEfectosGlassmorphism() {
    const tarjetasGlass = document.querySelectorAll('.frutiger-glass');

    tarjetasGlass.forEach(tarjeta => {
        // Efecto de reflejo líquido que sigue levemente al cursor
        tarjeta.addEventListener('mousemove', (e) => {
            const rect = tarjeta.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Inyectamos variables CSS dinámicas para usarlas en destellos desde el CSS
            tarjeta.style.setProperty('--mouse-x', `${x}px`);
            tarjeta.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

/**
 * Lógica Visual de Arrastrar y Soltar (Dropzone)
 * Maneja los cambios de estado estéticos cuando arrastras un archivo en upload.html
 */
function inicializarSubidaVisual() {
    const dropzone = document.getElementById('dropzone');
    if (!dropzone) return;

    // Eventos cuando el archivo está sobre la zona de arrastre
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dropzone-active'); // Añade brillo neón en CSS
        }, false);
    });

    // Eventos cuando el archivo sale de la zona de arrastre o se suelta
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dropzone-active');
        }, false);
    });
}

/**
 * Función Global de Cierre de Sesión (Logout)
 * Úsala asignándola al botón de "Salir" en tu menú del Dashboard
 */
async function cerrarSesionTerminal() {
    const clientSupa = window.supabaseClient || window.supabase;
    if (clientSupa) {
        try {
            await clientSupa.auth.signOut();
            console.log("🔌 Enlace finalizado.");
            window.location.href = 'login.html';
        } catch (err) {
            console.error("Error al intentar cerrar sesión:", err);
            window.location.href = 'login.html';
        }
    } else {
        window.location.href = 'login.html';
    }
}
