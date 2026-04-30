// ==========================================
// CONTROLADOR DE HÁBITOS - FRONTEND
// ==========================================

const local_url = "http://localhost:3000/";
const daysMap = {
    'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 7
};
const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ==========================================
// FUNCIONES DE CREACIÓN
// ==========================================

function createHabit(event) {
    event.preventDefault();

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        alert("Debes iniciar sesión primero");
        window.location.href = local_url;
        return;
    }

    // Obtener valores del formulario
    const title = document.getElementById('habitTitle')?.value.trim();
    const trigger = document.getElementById('habitTrigger')?.value.trim();
    const icon = document.getElementById('habitIcon')?.value.trim();
    
    // Obtener días seleccionados
    const dayButtons = document.querySelectorAll('.day-selector.active');
    const days = Array.from(dayButtons).map(btn => {
        const dayText = btn.textContent.trim();
        return daysMap[dayText] || parseInt(dayText);
    });

    // Obtener color seleccionado
    const colorDot = document.querySelector('.color-dot.active');
    const color = colorDot?.getAttribute('data-color') || 'orange';

    // Validaciones
    if (!title) {
        showNotification("El título del hábito es obligatorio", "error");
        return;
    }

    if (!trigger) {
        showNotification("El disparador (trigger) es obligatorio", "error");
        return;
    }

    if (days.length === 0) {
        showNotification("Debe seleccionar al menos un día", "error");
        return;
    }

    if (!icon) {
        showNotification("El icono es obligatorio", "error");
        return;
    }

    // Construir payload
    const payload = {
        title,
        trigger,
        days,
        color,
        icon
    };

    // Enviar al servidor
    fetch(local_url + 'habits', {
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
                throw new Error(err.error || 'Error al crear el hábito');
            });
        }
        return response.json();
    })
    .then(data => {
        showNotification("¡Hábito creado correctamente!", "success");
        
        // Limpiar formulario
        document.getElementById('habitForm')?.reset();
        
        // Recargar hábitos
        setTimeout(() => {
            loadHabits();
            switchScreen('all-habits');
        }, 1500);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || "Error al crear el hábito", "error");
    });
}

// ==========================================
// FUNCIONES DE LECTURA
// ==========================================

function loadHabits(day = null) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    let url = local_url + 'habits?limit=100';
    
    // Si se especifica un día, filtrar por ese día
    if (day) {
        url += `&day=${day}`;
    }

    fetch(url, {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar hábitos');
        return response.json();
    })
    .then(data => {
        displayHabits(data.data);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al cargar los hábitos", "error");
    });
}

function displayHabits(habits) {
    const habitsList = document.getElementById('habitsList');
    if (!habitsList) return;

    // Limpiar
    habitsList.innerHTML = '';

    if (habits.length === 0) {
        habitsList.innerHTML = '<p class="no-habits">No hay hábitos creados aún.</p>';
        return;
    }

    habits.forEach(habit => {
        const habitCard = createHabitCard(habit);
        habitsList.appendChild(habitCard);
    });
}

function createHabitCard(habit) {
    const card = document.createElement('div');
    card.className = `habit-card ${habit.color}-bg`;
    card.id = `habit-${habit.id}`;

    const daysDisplay = habit.days.map(d => dayNames[d - 1]).join(' ');
    const statusBadge = habit.status === 'active' ? 
        '<span class="status-badge active">Activo</span>' : 
        '<span class="status-badge paused">Pausado</span>';

    card.innerHTML = `
        <div class="habit-card-header">
            <span class="habit-card-icon">${habit.icon}</span>
            ${statusBadge}
        </div>
        <div class="habit-card-content">
            <h3 class="habit-card-title">${habit.title}</h3>
            <p class="habit-card-subtitle">${habit.trigger}</p>
        </div>
        <div class="habit-card-days">
            ${habit.days.map(day => `<span class="day-badge">${dayNames[day - 1]}</span>`).join('')}
        </div>
        <div class="habit-card-actions">
            <button class="btn-small btn-edit" onclick="editHabit(${habit.id})">Editar</button>
            <button class="btn-small btn-delete" onclick="deleteHabit(${habit.id})">Eliminar</button>
            <button class="btn-small btn-${habit.status}" onclick="toggleHabitStatus(${habit.id})">
                ${habit.status === 'active' ? 'Pausar' : 'Reactivar'}
            </button>
        </div>
    `;

    return card;
}

// ==========================================
// FUNCIONES DE ACTUALIZACIÓN
// ==========================================

function editHabit(habitId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `habits/${habitId}`, {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar el hábito');
        return response.json();
    })
    .then(habit => {
        // Llenar el formulario con los datos del hábito
        document.getElementById('habitTitle').value = habit.title;
        document.getElementById('habitTrigger').value = habit.trigger;
        document.getElementById('habitIcon').value = habit.icon;

        // Seleccionar color
        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('data-color') === habit.color) {
                dot.classList.add('active');
            }
        });

        // Seleccionar días
        document.querySelectorAll('.day-selector').forEach(btn => {
            btn.classList.remove('active');
        });
        
        habit.days.forEach(day => {
            const dayBtn = document.querySelector(`.day-selector[data-day="${day}"]`);
            if (dayBtn) dayBtn.classList.add('active');
        });

        // Cambiar función del botón
        const submitBtn = document.querySelector('.create-habit-btn');
        submitBtn.textContent = 'Actualizar hábito';
        submitBtn.onclick = () => updateHabitSubmit(habitId);

        // Mostrar pantalla de edición
        switchScreen('new-habit');
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al cargar el hábito", "error");
    });
}

function updateHabitSubmit(habitId) {
    const event = new Event('submit');
    
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        alert("Debes iniciar sesión primero");
        return;
    }

    const title = document.getElementById('habitTitle').value.trim();
    const trigger = document.getElementById('habitTrigger').value.trim();
    const icon = document.getElementById('habitIcon').value.trim();
    
    const dayButtons = document.querySelectorAll('.day-selector.active');
    const days = Array.from(dayButtons).map(btn => {
        const dayText = btn.textContent.trim();
        return daysMap[dayText] || parseInt(dayText);
    });

    const colorDot = document.querySelector('.color-dot.active');
    const color = colorDot?.getAttribute('data-color') || 'orange';

    if (!title || !trigger || days.length === 0 || !icon) {
        showNotification("Por favor completa todos los campos", "error");
        return;
    }

    const payload = { title, trigger, days, color, icon };

    fetch(local_url + `habits/${habitId}`, {
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
        showNotification("¡Hábito actualizado!", "success");
        
        // Restaurar botón
        const submitBtn = document.querySelector('.create-habit-btn');
        submitBtn.textContent = 'Crear nuevo hábito';
        submitBtn.onclick = () => createHabit(new Event('submit'));

        // Recargar
        setTimeout(() => {
            loadHabits();
            switchScreen('all-habits');
        }, 1500);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message, "error");
    });
}

function toggleHabitStatus(habitId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Primero obtener el hábito actual
    fetch(local_url + `habits/${habitId}`, {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => response.json())
    .then(habit => {
        const newStatus = habit.status === 'active' ? 'paused' : 'active';
        
        return fetch(local_url + `habits/${habitId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth': user.contraseña
            },
            body: JSON.stringify({ status: newStatus })
        });
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cambiar estado');
        return response.json();
    })
    .then(data => {
        showNotification("Estado del hábito actualizado", "success");
        loadHabits();
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al actualizar el estado", "error");
    });
}

// ==========================================
// FUNCIONES DE ELIMINACIÓN
// ==========================================

function deleteHabit(habitId) {
    if (!confirm("¿Está seguro de que desea eliminar este hábito?")) {
        return;
    }

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `habits/${habitId}`, {
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
        showNotification("¡Hábito eliminado correctamente!", "success");
        const card = document.getElementById(`habit-${habitId}`);
        if (card) {
            card.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => card.remove(), 300);
        }
        loadHabits();
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification("Error al eliminar el hábito", "error");
    });
}

// ==========================================
// FUNCIONES DE UTILIDAD
// ==========================================

function switchScreen(screenId) {
    document.querySelectorAll('.screen-wrapper').forEach(screen => {
        screen.style.display = 'none';
    });

    const selectedScreen = document.getElementById(screenId + '-screen');
    if (selectedScreen) {
        selectedScreen.style.display = 'flex';
    }
}

function showNotification(message, type = 'info') {
    // Crear o usar notificación existente
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

function formatDays(days) {
    return days.map(d => dayNames[d - 1]).join(', ');
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function initHabits() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = local_url;
        return;
    }

    // Cargar hábitos
    loadHabits();

    // Event listeners para el formulario
    const form = document.getElementById('habitForm');
    if (form) {
        form.addEventListener('submit', createHabit);
    }

    // Event listeners para días
    document.querySelectorAll('.day-selector').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });

    // Event listeners para colores
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Botón de atrás
    const backBtn = document.querySelector('.back-btn-main');
    if (backBtn) {
        backBtn.addEventListener('click', goBack);
    }
}

function goBack() {
    window.location.href = local_url + 'home.html';
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHabits);
} else {
    initHabits();
}