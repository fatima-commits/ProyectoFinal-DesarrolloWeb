/**
 * Script de Autenticación - auth.js
 * Incluir en todas las páginas protegidas (home.html, habits.html, tasks.html)
 * 
 * Uso:
 * <script src="../assets/auth.js"></script>
 */

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtener el usuario del localStorage
 * @returns {Object|null} Datos del usuario o null si no existe
 */
function getLoggedUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

/**
 * Obtener el token de autenticación (contraseña)
 * @returns {string|null} Token de autenticación o null
 */
function getAuthToken() {
    return localStorage.getItem('authToken');
}

/**
 * Verificar si el usuario está autenticado
 * @returns {boolean}
 */
function isUserAuthenticated() {
    const user = getLoggedUser();
    const token = getAuthToken();
    return user && token && user.id;
}

/**
 * Hacer logout - limpiar localStorage y redirigir a login
 */
function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}

/**
 * Redirigir a login si no está autenticado
 * Llamar al inicio de cada página protegida
 */
function requireAuth() {
    if (!isUserAuthenticated()) {
        window.location.href = '/login.html';
    }
}

/**
 * Hacer una llamada API con autenticación automática
 * @param {string} url - URL del endpoint
 * @param {Object} options - Opciones de fetch
 * @returns {Promise}
 */
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['x-auth'] = token;
    }

    return fetch(url, {
        ...options,
        headers
    });
}

/**
 * Obtener datos del usuario actual
 * @returns {Object|null}
 */
function getCurrentUser() {
    return getLoggedUser();
}

/**
 * Mostrar nombre del usuario en la página
 * @param {string} elementId - ID del elemento donde mostrar el nombre
 */
function displayUserName(elementId = 'userName') {
    const user = getCurrentUser();
    const element = document.getElementById(elementId);
    
    if (element && user) {
        element.textContent = user.name;
    }
}

/**
 * Setup del navbar con opción de logout
 * Llamar después de que el DOM esté listo
 */
function setupAuthNavbar() {
    const user = getCurrentUser();
    
    // Mostrar nombre del usuario si existe el elemento
    if (user) {
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = user.name;
        });
    }

    // Agregar evento de logout a botones con clase logout-btn
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                logout();
            }
        });
    });
}

/**
 * Mostrar/ocultar elementos según estado de autenticación
 */
function setupAuthElements() {
    const isAuth = isUserAuthenticated();

    // Elementos que solo deben verse si está autenticado
    const authRequired = document.querySelectorAll('[data-auth-required="true"]');
    authRequired.forEach(el => {
        el.style.display = isAuth ? '' : 'none';
    });

    // Elementos que solo deben verse sin autenticación
    const authForbidden = document.querySelectorAll('[data-auth-forbidden="true"]');
    authForbidden.forEach(el => {
        el.style.display = isAuth ? 'none' : '';
    });
}

// ============================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar elementos de autenticación
    setupAuthElements();
    
    // Configurar navbar
    setupAuthNavbar();
});

// ============================================
// MANEJO DE SESIÓN EXPIRADA
// ============================================

/**
 * Verificar si la sesión es válida cada cierto tiempo
 */
function startSessionCheck(intervalMs = 5000) {
    setInterval(() => {
        if (!isUserAuthenticated()) {
            console.log('Sesión expirada o inválida');
            logout();
        }
    }, intervalMs);
}

// Opcional: Iniciar verificación de sesión
// startSessionCheck(60000); // Verificar cada minuto