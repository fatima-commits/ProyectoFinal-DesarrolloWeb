// ==========================================
// CONTROLADOR DE HÁBITOS - FRONTEND
// ==========================================

const daysMap = {
    'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 7
};
const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ==========================================
// FUNCIONES DE CREACIÓN
// ==========================================
function selectColor(dot) {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
}

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
            'x-auth': sessionStorage.getItem('password')
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
        alert("¡Hábito creado correctamente!");
        
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

    let url = '/habits?limit=100';
    if (day) url += `&day=${day}`;

    fetch(url, {
        headers: { 'x-auth': sessionStorage.getItem('password') }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al cargar hábitos');
        return res.json();
    })
    .then(data => {
        //Aqui quito la animacion cada que filtras, solo se pone en todos
        displayHabits(data.data, !day);
    })
    .catch(err => showNotification(err.message, "error"));
}

function displayHabits(habits, animated = false) {
    const list = document.getElementById('habitsList');
    if (!list) return;

    list.innerHTML = '';

    if (habits.length === 0) {
        list.innerHTML = '<p class="no-habits">No hay hábitos creados aún.</p>';
        return;
    }

    habits.forEach((habit, index) => {
        const card = createHabitCard(habit);
        if (animated) {
            card.style.animation = `scaleIn 0.6s ease-out ${0.25 + index * 0.05}s forwards`;
            card.style.opacity = '0';
        }
        list.appendChild(card);
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
    fetch(`/habits/${habitId}`, {
        headers: { 'x-auth': sessionStorage.getItem('password') }
    })
    .then(res => res.json())
    .then(habit => {
        document.getElementById('habitTitle').value   = habit.title;
        document.getElementById('habitTrigger').value = habit.trigger;
        document.getElementById('habitIcon').value    = habit.icon;

        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.classList.toggle('active', dot.getAttribute('data-color') === habit.color);
        });

        document.querySelectorAll('.day-selector').forEach(btn => {
            btn.classList.toggle('active', habit.days.includes(Number(btn.getAttribute('data-day'))));
        });

        // ← Cambiar tipo del botón a 'button' para que no dispare submit
        const submitBtn = document.querySelector('.create-habit-btn');
        submitBtn.textContent = 'Actualizar hábito';
        submitBtn.type = 'button';
        submitBtn.onclick = () => updateHabitSubmit(habitId);

        switchScreen('new-habit');
    })
    .catch(() => showNotification("Error al cargar el hábito", "error"));
}

function updateHabitSubmit(habitId) {
    const title   = document.getElementById('habitTitle').value.trim();
    const trigger = document.getElementById('habitTrigger').value.trim();
    const icon    = document.getElementById('habitIcon').value.trim();
    const days    = Array.from(document.querySelectorAll('.day-selector.active'))
                        .map(btn => Number(btn.getAttribute('data-day')));
    const color   = document.querySelector('.color-dot.active')?.getAttribute('data-color') || 'orange';

    if (!title || !trigger || !icon || days.length === 0) {
        return showNotification("Completa todos los campos", "error");
    }

    fetch(`/habits/${habitId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': sessionStorage.getItem('password')
        },
        body: JSON.stringify({ title, trigger, days, color, icon })
    })
    .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
        return res.json();
    })
    .then(() => {
        switchScreen('all-habits');
        loadHabits();

        // ← Regresar el botón a su estado original
        const submitBtn = document.querySelector('.create-habit-btn');
        submitBtn.textContent = 'Crear nuevo hábito';
        submitBtn.type = 'submit';
        submitBtn.onclick = null;

        alert("¡Hábito actualizado correctamente!");
    })
    .catch(err => showNotification(err.message || "Error al actualizar", "error"));
}

function toggleHabitStatus(habitId) {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    // Primero obtener el hábito actual
    fetch(local_url + `habits/${habitId}`, {
        method: 'GET',
        headers: {
            'x-auth': sessionStorage.getItem('password')
        }
    })
    .then(response => response.json())
    .then(habit => {
        const newStatus = habit.status === 'active' ? 'paused' : 'active';
        
        return fetch(local_url + `habits/${habitId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-auth': sessionStorage.getItem('password')
            },
            body: JSON.stringify({ status: newStatus })
        });
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cambiar estado');
        return response.json();
    })
    .then(data => {
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
            'x-auth': sessionStorage.getItem('password')
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
    if (!user) return window.location.href = local_url;

    loadHabits();

    // ← Usamos una función nombrada para poder removerla después
    const form = document.getElementById('habitForm');
    if (form) {
        form.addEventListener('submit', createHabit);
    }

    document.querySelectorAll('.day-selector').forEach(btn => {
        btn.addEventListener('click', function() { this.classList.toggle('active'); });
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const backBtn = document.querySelector('.back-btn-main');
    if (backBtn) backBtn.addEventListener('click', goBack);

    const btnNuevo = document.getElementById('btnNuevoHabito');
    if (btnNuevo) btnNuevo.addEventListener('click', () => switchScreen('new-habit'));
}

//Ver habitos de hoy
function loadToday() {
    const jsDay = new Date().getDay();
    const todayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    const today = todayMap[jsDay];
    loadHabits(today);
}

function goBack() {
    window.location.href = local_url + 'home.html';
}

document.addEventListener('DOMContentLoaded', initHabits);