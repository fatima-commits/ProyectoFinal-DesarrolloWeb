// Variables globales
let currentMoodValue = 0;
let todayMoodId = null;
let allMoods = [];

const moodColors = {
    'Angry': '#c0392b',
    'Sad':   '#385196',
    'Okay':  '#f5a623',
    'Happy': '#23a133'
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
function initMoodTracker() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return window.location.href = local_url;

    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    //Primero inicializar slider en 0
    currentMoodValue = 0;
    const slider = document.getElementById('moodSlider');
    if (slider) {
        slider.value = 0;
        slider.addEventListener('input', (e) => {
            currentMoodValue = Number(e.target.value);
            updateMoodUI(currentMoodValue);
        });
    }
    updateMoodUI(0);

    // Luego cargar datos reales
    //loadTodayMood();
    loadWeeklyMoods();

    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveMood);

    const toggleBtn = document.getElementById('toggleCalendar');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleCalendar);
}

// ==========================================
// UI
// ==========================================
function getMoodByIndex(index) {
    const labels = ['Angry', 'Sad', 'Okay', 'Happy'];
    const label = labels[index];
    return { label, color: moodColors[label] };
}

function updateMoodUI(value) {
    const index = Math.min(3, Math.floor(value / 25));
    const mood = getMoodByIndex(index);

    document.documentElement.style.setProperty('--thumb-color', mood.color);
    document.querySelectorAll('.ring').forEach(r => r.style.borderColor = mood.color);

    const moodLabel = document.getElementById('moodLabel');
    if (moodLabel) { moodLabel.textContent = mood.label; moodLabel.style.color = mood.color; }

    const faceColor = document.getElementById('faceColor');
    if (faceColor) faceColor.setAttribute('fill', mood.color);

    updateMouthAndEyes(mood.label);
}

function updateMouthAndEyes(label) {
    const mouthPath = document.getElementById('mouthPath');
    const eyeL = document.getElementById('eyeL');
    const eyeR = document.getElementById('eyeR');

    const mouths = {
        'Happy': 'M 30 62 Q 50 78 70 62',
        'Okay':  'M 33 65 Q 50 68 67 65',
        'Sad':   'M 30 70 Q 50 58 70 70',
        'Angry': 'M 30 72 Q 50 68 67 65'
    };

    if (mouthPath && mouths[label]) mouthPath.setAttribute('d', mouths[label]);

    if (eyeL && eyeR) {
        if (label === 'Angry') {
            eyeL.setAttribute('cy', '43'); eyeR.setAttribute('cy', '43');
            eyeL.setAttribute('r', '4');   eyeR.setAttribute('r', '4');
        } else if (label === 'Sad') {
            eyeL.setAttribute('cy', '42'); eyeR.setAttribute('cy', '42');
            eyeL.setAttribute('r', '5');   eyeR.setAttribute('r', '5');
        } else {
            eyeL.setAttribute('cy', '40'); eyeR.setAttribute('cy', '40');
            eyeL.setAttribute('r', '5');   eyeR.setAttribute('r', '5');
        }
    }
}

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
    alert(message);
}

// ==========================================
// BACKEND
// ==========================================
function loadTodayMood() {
    const password = sessionStorage.getItem('password');
    if (!password) return;

    fetch('/moods/today/data', {
        headers: { 'x-auth': password }
    })
    .then(res => {
        if (!res.ok) return null;
        return res.json();
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
    .catch(() => console.log('Sin mood para hoy'));
}

function loadWeeklyMoods() {
    const password = sessionStorage.getItem('password');
    if (!password) return;

    fetch('/moods/week/data', {
        headers: { 'x-auth': password }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al cargar');
        return res.json();
    })
    .then(weekData => displayWeeklyCalendar(weekData))
    .catch(err => console.error('Error:', err));
}

function displayWeeklyCalendar(weekData) {
    const weekRow = document.getElementById('weekRow');
    if (!weekRow) return;

    weekRow.innerHTML = '';
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
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
    }
}

function saveMood() {
    const password = sessionStorage.getItem('password');
    if (!password) return window.location.href = local_url;

    const endpoint = todayMoodId ? `/moods/${todayMoodId}` : '/moods';
    const method   = todayMoodId ? 'PATCH' : 'POST';

    fetch(endpoint, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-auth': password
        },
        body: JSON.stringify({
            moodValue: currentMoodValue,
            date: new Date().toISOString()
        })
    })
    .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
        return res.json();
    })
    .then(data => {
        if (!todayMoodId) todayMoodId = data.mood.id;
        showMoodNotification('¡Mood guardado!');
        loadWeeklyMoods();
    })
    .catch(err => showMoodNotification('Error: ' + err.message, 'error'));
}

// ==========================================
// INICIALIZAR
// ==========================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMoodTracker);
} else {
    initMoodTracker();
}