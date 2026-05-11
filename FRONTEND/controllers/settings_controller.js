/**
 * Settings Controller
 * Maneja la lógica de la página de configuración incluyendo:
 * - Carga de foto de perfil
 * - Edición de información del usuario
 * - Almacenamiento y recuperación de datos
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const PROFILE_PHOTO_KEY = 'profilePhoto';
const USER_DATA_KEY = 'userData';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// ═══════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
});

function initializeSettings() {
    // Cargar datos del usuario desde localStorage
    loadUserData();
    
    // Cargar foto de perfil si existe
    loadProfilePhoto();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar datos del localStorage en los inputs
    populateFormFields();
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════════

function setupEventListeners() {
    const avatarEditBtn = document.getElementById('avatarEditBtn');
    const profilePhotoInput = document.getElementById('profilePhotoInput');
    
    if (avatarEditBtn && profilePhotoInput) {
        // Click en botón de editar foto abre el input file
        avatarEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            profilePhotoInput.click();
        });
        
        // Cambio en el input file
        profilePhotoInput.addEventListener('change', handleProfilePhotoChange);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MANEJO DE CARGA DE FOTO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Manejador para cuando el usuario selecciona una foto
 */
function handleProfilePhotoChange(event) {
    const file = event.target.files[0];
    
    if (!file) {
        console.log('No file selected');
        return;
    }
    
    // Validar archivo
    if (!validatePhotoFile(file)) {
        return;
    }
    
    // Leer archivo como Data URL
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const photoData = e.target.result;
        
        // Guardar en localStorage
        saveProfilePhotoToStorage(photoData);
        
        // Actualizar preview en la UI
        displayProfilePhoto(photoData);
        
        // Mostrar notificación
        showNotification('Foto de perfil actualizada', 'success');
    };
    
    reader.onerror = () => {
        showNotification('Error al leer el archivo', 'error');
    };
    
    // Leer el archivo
    reader.readAsDataURL(file);
}

/**
 * Valida que el archivo sea una imagen válida
 */
function validatePhotoFile(file) {
    // Validar tipo de archivo
    if (!ALLOWED_FORMATS.includes(file.type)) {
        showNotification('Formato no permitido. Usa JPG, PNG, WebP o GIF', 'error');
        return false;
    }
    
    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
        showNotification('La foto es muy grande. Máximo 5 MB', 'error');
        return false;
    }
    
    return true;
}

/**
 * Guarda la foto en localStorage
 */
function saveProfilePhotoToStorage(photoData) {
    try {
        localStorage.setItem(PROFILE_PHOTO_KEY, photoData);
        console.log('Photo saved to localStorage');
    } catch (error) {
        console.error('Error saving photo to localStorage:', error);
        showNotification('Error al guardar la foto', 'error');
    }
}

/**
 * Carga la foto del localStorage y la muestra
 */
function loadProfilePhoto() {
    try {
        const photoData = localStorage.getItem(PROFILE_PHOTO_KEY);
        
        if (photoData) {
            displayProfilePhoto(photoData);
        }
    } catch (error) {
        console.error('Error loading profile photo:', error);
    }
}

/**
 * Muestra la foto de perfil en la UI
 */
function displayProfilePhoto(photoData) {
    const avatarImg = document.getElementById('avatarImg');
    const avatarPlaceholder = document.getElementById('avatarPlaceholder');
    
    if (avatarImg && avatarPlaceholder) {
        avatarImg.src = photoData;
        avatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    }
}

/**
 * Elimina la foto de perfil
 */
function removeProfilePhoto() {
    try {
        localStorage.removeItem(PROFILE_PHOTO_KEY);
        
        const avatarImg = document.getElementById('avatarImg');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        
        if (avatarImg && avatarPlaceholder) {
            avatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'block';
            avatarImg.src = '';
        }
        
        showNotification('Foto de perfil eliminada', 'success');
    } catch (error) {
        console.error('Error removing profile photo:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// MANEJO DE DATOS DE USUARIO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Carga los datos del usuario del localStorage
 */
function loadUserData() {
    try {
        const userData = localStorage.getItem(USER_DATA_KEY);
        if (userData) {
            console.log('User data loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Rellena los campos del formulario con datos del localStorage
 */
function populateFormFields() {
    try {
        const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
        
        // Rellenar campos si existen
        const nameInput = document.getElementById('nameInput');
        const emailInput = document.getElementById('emailInput');
        const weightInput = document.getElementById('weightInput');
        const heightInput = document.getElementById('heightInput');
        const passwordInput = document.getElementById('passwordInput');
        
        if (nameInput && userData.name) nameInput.value = userData.name;
        if (emailInput && userData.email) emailInput.value = userData.email;
        if (weightInput && userData.weight) weightInput.value = userData.weight;
        if (heightInput && userData.height) heightInput.value = userData.height;
        if (passwordInput && userData.password) passwordInput.value = userData.password;
        
    } catch (error) {
        console.error('Error populating form fields:', error);
    }
}

/**
 * Guarda los cambios del usuario
 */
function saveUserChanges() {
    try {
        // Recopilar datos del formulario
        const userData = {
            name: document.getElementById('nameInput').value,
            email: document.getElementById('emailInput').value,
            weight: document.getElementById('weightInput').value,
            height: document.getElementById('heightInput').value,
            password: document.getElementById('passwordInput').value,
            lastUpdated: new Date().toISOString()
        };
        
        // Validar que al menos haya un nombre
        if (!userData.name.trim()) {
            showNotification('Por favor ingresa tu nombre', 'error');
            return;
        }
        
        // Guardar en localStorage
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        
        // Mostrar notificación de éxito
        showNotification('Cambios guardados exitosamente', 'success');
        
        console.log('User data saved:', userData);
        
    } catch (error) {
        console.error('Error saving user changes:', error);
        showNotification('Error al guardar los cambios', 'error');
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Muestra una notificación al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success' o 'error'
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('uploadNotification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification) return;
    
    // Establecer mensaje
    notificationText.textContent = message;
    
    // Establecer clase según el tipo
    notification.classList.remove('error');
    if (type === 'error') {
        notification.classList.add('error');
    }
    
    // Mostrar notificación
    notification.style.display = 'block';
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

/**
 * Alterna la visibilidad de la contraseña
 */
function togglePassword() {
    const passwordInput = document.getElementById('passwordInput');
    
    if (passwordInput) {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
    }
}

/**
 * Calcula el IMC (Índice de Masa Corporal)
 * @returns {number|null} IMC o null si faltan datos
 */
function calculateBMI() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    const height = parseFloat(document.getElementById('heightInput').value);
    
    if (!weight || !height || height === 0) {
        return null;
    }
    
    // Convertir altura de cm a m
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    return Math.round(bmi * 10) / 10;
}

/**
 * Obtiene la categoría de IMC
 * @returns {string} Categoría del IMC
 */
function getBMICategory() {
    const bmi = calculateBMI();
    
    if (!bmi) return 'N/A';
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
}

/**
 * Exporta los datos del usuario como JSON
 */
function exportUserData() {
    try {
        const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
        const photoData = localStorage.getItem(PROFILE_PHOTO_KEY) ? 'Photo: Present' : 'Photo: Not set';
        
        const exportData = {
            ...userData,
            profilePhoto: photoData,
            bmi: calculateBMI(),
            bmiCategory: getBMICategory()
        };
        
        console.log('Exported user data:', exportData);
        return exportData;
        
    } catch (error) {
        console.error('Error exporting user data:', error);
        return null;
    }
}

/**
 * Limpia todos los datos del usuario
 */
function clearAllUserData() {
    const confirmed = confirm('¿Estás seguro? Esta acción eliminará todos tus datos.');
    
    if (!confirmed) return;
    
    try {
        localStorage.removeItem(PROFILE_PHOTO_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        
        // Limpiar formulario
        document.getElementById('nameInput').value = '';
        document.getElementById('emailInput').value = '';
        document.getElementById('weightInput').value = '';
        document.getElementById('heightInput').value = '';
        document.getElementById('passwordInput').value = '';
        
        // Resetear foto
        document.getElementById('avatarImg').style.display = 'none';
        document.getElementById('avatarPlaceholder').style.display = 'block';
        
        showNotification('Todos los datos han sido eliminados', 'success');
        
    } catch (error) {
        console.error('Error clearing user data:', error);
        showNotification('Error al eliminar los datos', 'error');
    }
}