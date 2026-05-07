const now = new Date();
let currentEditingId = null;
let allJournals = [];
let selectedImageFile = null;

function initJournals() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) return window.location.href = local_url;

    const dateEl = document.getElementById('todayDate');
    if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('es-MX', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    loadJournals();

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function openCreateModal() {
    currentEditingId = null;
    document.getElementById('journalInput').value = '';
    document.getElementById('modalDeleteBtn').style.display = 'none';
    removeImage();
    document.getElementById('modalDate').textContent = now.toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    document.getElementById('journalModal').style.display = 'flex';
    document.getElementById('journalInput').focus();
}

function openEditModal(journalId) {
    const journal = allJournals.find(j => j._id === journalId);
    if (!journal) return;

    currentEditingId = journalId;
    document.getElementById('journalInput').value = journal.content;
    document.getElementById('modalDeleteBtn').style.display = 'block';
    removeImage();
    document.getElementById('modalDate').textContent = new Date(journal.date).toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    if (journal.images && journal.images.length > 0) {
        previewImg.src = journal.images[0];
        imagePreview.style.display = 'block';
        const removeBtn = imagePreview.querySelector('button');
        removeBtn.textContent = '✕ Eliminar imagen';
        removeBtn.onclick = () => deleteJournalImage(journalId, journal.images[0]);
    }

    document.getElementById('journalModal').style.display = 'flex';
    document.getElementById('journalInput').focus();
}

function closeModal(event) {
    if (event && event.target.id !== 'journalModal') return;
    document.getElementById('journalModal').style.display = 'none';
    currentEditingId = null;
}

function previewImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedImageFile = null;
    const input = document.getElementById('imageInput');
    const preview = document.getElementById('imagePreview');
    if (input) input.value = '';
    if (preview) preview.style.display = 'none';
}

function deleteJournalImage(journalId, imagePath) {
    if (!confirm('¿Eliminar esta imagen?')) return;

    const password = sessionStorage.getItem('password');
    if (!password) return;

    fetch(`/journals/${journalId}/image`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'x-auth': password
        },
        body: JSON.stringify({ imagePath })
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al eliminar imagen');
        return res.json();
    })
    .then(() => {
        alert('Imagen eliminada');
        const journal = allJournals.find(j => j._id === journalId);
        if (journal) journal.images = [];
        document.getElementById('imagePreview').style.display = 'none';
    })
    .catch(err => alert('❌ Error: ' + err.message));
}

function saveJournal() {
    const content = document.getElementById('journalInput').value.trim();

    if (!content && !selectedImageFile) {
        alert('Por favor escribe algo o agrega una imagen');
        return;
    }

    const password = sessionStorage.getItem('password');
    if (!password) return window.location.href = local_url;

    const payload = {
        title: content ? content.substring(0, 50) + (content.length > 50 ? '...' : '') : 'Sin título',
        content: content || ' ',
        mood: '😊',
        date: new Date().toISOString()
    };

    const endpoint = currentEditingId ? `/journals/${currentEditingId}` : `/journals`;
    const method = currentEditingId ? 'PATCH' : 'POST';

    fetch(endpoint, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-auth': password
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.error) });
        return res.json();
    })
    .then(async data => {
        const journalId = data.journal?._id || currentEditingId;

        if (selectedImageFile && journalId) {
            const formData = new FormData();
            formData.append('image', selectedImageFile);

            const uploadRes = await fetch(`/journals/${journalId}/upload`, {
                method: 'POST',
                headers: { 'x-auth': password },
                body: formData
            });

            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Error al subir imagen');
        }

        loadJournals();
        alert('¡Entrada guardada!');
        removeImage();
        closeModal();
        
    })
    .catch(err => {
        console.error('Error:', err);
        alert('❌ Error: ' + err.message);
    });
}

function loadJournals() {
    const password = sessionStorage.getItem('password');
    if (!password) return;

    fetch('/journals?limit=100', {
        headers: { 'x-auth': password }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al cargar entradas');
        return res.json();
    })
    .then(data => {
        allJournals = data.data;
        displayJournals(data.data);
    })
    .catch(err => {
        console.error('Error:', err);
        document.getElementById('entriesList').innerHTML = '<p class="no-entries">❌ Error al cargar las entradas</p>';
    });
}

function displayJournals(journals) {
    const entriesList = document.getElementById('entriesList');
    const todayCard = document.getElementById('todayCard');

    if (journals.length === 0) {
        entriesList.innerHTML = '<p class="no-entries">No hay entradas aún</p>';
        if (todayCard) todayCard.style.display = 'none';
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayEntries = journals.filter(j => new Date(j.date).toISOString().split('T')[0] === today);
    const todayEntry = todayEntries[0];

    if (todayEntry && todayCard) {
        document.getElementById('todayPreview').textContent =
            todayEntry.content.substring(0, 100) + (todayEntry.content.length > 100 ? '...' : '');
        todayCard.style.display = 'flex';
        todayCard.onclick = () => openEditModal(todayEntry._id);
    } else if (todayCard) {
        todayCard.style.display = 'none';
    }

    const pastEntries = journals.filter(j => j._id !== todayEntry?._id);

    if (pastEntries.length === 0) {
        entriesList.innerHTML = '<p class="no-entries">No hay más entradas</p>';
        return;
    }

    entriesList.innerHTML = pastEntries.map(entry => `
        <div class="entry-card" onclick="openEditModal(\`${entry._id}\`)">
            <div class="entry-card-top">
                <span class="entry-card-date">${new Date(entry.date).toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}</span>
                <div style="display:flex; gap:6px;">
                    <button class="entry-edit-btn" onclick="event.stopPropagation(); openEditModal(\`${entry._id}\`)">Editar</button>
                    <button class="entry-delete-btn" onclick="event.stopPropagation(); deleteEntryById(\`${entry._id}\`)">Eliminar</button>
                </div>
            </div>
            ${entry.images && entry.images.length > 0
                ? `<img src="${entry.images[0]}" style="width:100%; border-radius:8px; margin-top:8px; object-fit:cover; max-height:150px;" onerror="this.style.display='none'">`
                : ''}
            <p class="entry-card-text">${entry.content.substring(0, 100)}${entry.content.length > 100 ? '...' : ''}</p>
        </div>
    `).join('');
}

function deleteCurrentJournal() {
    if (!confirm('¿Estás seguro de que deseas eliminar esta entrada?')) return;

    const password = sessionStorage.getItem('password');
    if (!password) return;

    fetch(`/journals/${currentEditingId}`, {
        method: 'DELETE',
        headers: { 'x-auth': password }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al eliminar');
        return res.json();
    })
    .then(() => {
        alert('Entrada eliminada');
        closeModal();
        loadJournals();
    })
    .catch(err => alert('❌ Error: ' + err.message));
}

function deleteEntryById(journalId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta entrada?')) return;

    const password = sessionStorage.getItem('password');
    if (!password) return;

    fetch(`/journals/${journalId}`, {
        method: 'DELETE',
        headers: { 'x-auth': password }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al eliminar');
        return res.json();
    })
    .then(() => {
        alert('Entrada eliminada');
        loadJournals();
    })
    .catch(err => alert('❌ Error: ' + err.message));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJournals);
} else {
    initJournals();
}