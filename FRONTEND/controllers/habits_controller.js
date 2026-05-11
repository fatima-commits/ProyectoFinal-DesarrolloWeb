const daysMap = {
    'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 7
};
const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ==========================================
// ESTADO DE HÁBITOS COMPLETADOS (local)
// ==========================================

// Clave de hoy en formato YYYY-MM-DD para consistencia
function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

// Carga el mapa de completados desde localStorage
function getCompletedHabits() {
    return JSON.parse(localStorage.getItem('completedHabits')) || {};
}

// Verifica si un hábito está completado hoy
function isHabitDoneToday(habitId) {
    const completed = getCompletedHabits();
    return !!(completed[habitId] && completed[habitId][getTodayKey()]);
}

// Marca o desmarca un hábito para hoy y actualiza la tarjeta en el DOM
function toggleHabit(habitId) {
    const completed = getCompletedHabits();
    const today = getTodayKey();

    if (!completed[habitId]) completed[habitId] = {};

    const wasDone = !!completed[habitId][today];

    if (wasDone) {
        delete completed[habitId][today];
    } else {
        completed[habitId][today] = true;
    }

    localStorage.setItem('completedHabits', JSON.stringify(completed));

    // Actualizar la tarjeta en el DOM sin recargar toda la lista
    const card = document.getElementById(`habit-${habitId}`);
    if (card) {
        const btn   = card.querySelector('.btn-check');
        const title = card.querySelector('.habit-card-title');
        const sub   = card.querySelector('.habit-card-subtitle');

        if (wasDone) {
            // Desmarcar
            card.classList.remove('completed');
            if (btn)   { btn.textContent = '○'; btn.classList.remove('done'); }
            if (title) title.classList.remove('crossed');
            if (sub)   sub.classList.remove('crossed');
            showNotification('Hábito desmarcado', 'info');
        } else {
            // Marcar como completado
            card.classList.add('completed');
            if (btn)   { btn.textContent = '✓'; btn.classList.add('done'); }
            if (title) title.classList.add('crossed');
            if (sub)   sub.classList.add('crossed');
            showNotification('¡Hábito completado! 🎉', 'success');
        }
    }
}

// ==========================================
// FORMULARIO / COLORES
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

    const title   = document.getElementById('habitTitle')?.value.trim();
    const trigger = document.getElementById('habitTrigger')?.value.trim();
    const icon    = document.getElementById('habitIcon')?.value.trim();

    const dayButtons = document.querySelectorAll('.day-selector.active');
    const days = Array.from(dayButtons).map(btn => {
        const dayText = btn.textContent.trim();
        return daysMap[dayText] || parseInt(dayText);
    });

    const colorDot = document.querySelector('.color-dot.active');
    const color    = colorDot?.getAttribute('data-color') || 'orange';

    if (!title)          return showNotification("El título del hábito es obligatorio", "error");
    if (!trigger)        return showNotification("El disparador (trigger) es obligatorio", "error");
    if (days.length === 0) return showNotification("Debe seleccionar al menos un día", "error");
    if (!icon)           return showNotification("El icono es obligatorio", "error");

    const payload = { title, trigger, days, color, icon };

    fetch(local_url + 'habits', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': sessionStorage.getItem('password')
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.error || 'Error al crear el hábito'); });
        return response.json();
    })
    .then(() => {
        showNotification("¡Hábito creado correctamente!", "success");
        document.getElementById('habitForm')?.reset();
        setTimeout(() => { loadHabits(); switchScreen('all-habits'); }, 1500);
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification(error.message || "Error al crear el hábito", "error");
    });
}

// ==========================================
// CARGA Y RENDERIZADO DE HÁBITOS
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
        displayHabits(data.data, !day);
    })
    .catch(err => showNotification(err.message, "error"));

    updateFilterVisual(day);
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
    const card    = document.createElement('div');
    const isDone  = isHabitDoneToday(habit._id);

    card.className = `habit-card ${habit.color}-bg${isDone ? ' completed' : ''}`;
    card.id = `habit-${habit._id}`;

    const daysDisplay = habit.days.map(d => dayNames[d - 1]).join(' ');

    card.innerHTML = `
    <div class="habit-card-top">
        <div class="habit-card-left">
            <span class="habit-card-icon">${habit.icon}</span>
            <div class="habit-card-info">
                <h3 class="habit-card-title${isDone ? ' crossed' : ''}">${habit.title}</h3>
                <p class="habit-card-subtitle${isDone ? ' crossed' : ''}">Después de ${habit.trigger}</p>
            </div>
        </div>
        <button class="btn-check ${isDone ? 'done' : ''}"
                title="${isDone ? 'Desmarcar hábito' : 'Marcar como completado'}"
                onclick="toggleHabit(\`${habit._id}\`)">
            ${isDone ? '✓' : '○'}
        </button>
    </div>
    <div class="habit-card-days">
        ${habit.days.map(d => `<span class="day-badge">${dayNames[d - 1]}</span>`).join('')}
    </div>
    <div class="habit-card-actions">
        <button class="btn-small btn-edit" onclick="editHabit(\`${habit._id}\`)">Editar</button>
        <button class="btn-small btn-delete" onclick="deleteHabit(\`${habit._id}\`)">Eliminar</button>
    </div>
`;

    return card;
}

// ==========================================
// EDICIÓN DE HÁBITOS
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

        const submitBtn = document.querySelector('.create-habit-btn');
        submitBtn.textContent = 'Crear nuevo hábito';
        submitBtn.type = 'submit';
        submitBtn.onclick = null;

        showNotification("¡Hábito actualizado correctamente!", "success");
    })
    .catch(err => showNotification(err.message || "Error al actualizar", "error"));
}

// ==========================================
// ELIMINACIÓN
// ==========================================

function deleteHabit(habitId) {
    if (!confirm("¿Está seguro de que desea eliminar este hábito?")) return;

    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + `habits/${habitId}`, {
        method: 'DELETE',
        headers: { 'x-auth': sessionStorage.getItem('password') }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al eliminar');
        return response.json();
    })
    .then(() => {
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

function switchScreen(screen) {
    // Asegurar que screen viene sin el sufijo '-screen'
    const screenName = screen === 'all-habits' ? 'all-habits-screen' : 'new-habit-screen';
    document.querySelectorAll('.screen-wrapper').forEach(s => {
        s.style.display = 'none';
    });
    const selectedScreen = document.getElementById(screenName);
    if (selectedScreen) selectedScreen.style.display = 'flex';
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
    setTimeout(() => { notification.classList.remove('show'); }, 3000);
}

function formatDays(days) {
    return days.map(d => dayNames[d - 1]).join(', ');
}

function getDayFromButton(buttonText) {
    const dayMap = { 'Todos': null, 'L': 1, 'M': 2, 'X': 3, 'J': 4, 'V': 5, 'S': 6, 'D': 7 };
    return dayMap[buttonText];
}

function updateFilterVisual(activeDay) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));

    if (activeDay === null || activeDay === undefined) {
        filterButtons[0].classList.add('active');
        return;
    }

    const dayToIndex = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 };
    const buttonIndex = dayToIndex[activeDay];
    if (buttonIndex && filterButtons[buttonIndex]) {
        filterButtons[buttonIndex].classList.add('active');
    }
}

function goBack() {
    window.location.href = local_url + 'home.html';
}

// ==========================================
// HOY
// ==========================================

function loadToday() {
    const jsDay   = new Date().getDay();
    const todayMap = { 0: 7, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 };
    loadHabits(todayMap[jsDay]);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

function initHabits() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return window.location.href = local_url;

    loadHabits();

    const form = document.getElementById('habitForm');
    if (form) form.addEventListener('submit', createHabit);

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

document.addEventListener('DOMContentLoaded', initHabits);