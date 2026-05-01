// Variables globales
let currentMoodValue = 0;
let todayMoodId = null;
let allMoods = [];

// Datos de mood labels y colores
const moodData = {
    0: { label: 'Angry', color: '#c0392b' },
    1: { label: 'Sad', color: '#385196' },
    2: { label: 'Okay', color: '#f5a623' },
    3: { label: 'Happy', color: '#23a133' }
};

const moodColors = {
    'Happy': '#f5c842',
    'Okay': '#f5a623',
    'Sad': '#e06030',
    'Angry': '#c0392b'
};

// ==========================================
// FUNCIONES DE INICIALIZACIÓN
// ==========================================

function initMoodTracker() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = local_url;
        return;
    }

    // Cargar mood de hoy si existe
    loadTodayMood();

    // Event listeners
    const slider = document.getElementById('moodSlider');
    if (slider) {
        slider.addEventListener('input', (e) => {
            currentMoodValue = Number(e.target.value);
            updateMoodUI(currentMoodValue);
        });
    }

    const saveBtn = document.getElementById('saveBtn') || document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveMood);
    }

    // Cargar calendario
    loadWeeklyMoods();

    // Toggle calendario
    const toggleBtn = document.getElementById('toggleCalendar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCalendar);
    }

    // Mostrar fecha de hoy
    const now = new Date();
    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

// ==========================================
// FUNCIONES DE ACTUALIZACIÓN DE UI
// ==========================================

function updateMoodUI(value) {
    const index = Math.min(3, Math.floor(value / 25));
    const mood = getMoodByIndex(index);

    // Actualizar color del slider
    document.documentElement.style.setProperty('--thumb-color', mood.color);

    // Actualizar rings
    const rings = document.querySelectorAll('.ring');
    rings.forEach(r => r.style.borderColor = mood.color);

    // Actualizar label
    const moodLabel = document.getElementById('moodLabel');
    if (moodLabel) {
        moodLabel.textContent = mood.label;
        moodLabel.style.color = mood.color;
    }

    // Actualizar emoji face
    const faceColor = document.getElementById('faceColor');
    if (faceColor) {
        faceColor.setAttribute('fill', mood.color);
    }

    // Actualizar boca
    updateMouthAndEyes(mood.label);
}

function updateMouthAndEyes(label) {
    const mouthPath = document.getElementById('mouthPath');
    const eyeL = document.getElementById('eyeL');
    const eyeR = document.getElementById('eyeR');

    const mouths = {
        'Happy': 'M 30 62 Q 50 78 70 62',
        'Okay': 'M 33 65 Q 50 68 67 65',
        'Sad': 'M 30 70 Q 50 58 70 70',
        'Angry': 'M 30 72 Q 50 68 67 65'
    };

    if (mouthPath && mouths[label]) {
        mouthPath.setAttribute('d', mouths[label]);
    }

    if (eyeL && eyeR) {
        if (label === 'Angry') {
            eyeL.setAttribute('cy', '43');
            eyeR.setAttribute('cy', '43');
            eyeL.setAttribute('r', '4');
            eyeR.setAttribute('r', '4');
        } else if (label === 'Sad') {
            eyeL.setAttribute('cy', '42');
            eyeR.setAttribute('cy', '42');
            eyeL.setAttribute('r', '5');
            eyeR.setAttribute('r', '5');
        } else {
            eyeL.setAttribute('cy', '40');
            eyeR.setAttribute('cy', '40');
            eyeL.setAttribute('r', '5');
            eyeR.setAttribute('r', '5');
        }
    }
}

function getMoodByIndex(index) {
    const moodLabels = ['Angry', 'Sad', 'Okay', 'Happy'];
    const label = moodLabels[index];
    return {
        label: label,
        color: moodColors[label]
    };
}

// ==========================================
// FUNCIONES DE LECTURA
// ==========================================

function loadTodayMood() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + 'moods/today/data', {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) return null;
        return response.json();
    })
    .then(mood => {
        if (mood) {
            todayMoodId = mood.id;
            currentMoodValue = mood.moodValue;
            const slider = document.getElementById('moodSlider');
            if (slider) {
                slider.value = currentMoodValue;
                updateMoodUI(currentMoodValue);
            }
        }
    })
    .catch(error => {
        console.log('Sin mood para hoy');
    });
}

function loadWeeklyMoods() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return;

    fetch(local_url + 'moods/week/data', {
        method: 'GET',
        headers: {
            'x-auth': user.contraseña
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al cargar');
        return response.json();
    })
    .then(weekData => {
        displayWeeklyCalendar(weekData);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayWeeklyCalendar(weekData) {
    const weekRow = document.getElementById('weekRow');
    if (!weekRow) return;

    weekRow.innerHTML = '';
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();

    // Obtener últimos 7 días en orden
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date);
    }

    dates.forEach(date => {
        const dateKey = date.toISOString().split('T')[0];
        const dayLabel = days[date.getDay()];
        const moodForDay = weekData[dateKey];

        const item = document.createElement('div');
        item.className = 'day-item';

        const circle = document.createElement('div');
        circle.className = 'day-circle';
        if (moodForDay) {
            circle.classList.add('filled');
            circle.style.background = moodColors[moodForDay.label];
        }

        const label = document.createElement('span');
        label.className = 'day-label';
        label.textContent = dayLabel;

        item.appendChild(circle);
        item.appendChild(label);
        weekRow.appendChild(item);
    });
}

// ==========================================
// FUNCIONES DE GUARDADO/ACTUALIZACIÓN
// ==========================================

function saveMood() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        alert('Debes iniciar sesión');
        window.location.href = local_url;
        return;
    }

    const payload = {
        moodValue: currentMoodValue,
        date: new Date().toISOString()
    };

    const endpoint = todayMoodId 
        ? local_url + `moods/${todayMoodId}`
        : local_url + 'moods';
    
    const method = todayMoodId ? 'PATCH' : 'POST';

    fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'x-auth': user.contraseña
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.error || 'Error al guardar');
            });
        }
        return response.json();
    })
    .then(data => {
        if (!todayMoodId) {
            todayMoodId = data.mood.id;
        }
        showMoodNotification('¡Mood guardado correctamente!');
        loadWeeklyMoods();
    })
    .catch(error => {
        console.error('Error:', error);
        showMoodNotification('Error al guardar el mood', 'error');
    });
}

// ==========================================
// FUNCIONES DE INTERFAZ
// ==========================================

function toggleCalendar() {
    const calendar = document.getElementById('weeklyCalendar');
    const btn = document.getElementById('toggleCalendar');

    if (!calendar) return;

    if (calendar.style.display === 'none') {
        calendar.style.display = 'block';
        if (btn) btn.textContent = 'Ocultar semana';
    } else {
        calendar.style.display = 'none';
        if (btn) btn.textContent = 'Ver semana';
    }
}

function showMoodNotification(message, type = 'success') {
    let notification = document.getElementById('moodNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'moodNotification';
        notification.className = 'mood-notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = `mood-notification show ${type}`;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMoodTracker);
} else {
    initMoodTracker();
}