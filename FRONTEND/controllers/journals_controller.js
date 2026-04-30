// ==========================================
// CONTROLADOR DE JOURNALS - FRONTEND
// ==========================================

const local_url = "http://localhost:3000/";

// ==========================================
// FUNCIONES DE CREACIÓN
// ==========================================

function createJournal(event) {
    event.preventDefault();

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        showNotification("Debes iniciar sesión primero", "error");
        window.location.href = local_url;
        return;
    }

    const title = document.getElementById('journalTitle')?.value.trim();
    const content = document.getElementById('journalContent')?.value.trim();
    const mood = document.querySelector('input[name="mood"]:checked')?.value || '😊';
    const date = document.getElementById('journalDate')?.value || new Date().toISOString().split('T')[0];

    // Validaciones
    if (!title) {
        showNotification("El título es obligatorio", "error");
        return;
    }

    if (!content) {
        showNotification("El contenido es obligatorio", "error");
        return;
    }

    if (title.length > 200) {
        showNotification("El título no puede exceder 200 caracteres", "error");
        return;
    }

    if (content.length > 5000) {
        showNotification("El contenido no puede exceder 5000 caracteres", "error");
        return;
    }

    const payload = {
        title,
        content,
        mood,
        date: new Date(date).toISOString()
    };

    fetch(local_url + 'journals', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.contraseña
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error al crear entrada');
            });
        }
        return response.json();
    })
    .then(data => {
        showNotification("¡Entrada de diario creada!", "success");
        document.getElementById('journalForm')?.reset();
        setTimeout(() => {
            loadJournals();
            switchScreen('entries-list-screen');
        }, 1500);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, "error");
    });
}

// ==========================================
// FUNCIONES DE LECTURA
// ==========================================

function loadJournals() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + 'journals?limit=100', {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar entradas');
        return response.json();
    })
    .then(data => {
        displayJournals(data.data);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al cargar los journals", "error");
    });
}

function displayJournals(journals) {
    const entriesList = document.getElementById('entriesList');
    if (!entriesList) return;

    entriesList.innerHTML = '';

    if (journals.length === 0) {
        entriesList.innerHTML = '<p class="no-entries">No hay entradas aún. ¡Crea una!</p>';
        return;
    }

    journals.forEach(journal => {
        const entryCard = createJournalCard(journal);
        entriesList.appendChild(entryCard);
    });
}

function createJournalCard(journal) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.id = `journal-${journal.id}`;

    const dateObj = new Date(journal.date);
    const dateString = dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const previewText = journal.content.substring(0, 100) + (journal.content.length > 100 ? '...' : '');
    const imagesCount = journal.images.length;
    const imagesIndicator = imagesCount > 0 ? `📷 ${imagesCount}` : '';

    card.innerHTML = `
        <div class="entry-card-top">
            <div class="entry-card-info">
                <span class="entry-card-date">${dateString}</span>
                <span class="entry-card-mood">${journal.mood}</span>
                <span class="entry-card-title">${journal.title}</span>
                ${imagesIndicator ? `<span class="entry-card-images">${imagesIndicator}</span>` : ''}
            </div>
            <div class="entry-card-actions">
                <button class="entry-edit-btn" onclick="editJournal(${journal.id})">✏️</button>
                <button class="entry-delete-btn" onclick="deleteJournal(${journal.id})">🗑️</button>
            </div>
        </div>
        <p class="entry-card-text">${previewText}</p>
    `;

    return card;
}

function loadJournalDetail(journalId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `journals/${journalId}`, {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar la entrada');
        return response.json();
    })
    .then(journal => {
        displayJournalDetail(journal);
        switchScreen('journal-detail');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al cargar la entrada", "error");
    });
}

function displayJournalDetail(journal) {
    const detailScreen = document.getElementById('journal-detail-content');
    if (!detailScreen) return;

    const dateObj = new Date(journal.date);
    const dateString = dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let imagesHTML = '';
    if (journal.images && journal.images.length > 0) {
        imagesHTML = `
            <div class="journal-images">
                <h3>Imágenes</h3>
                <div class="images-gallery">
                    ${journal.images.map(img => `
                        <div class="image-item">
                            <img src="${img}" alt="Imagen">
                            <button class="btn-delete-image" onclick="deleteImage(${journal.id}, '${img}')">×</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    detailScreen.innerHTML = `
        <div class="journal-detail-header">
            <h2>${journal.title}</h2>
            <span class="journal-mood">${journal.mood}</span>
            <span class="journal-date">${dateString}</span>
        </div>
        <div class="journal-content">
            ${journal.content}
        </div>
        ${imagesHTML}
        <div class="journal-actions">
            <button class="btn-edit" onclick="editJournal(${journal.id})">Editar</button>
            <label class="btn-upload">
                Subir imagen
                <input type="file" accept="image/*" onchange="uploadImage(event, ${journal.id})" hidden>
            </label>
            <button class="btn-delete" onclick="deleteJournal(${journal.id})">Eliminar entrada</button>
        </div>
    `;
}

// ==========================================
// FUNCIONES DE ACTUALIZACIÓN
// ==========================================

function editJournal(journalId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `journals/${journalId}`, {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar la entrada');
        return response.json();
    })
    .then(journal => {
        // Llenar el formulario con los datos
        document.getElementById('journalTitle').value = journal.title;
        document.getElementById('journalContent').value = journal.content;
        document.getElementById('journalDate').value = journal.date.split('T')[0];
        
        // Seleccionar mood
        document.querySelector(`input[value="${journal.mood}"]`).checked = true;

        // Cambiar función del botón
        const submitBtn = document.querySelector('.create-entry-btn');
        submitBtn.textContent = 'Actualizar entrada';
        submitBtn.onclick = () => updateJournalSubmit(journalId);

        switchScreen('new-entry');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al cargar la entrada", "error");
    });
}

function updateJournalSubmit(journalId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    const title = document.getElementById('journalTitle').value.trim();
    const content = document.getElementById('journalContent').value.trim();
    const mood = document.querySelector('input[name="mood"]:checked').value;
    const date = document.getElementById('journalDate').value;

    if (!title || !content) {
        showNotification("Por favor completa todos los campos", "error");
        return;
    }

    const payload = {
        title,
        content,
        mood,
        date: new Date(date).toISOString()
    };

    fetch(local_url + `journals/${journalId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.contraseña
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error al actualizar');
            });
        }
        return response.json();
    })
    .then(data => {
        showNotification("¡Entrada actualizada!", "success");
        
        // Restaurar botón
        const submitBtn = document.querySelector('.create-entry-btn');
        submitBtn.textContent = 'Crear entrada';
        submitBtn.onclick = () => createJournal(new Event('submit'));

        setTimeout(() => {
            loadJournals();
            switchScreen('entries-list-screen');
        }, 1500);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, "error");
    });
}

// ==========================================
// FUNCIONES DE IMÁGENES
// ==========================================

function uploadImage(event, journalId) {
    const file = event.target.files[0];
    if (!file) return;

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        showNotification("Debes iniciar sesión", "error");
        return;
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
        showNotification("La imagen no puede exceder 5MB", "error");
        return;
    }

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showNotification("Solo se permiten JPG, PNG, GIF y WebP", "error");
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    fetch(local_url + `journals/${journalId}/upload`, {
        method: 'POST',
        headers: {
            'x-auth': user.contraseña
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error al subir imagen');
            });
        }
        return response.json();
    })
    .then(data => {
        showNotification("¡Imagen cargada!", "success");
        loadJournalDetail(journalId);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, "error");
    });
}

function deleteImage(journalId, imagePath) {
    if (!confirm("¿Eliminar esta imagen?")) return;

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `journals/${journalId}/image`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.contraseña
        },
        body: JSON.stringify({ imagePath })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al eliminar imagen');
        return response.json();
    })
    .then(data => {
        showNotification("¡Imagen eliminada!", "success");
        loadJournalDetail(journalId);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al eliminar la imagen", "error");
    });
}

// FUNCIONES DE ELIMINACIÓN

function deleteJournal(journalId) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta entrada?")) return;

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `journals/${journalId}`, {
        method: 'DELETE',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al eliminar');
        return response.json();
    })
    .then(data => {
        showNotification("¡Entrada eliminada!", "success");
        const card = document.getElementById(`journal-${journalId}`);
        if (card) {
            card.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => card.remove(), 300);
        }
        loadJournals();
        switchScreen('entries-list-screen');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al eliminar la entrada", "error");
    });
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

function switchScreen(screenId) {
    document.querySelectorAll('.screen-wrapper').forEach(screen => {
        screen.style.display = 'none';
    });

    const selectedScreen = document.getElementById(screenId);
    if (selectedScreen) {
        selectedScreen.style.display = 'flex';
    }
}

function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function initJournals() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = local_url;
        return;
    }

    // Cargar entradas al iniciar
    loadJournals();

    // Event listener para formulario
    const form = document.getElementById('journalForm');
    if (form) {
        form.addEventListener('submit', createJournal);
    }

    // Botón de atrás
    const backBtn = document.querySelector('.back-btn-main');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = local_url + 'home.html';
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJournals);
} else {
    initJournals();
}